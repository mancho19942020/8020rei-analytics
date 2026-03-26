import { NextResponse } from 'next/server';
import { listDocuments, getDocumentContent, DriveDocument } from '@/lib/google-drive';
import { parseDocumentInsights, getDriveViewUrl } from '@/lib/document-parser';
import { getCached, setCache, clearCacheByPrefix } from '@/lib/cache';

// Extended document type with client insights
interface DocumentWithInsights extends DriveDocument {
  preview?: string;
  clientNames?: string[];
  driveUrl?: string;
}

interface EngagementCallsResponse {
  documents: DocumentWithInsights[];
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
    const refresh = url.searchParams.get('refresh') === 'true';

    // Clear engagement-calls cache entries when refresh is requested
    if (refresh) {
      clearCacheByPrefix('engagement-calls');
    }

    // Check cache (5 minute TTL)
    const cacheKey = `engagement-calls:list:${includePreview}`;
    const cached = !refresh ? getCached<EngagementCallsResponse>(cacheKey) : null;

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

    // Fetch document content and extract client names for card previews
    let documentsWithInsights: DocumentWithInsights[] = documents.map((doc) => ({
      ...doc,
      driveUrl: getDriveViewUrl(doc.id, doc.mimeType),
    }));

    if (includePreview) {
      documentsWithInsights = await Promise.all(
        documents.map(async (doc) => {
          try {
            const content = await getDocumentContent(doc.id);
            const parsed = parseDocumentInsights(content.html, content.text);
            return {
              ...doc,
              clientNames: parsed.clientNames,
              driveUrl: getDriveViewUrl(doc.id, doc.mimeType),
            };
          } catch (error) {
            console.error(`Failed to parse insights for ${doc.name}:`, error);
            return {
              ...doc,
              clientNames: [],
              driveUrl: getDriveViewUrl(doc.id, doc.mimeType),
            };
          }
        })
      );
    }

    const responseData: EngagementCallsResponse = {
      documents: documentsWithInsights,
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
