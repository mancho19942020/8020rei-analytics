import { NextResponse } from 'next/server';
import { getDocumentContent, DocumentContent } from '@/lib/google-drive';
import { parseDocumentInsights, getDriveViewUrl, ClientInsight } from '@/lib/document-parser';
import { getCached, setCache, clearCacheByPrefix } from '@/lib/cache';

interface DocumentWithInsights extends DocumentContent {
  clients: ClientInsight[];
  driveUrl: string;
}

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

    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    if (refresh) clearCacheByPrefix('engagement-calls');

    // Check cache (5 minute TTL)
    const cacheKey = `engagement-calls:doc:${id}`;
    const cached = !refresh ? getCached<DocumentWithInsights>(cacheKey) : null;

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

    // Parse document into structured client insights
    const parsed = parseDocumentInsights(document.html, document.text);
    const driveUrl = getDriveViewUrl(id, 'application/vnd.google-apps.document');

    const enrichedDocument: DocumentWithInsights = {
      ...document,
      clients: parsed.clients,
      driveUrl,
    };

    // Cache the response
    setCache(cacheKey, enrichedDocument);

    return NextResponse.json({
      success: true,
      data: enrichedDocument,
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
