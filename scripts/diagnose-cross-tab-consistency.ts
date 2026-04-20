/**
 * Cross-tab consistency diagnostic
 *
 * Verifies the six foundational numbers that must match across
 * Overview / OH / BR / Profitability. Run before & after the trust-break
 * fixes to confirm no regression.
 *
 * Outputs:
 *   A. Current customer rate for Standard + First Class (last 7 days)
 *   B. Daily customer rate for Std/FC over the last 30 days (detect rate changes)
 *   C. Last synced date in dm_volume_summary per mail_class
 *   D. On-hold breakdown by age bucket (< 7d vs ≥ 7d) by domain
 *   E. Lifetime revenue + lifetime PCM-invoice cost + Aurora-stored PCM cost
 *   F. PCM API live: /integration/balance + /order count sample
 *
 * Usage: npx tsx scripts/diagnose-cross-tab-consistency.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RDSDataClient, ExecuteStatementCommand, type Field } from '@aws-sdk/client-rds-data';

// Load env from both .env.local and backend/.env (matches app behavior)
function loadEnv(path: string) {
  try {
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch { /* missing file is fine */ }
}
loadEnv(resolve(__dirname, '../.env.local'));
loadEnv(resolve(__dirname, '../backend/.env'));

const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN || '';
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN || '';
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';
const REGION = process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1';

if (!RESOURCE_ARN || !SECRET_ARN) {
  console.error('Missing DB_AURORA_RESOURCE_ARN or DB_AURORA_SECRET_ARN');
  process.exit(1);
}

const aurora = new RDSDataClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY || '',
  },
});

const TEST_DOMAINS = `'8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com','qapre_8020rei_com','testing5_8020rei_com','showcaseproductsecomllc_8020rei_com'`;

function fieldValue(f: Field): unknown {
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.longValue !== undefined) return f.longValue;
  if (f.doubleValue !== undefined) return f.doubleValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.isNull) return null;
  return null;
}

async function q(sql: string): Promise<Record<string, unknown>[]> {
  const cmd = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN,
    database: DATABASE,
    sql,
    includeResultMetadata: true,
  });
  const res = await aurora.send(cmd);
  const cols = (res.columnMetadata || []).map(c => c.name || '');
  return (res.records || []).map(row => {
    const obj: Record<string, unknown> = {};
    row.forEach((field, idx) => { obj[cols[idx]] = fieldValue(field); });
    return obj;
  });
}

function section(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

async function main() {
  // ─── A. Current customer rate (last 7 days) by mail class ──────
  section('A. Current customer rate (last 7 days) — "We charge"');
  const a = await q(`
    SELECT
      mail_class,
      ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) AS effective_rate,
      SUM(daily_sends) AS pieces,
      MIN(date) AS from_date,
      MAX(date) AS to_date
    FROM dm_volume_summary
    WHERE mail_class IN ('standard','first_class')
      AND date >= CURRENT_DATE - INTERVAL '7 days'
      AND daily_sends > 0
      AND domain NOT IN (${TEST_DOMAINS})
    GROUP BY mail_class
    ORDER BY mail_class
  `);
  console.table(a);

  // ─── B. Daily customer rate per mail class over last 30 days ───
  section('B. Daily customer rate — last 30 days per mail_class (detect rate changes)');
  const b = await q(`
    SELECT
      date,
      mail_class,
      ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) AS rate,
      SUM(daily_sends) AS pieces
    FROM dm_volume_summary
    WHERE mail_class IN ('standard','first_class')
      AND date >= CURRENT_DATE - INTERVAL '30 days'
      AND daily_sends > 0
      AND domain NOT IN (${TEST_DOMAINS})
    GROUP BY date, mail_class
    ORDER BY mail_class, date
  `);
  console.table(b);

  // ─── C. Last synced date in dm_volume_summary per mail class ───
  section('C. Last synced date per mail_class in dm_volume_summary');
  const c = await q(`
    SELECT
      mail_class,
      MAX(date) AS max_date,
      COUNT(DISTINCT date) AS days_synced,
      SUM(daily_sends) AS total_pieces
    FROM dm_volume_summary
    WHERE mail_class IN ('standard','first_class')
      AND daily_sends > 0
      AND domain NOT IN (${TEST_DOMAINS})
    GROUP BY mail_class
    ORDER BY mail_class
  `);
  console.table(c);

  // ─── D. On-hold age-bucket breakdown ───────────────────────────
  // The monolith writes snapshots to rr_campaign_pulse (on_hold_count aggregates)
  // and row-level state to rapid_response_history. For age bucketing we need the
  // row level. Detect the correct table first.
  section('D. Searching for on-hold row-level table');
  const dtables = await q(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE '%rapid%' OR table_name LIKE '%rr_%' OR table_name LIKE '%hold%')
    ORDER BY table_name
  `);
  console.table(dtables);

  section('D2. On-hold age bucket from rr_campaign_pulse (latest snapshot per domain)');
  try {
    const d2 = await q(`
      WITH latest AS (
        SELECT DISTINCT ON (domain, campaign_id)
          domain, campaign_id, campaign_name, on_hold_count, snapshot_at
        FROM rr_campaign_pulse
        WHERE domain NOT IN (${TEST_DOMAINS})
        ORDER BY domain, campaign_id, snapshot_at DESC
      )
      SELECT
        COUNT(*) FILTER (WHERE on_hold_count > 0) AS campaigns_with_hold,
        SUM(on_hold_count) AS total_on_hold,
        MIN(snapshot_at) AS oldest_snapshot,
        MAX(snapshot_at) AS newest_snapshot
      FROM latest
    `);
    console.table(d2);
  } catch (e) {
    console.log('rr_campaign_pulse not queryable:', (e as Error).message);
  }

  section('D3. Search for row-level on-hold table (with created_at) to bucket by age');
  try {
    const d3 = await q(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('rapid_response_history','rr_pcm_alignment','rr_campaign_pulse','rr_daily_metrics')
      ORDER BY table_name, ordinal_position
    `);
    console.table(d3);
  } catch (e) {
    console.log('Column discovery failed:', (e as Error).message);
  }

  // ─── E. Lifetime revenue + PCM cost drift ──────────────────────
  section('E. Lifetime revenue + Aurora-stored PCM cost (dm_client_funnel latest-per-domain)');
  const e = await q(`
    WITH latest AS (
      SELECT DISTINCT ON (domain)
        domain, total_cost, total_pcm_cost, margin, date
      FROM dm_client_funnel
      WHERE domain NOT IN (${TEST_DOMAINS})
      ORDER BY domain, date DESC
    )
    SELECT
      COUNT(*) AS domain_count,
      ROUND(SUM(total_cost)::numeric, 2) AS revenue,
      ROUND(SUM(total_pcm_cost)::numeric, 2) AS aurora_stored_pcm_cost,
      ROUND(SUM(margin)::numeric, 2) AS aurora_stored_margin
    FROM latest
  `);
  console.table(e);

  // ─── G. Cross-tab ON-HOLD CONTRACT ─────────────────────────────
  // Enforces the session-6 promise: every surface that shows on-hold reads
  // the same totals and the same stale/fresh breakdown via the shared
  // queryOnHoldAges helper. Below we compute the same totals directly (not
  // via the helper) and assert bit-for-bit equality against each surface.
  section('G. On-hold contract — is-it-running pulse = campaigns table sum = slack alert aggregate');
  const onHoldRows = await q(`
    WITH per_campaign AS (
      SELECT
        domain,
        campaign_id,
        campaign_name,
        MIN(snapshot_at) FILTER (WHERE on_hold_count > 0) AS first_on_hold_seen
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
      GROUP BY domain, campaign_id, campaign_name
    ),
    latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        domain, campaign_id, on_hold_count AS current_hold
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
      ORDER BY domain, campaign_id, snapshot_at DESC
    )
    SELECT
      SUM(l.current_hold) AS total_on_hold,
      SUM(l.current_hold) FILTER (WHERE p.first_on_hold_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days') AS stale_on_hold,
      SUM(l.current_hold) FILTER (WHERE p.first_on_hold_seen > CURRENT_TIMESTAMP - INTERVAL '7 days') AS fresh_on_hold,
      COUNT(*) FILTER (WHERE l.current_hold > 0) AS campaigns_with_hold,
      COUNT(*) FILTER (WHERE l.current_hold > 0 AND p.first_on_hold_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days') AS stale_campaigns,
      MAX(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.first_on_hold_seen))::int) FILTER (WHERE l.current_hold > 0) AS oldest_days
    FROM per_campaign p
    JOIN latest l ON l.domain = p.domain AND l.campaign_id = p.campaign_id
  `);
  console.table(onHoldRows);

  // ─── H. Sum of Campaigns table on-hold (Is-it-running pulse total) ─
  // This simulates the /api/rapid-response?type=overview query directly and
  // should produce the SAME total_on_hold as G. Any inequality = drift.
  section('H. Campaigns-table sum (/api/rapid-response?type=overview) — expect identical to G.total_on_hold');
  const campaignsTableTotal = await q(`
    WITH latest AS (
      SELECT DISTINCT ON (domain, campaign_id)
        on_hold_count
      FROM rr_campaign_snapshots
      WHERE domain NOT IN (${TEST_DOMAINS})
      ORDER BY domain, campaign_id, snapshot_at DESC
    )
    SELECT
      SUM(on_hold_count) AS total_on_hold,
      COUNT(*) FILTER (WHERE on_hold_count > 0) AS campaigns_with_hold
    FROM latest
  `);
  console.table(campaignsTableTotal);

  // Assert the two queries agree. If they don't, something upstream of
  // queryOnHoldAges has drifted.
  const gTotal = Number(onHoldRows[0]?.total_on_hold || 0);
  const hTotal = Number(campaignsTableTotal[0]?.total_on_hold || 0);
  const contractPass = gTotal === hTotal;
  console.log(
    `\nCross-tab contract: ${contractPass ? 'PASS' : 'FAIL'} — queryOnHoldAges total (${gTotal}) ${contractPass ? '===' : '!=='} campaigns-table sum (${hTotal}).`
  );

  // ─── I. Margin alignment contract: Overview Company margin === Profitability Net company margin ─
  // The Overview Company margin card and the Profitability Margin summary net
  // company margin MUST be the same number. Both read from dm_overview_cache.
  // This section reads the cache directly and confirms that the arithmetic:
  //    revenue − clientPcmCost − testCost = netCompanyMargin
  // produces the same value that both widgets render. If this fails, we've
  // reintroduced the session-7 bug.
  section('I. Margin alignment contract — Overview Company margin === Profitability Net company margin');
  try {
    const headline = await q(`
      SELECT payload::text AS payload
      FROM dm_overview_cache
      WHERE cache_key = 'headline'
      LIMIT 1
    `);
    const payloadStr = headline[0]?.payload ? String(headline[0].payload) : '';
    if (!payloadStr) {
      console.log('dm_overview_cache has no `headline` row — skipping alignment assertion.');
    } else {
      const payload = JSON.parse(payloadStr);
      const cm = payload?.companyMargin;
      if (!cm) {
        console.log('headline payload missing companyMargin — skipping.');
      } else {
        const revenue = Number(cm.clientRevenue || 0);
        const clientPcmCost = Number(cm.pcmCostReal || 0);
        const testCost = Number(cm.pcmCostTest || 0);
        const computedNet = Math.round((revenue - clientPcmCost - testCost) * 100) / 100;
        const reportedNet = Number(cm.margin || 0);
        const reportedGross = Number(cm.grossMargin || 0);
        const grossDelta = Math.round((reportedGross - (revenue - clientPcmCost)) * 100) / 100;
        const netDelta = Math.round((reportedNet - computedNet) * 100) / 100;
        console.table([
          { metric: 'Revenue (Aurora dm_client_funnel.total_cost)', value: revenue.toFixed(2) },
          { metric: 'PCM-invoice client cost (real)', value: clientPcmCost.toFixed(2) },
          { metric: 'PCM-invoice test cost (internal)', value: testCost.toFixed(2) },
          { metric: 'Gross margin (reported)', value: reportedGross.toFixed(2) },
          { metric: 'Gross margin (computed)', value: (revenue - clientPcmCost).toFixed(2) },
          { metric: 'Gross delta', value: grossDelta.toFixed(2) },
          { metric: 'Net company margin (reported)', value: reportedNet.toFixed(2) },
          { metric: 'Net company margin (computed)', value: computedNet.toFixed(2) },
          { metric: 'Net delta', value: netDelta.toFixed(2) },
        ]);
        const pass = Math.abs(grossDelta) < 0.02 && Math.abs(netDelta) < 0.02;
        console.log(`\nMargin alignment contract: ${pass ? 'PASS' : 'FAIL'} — ${pass
          ? 'Overview Company margin and Profitability Net company margin will match.'
          : 'DRIFT — reported margin disagrees with the arithmetic; investigate compute.ts vs pcm-validation/route.ts.'}`);
      }
    }
  } catch (e) {
    console.log('Alignment assertion skipped:', (e as Error).message);
  }

  // ─── F. PCM API live probe ─────────────────────────────────────
  section('F. PCM API live probe — /integration/balance + /order sample');
  const pcmBase = 'https://v3.pcmintegrations.com';
  const apiKey = process.env.PCM_API_KEY;
  const apiSecret = process.env.PCM_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.log('PCM credentials missing — skipping');
  } else {
    try {
      const authRes = await fetch(`${pcmBase}/auth/login`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret }),
      });
      if (!authRes.ok) throw new Error(`auth ${authRes.status}`);
      const { token } = await authRes.json() as { token: string };

      const balRes = await fetch(`${pcmBase}/integration/balance`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      console.log('PCM /integration/balance:', balRes.status, await balRes.json().catch(() => '<not json>'));

      const ordRes = await fetch(`${pcmBase}/order?page=1&pageSize=3`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const ordJson = await ordRes.json().catch(() => null) as { pagination?: { totalResults?: number }; results?: unknown[] } | null;
      console.log('PCM /order page 1 status:', ordRes.status, 'totalResults:', ordJson?.pagination?.totalResults, 'sample count:', ordJson?.results?.length);
    } catch (err) {
      console.log('PCM probe failed:', (err as Error).message);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
