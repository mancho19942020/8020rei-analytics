import { NextResponse } from 'next/server';
import { getDocumentContent, DocumentContent } from '@/lib/google-drive';
import { getCached, setCache } from '@/lib/cache';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/engagement-calls/[id]
 *
 * Fetches a single engagement call document by ID
 * Returns the full HTML content parsed from the Word document
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check cache (5 minute TTL)
    const cacheKey = `engagement-calls:doc:${id}`;
    const cached = getCached<DocumentContent>(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch document content from Google Drive
    const document = await getDocumentContent(id);

    // Cache the response
    setCache(cacheKey, document);

    return NextResponse.json({
      success: true,
      data: document,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching document:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific Google Drive errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch document',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
