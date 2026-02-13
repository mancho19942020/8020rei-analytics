import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/engagement-calls/debug
 * Debug endpoint to see what folders and files are detected in Google Drive
 */
export async function GET() {
  try {
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!credentialsPath || !folderId) {
      return NextResponse.json({
        error: 'Missing environment variables',
        credentialsPath: !!credentialsPath,
        folderId: !!folderId,
      });
    }

    const absolutePath = path.resolve(process.cwd(), credentialsPath);
    const credentials = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 1. Get info about the root folder
    const rootFolder = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
    });

    // 2. List all items in root folder (folders and files)
    const rootContents = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 100,
    });

    // 3. For each subfolder, list its contents
    const subfolderContents: Record<string, any[]> = {};

    for (const item of rootContents.data.files || []) {
      if (item.mimeType === 'application/vnd.google-apps.folder' && item.id) {
        const contents = await drive.files.list({
          q: `'${item.id}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType)',
          pageSize: 100,
        });
        subfolderContents[item.name || item.id] = contents.data.files || [];
      }
    }

    return NextResponse.json({
      success: true,
      rootFolder: rootFolder.data,
      rootContents: rootContents.data.files,
      subfolderContents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
