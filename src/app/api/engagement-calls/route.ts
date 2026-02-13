import { NextResponse } from 'next/server';
import { listDocuments, getDocumentPreview, DriveDocument } from '@/lib/google-drive';
import { getCached, setCache } from '@/lib/cache';

// Extended document type with preview
interface DocumentWithPreview extends DriveDocument {
  preview?: string;
}

interface EngagementCallsResponse {
  documents: DocumentWithPreview[];
  totalCount: number;
}

/**
 * GET /api/engagement-calls
 *
 * Lists all engagement call documents from Google Drive
 * Query params:
 *   - includePreview: boolean (default: true) - include text preview for each doc
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includePreview = url.searchParams.get('includePreview') !== 'false';

    // Check cache (5 minute TTL)
    const cacheKey = `engagement-calls:list:${includePreview}`;
    const cached = getCached<EngagementCallsResponse>(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch documents from Google Drive
    const documents = await listDocuments(true);

    // Optionally fetch previews for each document
    let documentsWithPreview: DocumentWithPreview[] = documents;

    if (includePreview) {
      documentsWithPreview = await Promise.all(
        documents.map(async (doc) => {
          try {
            // Longer preview (400 chars) for taller cards
            const preview = await getDocumentPreview(doc.id, 400);
            return { ...doc, preview };
          } catch (error) {
            console.error(`Failed to get preview for ${doc.name}:`, error);
            return { ...doc, preview: undefined };
          }
        })
      );
    }

    const responseData: EngagementCallsResponse = {
      documents: documentsWithPreview,
      totalCount: documents.length,
    };

    // Cache the response
    setCache(cacheKey, responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching engagement calls:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch engagement calls',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
