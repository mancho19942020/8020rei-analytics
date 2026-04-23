/**
 * Platform Tracking API
 *
 * Receives batched tracking events from the client-side tracker
 * and inserts them into BigQuery for the platform analytics tab.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { bigquery, PROJECT } from '@/lib/bigquery';

const DATASET = 'metrics_hub_tracking';
const TABLE = 'platform_events';
const FULL_TABLE = `${PROJECT}.${DATASET}.${TABLE}`;

let tableEnsured = false;

/**
 * Ensure the BigQuery dataset and table exist (runs once per server lifecycle).
 */
async function ensureTable() {
  if (tableEnsured) return;

  try {
    const dataset = bigquery.dataset(DATASET);
    const [datasetExists] = await dataset.exists();
    if (!datasetExists) {
      await bigquery.createDataset(DATASET, { location: 'US' });
      console.log(`[Platform Tracking] Created dataset: ${DATASET}`);
    }

    const table = dataset.table(TABLE);
    const [tableExists] = await table.exists();
    if (!tableExists) {
      await table.create({
        schema: {
          fields: [
            { name: 'event_type', type: 'STRING', mode: 'REQUIRED' },
            { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
            { name: 'session_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'user_email', type: 'STRING', mode: 'REQUIRED' },
            { name: 'user_name', type: 'STRING', mode: 'NULLABLE' },
            { name: 'section', type: 'STRING', mode: 'NULLABLE' },
            { name: 'subsection', type: 'STRING', mode: 'NULLABLE' },
            { name: 'detail_tab', type: 'STRING', mode: 'NULLABLE' },
            { name: 'metadata', type: 'STRING', mode: 'NULLABLE' },
          ],
        },
        timePartitioning: {
          type: 'DAY',
          field: 'timestamp',
        },
      });
      console.log(`[Platform Tracking] Created table: ${FULL_TABLE}`);
    }

    tableEnsured = true;
  } catch (err) {
    console.error('[Platform Tracking] Error ensuring table:', err);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const events = body.events;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: 'No events provided' }, { status: 400 });
    }

    // Ensure table exists
    await ensureTable();

    // Transform events for BigQuery insert
    const rows = events.map((e: Record<string, unknown>) => ({
      event_type: e.event_type,
      timestamp: e.timestamp,
      session_id: e.session_id,
      user_email: e.user_email,
      user_name: e.user_name || null,
      section: e.section || null,
      subsection: e.subsection || null,
      detail_tab: e.detail_tab || null,
      metadata: e.metadata ? JSON.stringify(e.metadata) : null,
    }));

    // Stream insert into BigQuery
    await bigquery.dataset(DATASET).table(TABLE).insert(rows);

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err: unknown) {
    console.error('[Platform Tracking] Insert error:', err);
    // Don't fail the client on tracking errors
    return NextResponse.json({ success: false, error: 'Tracking write failed' }, { status: 500 });
  }
}
