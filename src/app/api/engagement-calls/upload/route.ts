import { NextRequest, NextResponse } from 'next/server';
import { uploadDocumentWithFolder } from '@/lib/google-drive';
import { clearCache } from '@/lib/cache';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/engagement-calls/upload
 *
 * Upload a new engagement call document
 * - Creates a folder in Google Drive (named after the file)
 * - Uploads the document to that folder
 * - Returns the new document info
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only Word documents (.doc, .docx) are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive (creates folder + uploads file)
    const result = await uploadDocumentWithFolder(file.name, buffer, file.type);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Clear the cache so the new document appears immediately
    clearCache();

    return NextResponse.json({
      success: true,
      data: {
        folderId: result.folderId,
        folderName: result.folderName,
        fileId: result.fileId,
        fileName: result.fileName,
      },
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload document',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
