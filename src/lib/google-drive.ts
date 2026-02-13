import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';

// Types for document data
export interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  folderName?: string;
  folderId?: string;
}

export interface DocumentContent {
  id: string;
  name: string;
  html: string;
  text: string;
  createdTime: string;
  modifiedTime: string;
  folderName?: string;
}

// Singleton drive client
let driveClient: drive_v3.Drive | null = null;

/**
 * Get or create the Google Drive client using service account credentials
 */
function getDriveClient(): drive_v3.Drive {
  if (driveClient) {
    return driveClient;
  }

  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;

  if (!credentialsPath) {
    throw new Error('GOOGLE_DRIVE_CREDENTIALS_PATH environment variable is not set');
  }

  // Resolve the path relative to the project root
  const absolutePath = path.resolve(process.cwd(), credentialsPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Credentials file not found at: ${absolutePath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    // Full drive access for read + write (upload, create folders)
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

/**
 * List all folders in the root engagement calls folder
 */
async function listFolders(parentFolderId: string): Promise<Map<string, string>> {
  const drive = getDriveClient();
  const folderMap = new Map<string, string>();

  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 100,
  });

  for (const folder of response.data.files || []) {
    if (folder.id && folder.name) {
      folderMap.set(folder.id, folder.name);
    }
  }

  return folderMap;
}

/**
 * List all documents in a folder (Word docs AND Google Docs)
 */
export async function listDocuments(includeSubfolders = true): Promise<DriveDocument[]> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is not set');
  }

  const documents: DriveDocument[] = [];
  const folderMap = new Map<string, string>();
  folderMap.set(folderId, 'Root');

  // Get subfolders if needed
  if (includeSubfolders) {
    const subfolders = await listFolders(folderId);
    subfolders.forEach((name, id) => folderMap.set(id, name));
  }

  // Query for documents in each folder
  // Support: Word docs (.docx, .doc) AND Google Docs
  const folderIds = Array.from(folderMap.keys());
  const parentQueries = folderIds.map(id => `'${id}' in parents`).join(' or ');

  const mimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.google-apps.document', // Google Docs
  ];
  const mimeTypeQueries = mimeTypes.map(m => `mimeType = '${m}'`).join(' or ');

  const query = `(${parentQueries}) and (${mimeTypeQueries}) and trashed = false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, createdTime, modifiedTime, parents)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
  });

  for (const file of response.data.files || []) {
    if (file.id && file.name) {
      const parentId = file.parents?.[0];
      documents.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || '',
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        folderId: parentId,
        folderName: parentId ? folderMap.get(parentId) : undefined,
      });
    }
  }

  return documents;
}

/**
 * Get a document's content by ID, parsed to HTML/text
 * Supports both Word documents and Google Docs
 */
export async function getDocumentContent(fileId: string): Promise<DocumentContent> {
  const drive = getDriveClient();

  // First, get file metadata including mimeType
  const metadataResponse = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, createdTime, modifiedTime, parents',
  });

  const metadata = metadataResponse.data;
  const mimeType = metadata.mimeType || '';

  // Get folder name if there's a parent
  let folderName: string | undefined;
  if (metadata.parents?.[0]) {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      const folders = await listFolders(folderId);
      folderName = folders.get(metadata.parents[0]);
    }
  }

  let html: string;
  let text: string;

  // Handle Google Docs (export to HTML)
  if (mimeType === 'application/vnd.google-apps.document') {
    // Export Google Doc as HTML
    const htmlResponse = await drive.files.export({
      fileId,
      mimeType: 'text/html',
    });
    html = htmlResponse.data as string;

    // Export Google Doc as plain text
    const textResponse = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });
    text = textResponse.data as string;

    // Clean up Google's HTML (remove inline styles, etc.)
    html = cleanGoogleDocsHtml(html);
  } else {
    // Handle Word documents (download and parse with mammoth)
    const contentResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(contentResponse.data as ArrayBuffer);

    // Parse Word document to HTML and text
    const result = await mammoth.convertToHtml({ buffer });
    const textResult = await mammoth.extractRawText({ buffer });

    html = result.value;
    text = textResult.value;
  }

  return {
    id: fileId,
    name: metadata.name || '',
    html,
    text,
    createdTime: metadata.createdTime || '',
    modifiedTime: metadata.modifiedTime || '',
    folderName,
  };
}

/**
 * Clean up HTML exported from Google Docs
 * Removes excessive inline styles while preserving structure
 */
function cleanGoogleDocsHtml(html: string): string {
  // Remove the full HTML document wrapper, keep just the body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  }

  // Remove style tags
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove class attributes (Google adds lots of generated class names)
  html = html.replace(/\s+class="[^"]*"/gi, '');

  // Remove id attributes
  html = html.replace(/\s+id="[^"]*"/gi, '');

  // Remove style attributes (inline styles)
  html = html.replace(/\s+style="[^"]*"/gi, '');

  // Remove empty spans
  html = html.replace(/<span>([^<]*)<\/span>/gi, '$1');

  // Remove Google's font tags
  html = html.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');

  // Clean up extra whitespace
  html = html.replace(/\s+/g, ' ').trim();

  return html;
}

/**
 * Get a preview (first N characters) of a document
 */
export async function getDocumentPreview(fileId: string, maxLength = 300): Promise<string> {
  const content = await getDocumentContent(fileId);
  const text = content.text.trim();

  if (text.length <= maxLength) {
    return text;
  }

  // Find a good break point (end of sentence or word)
  let cutoff = maxLength;
  const lastPeriod = text.lastIndexOf('.', maxLength);
  const lastSpace = text.lastIndexOf(' ', maxLength);

  if (lastPeriod > maxLength * 0.7) {
    cutoff = lastPeriod + 1;
  } else if (lastSpace > maxLength * 0.7) {
    cutoff = lastSpace;
  }

  return text.substring(0, cutoff).trim() + '...';
}

// ============================================================================
// UPLOAD FUNCTIONS (Phase 5)
// ============================================================================

export interface UploadResult {
  success: boolean;
  folderId?: string;
  folderName?: string;
  fileId?: string;
  fileName?: string;
  error?: string;
}

/**
 * Create a new folder in the root engagement calls folder
 */
export async function createFolder(folderName: string): Promise<{ id: string; name: string }> {
  const drive = getDriveClient();
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is not set');
  }

  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id, name',
  });

  if (!response.data.id || !response.data.name) {
    throw new Error('Failed to create folder');
  }

  return {
    id: response.data.id,
    name: response.data.name,
  };
}

/**
 * Upload a document to a specific folder
 */
export async function uploadDocument(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  folderId: string
): Promise<{ id: string; name: string }> {
  const drive = getDriveClient();
  const { Readable } = await import('stream');

  // Convert buffer to readable stream
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name',
  });

  if (!response.data.id || !response.data.name) {
    throw new Error('Failed to upload document');
  }

  return {
    id: response.data.id,
    name: response.data.name,
  };
}

/**
 * Upload a document with automatic folder creation
 * Creates a folder named after the document (without extension) and places the doc inside
 */
export async function uploadDocumentWithFolder(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  try {
    // Generate folder name from file name (remove extension)
    const folderName = fileName.replace(/\.(docx?|pdf)$/i, '').trim();

    // Create the folder
    const folder = await createFolder(folderName);

    // Upload the document to the new folder
    const file = await uploadDocument(fileName, fileBuffer, mimeType, folder.id);

    return {
      success: true,
      folderId: folder.id,
      folderName: folder.name,
      fileId: file.id,
      fileName: file.name,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during upload',
    };
  }
}
