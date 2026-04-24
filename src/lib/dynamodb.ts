import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { ScanCommandInput, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.DYNAMODB_REGION || 'us-east-1';
const ACCESS_KEY = process.env.DYNAMODB_ACCESS_KEY_ID || '';
const SECRET_KEY = process.env.DYNAMODB_SECRET_ACCESS_KEY || '';

export const SKIPTRACE_LOGS_TABLE = 'skiptrace-logs';
export const SKIPTRACE_DB_TABLE = 'skiptrace-db';

function createDynamoClient(): DynamoDBDocumentClient | null {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.log('[DynamoDB] Not configured — missing DYNAMODB_ACCESS_KEY_ID or DYNAMODB_SECRET_ACCESS_KEY');
    return null;
  }

  const raw = new DynamoDBClient({
    region: REGION,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  });

  return DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

const client = createDynamoClient();

export function isDynamoConfigured(): boolean {
  return client !== null;
}

export async function dynamoScan<T = Record<string, unknown>>(
  params: ScanCommandInput
): Promise<T[]> {
  if (!client) throw new Error('DynamoDB not configured. Check DYNAMODB_* env vars.');
  const result = await client.send(new ScanCommand(params));
  return (result.Items ?? []) as T[];
}

export async function dynamoScanAll<T = Record<string, unknown>>(
  params: Omit<ScanCommandInput, 'ExclusiveStartKey'>
): Promise<T[]> {
  if (!client) throw new Error('DynamoDB not configured. Check DYNAMODB_* env vars.');
  const all: T[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await client.send(new ScanCommand({ ...params, ExclusiveStartKey: lastKey }));
    all.push(...((result.Items ?? []) as T[]));
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
  return all;
}

export async function dynamoQuery<T = Record<string, unknown>>(
  params: QueryCommandInput
): Promise<T[]> {
  if (!client) throw new Error('DynamoDB not configured. Check DYNAMODB_* env vars.');
  const result = await client.send(new QueryCommand(params));
  return (result.Items ?? []) as T[];
}
