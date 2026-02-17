import { BigQuery } from '@google-cloud/bigquery';

export const DATASET = process.env.BIGQUERY_DATASET || 'analytics_489035450';
export const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'web-app-production-451214';

/**
 * Creates the BigQuery client with the correct authentication strategy:
 *
 * LOCAL DEVELOPMENT (what you're using now):
 * - Uses gcloud CLI credentials (Application Default Credentials)
 * - Your personal Google account from: ~/.config/gcloud/application_default_credentials.json
 * - No environment variable needed
 *
 * PRODUCTION (Vercel deployment):
 * - Uses Service Account credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON
 * - The "robot account" we created: analytics-dashboard@web-app-production-451214.iam.gserviceaccount.com
 * - Requires the JSON key as an environment variable
 *
 * This function checks which method to use automatically.
 */
function createBigQueryClient(): BigQuery {
  const projectId = PROJECT;

  // Production: Service Account credentials from environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      );
      console.log('[BigQuery] Using Service Account credentials for production');
      return new BigQuery({ projectId, credentials });
    } catch (error) {
      console.error('[BigQuery] Failed to parse service account credentials:', error);
      throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }
  }

  // Local: uses Application Default Credentials (gcloud CLI)
  console.log('[BigQuery] Using Application Default Credentials (gcloud CLI) for local development');
  return new BigQuery({ projectId });
}

export const bigquery = createBigQueryClient();

export async function runQuery<T>(query: string): Promise<T[]> {
  const [rows] = await bigquery.query({ query });
  return rows as T[];
}

export default bigquery;

// ============================================================================
// PRODUCT DATA (opsHub BigQuery project)
// ============================================================================

export const PRODUCT_PROJECT = process.env.BIGQUERY_PRODUCT_PROJECT || 'bigquery-467404';
export const PRODUCT_DATASET = process.env.BIGQUERY_PRODUCT_DATASET || 'domain';

/**
 * Creates a BigQuery client for the Product/opsHub project.
 * Uses separate credentials from the GA4 project.
 */
function createProductBigQueryClient(): BigQuery {
  const projectId = PRODUCT_PROJECT;

  // Production: Separate service account for opsHub
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON) {
    try {
      const credentials = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON
      );
      console.log('[BigQuery/Product] Using Service Account credentials for production');
      return new BigQuery({ projectId, credentials });
    } catch (error) {
      console.error('[BigQuery/Product] Failed to parse service account credentials:', error);
      throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_PRODUCT_JSON');
    }
  }

  // Local: uses Application Default Credentials (gcloud CLI)
  console.log('[BigQuery/Product] Using Application Default Credentials (gcloud CLI) for local development');
  return new BigQuery({ projectId });
}

export const productBigquery = createProductBigQueryClient();

export async function runProductQuery<T>(query: string): Promise<T[]> {
  const [rows] = await productBigquery.query({ query });
  return rows as T[];
}
