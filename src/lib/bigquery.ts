import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

export const DATASET = process.env.BIGQUERY_DATASET || 'analytics_489035450';
export const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'web-app-production-451214';

export async function runQuery<T>(query: string): Promise<T[]> {
  const [rows] = await bigquery.query({ query });
  return rows as T[];
}

export default bigquery;
