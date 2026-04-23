/**
 * Seed script for Rapid Response Aurora tables.
 *
 * Inserts realistic sample data into:
 *   - rr_campaign_snapshots
 *   - rr_daily_metrics
 *   - rr_pcm_alignment
 *
 * Usage: npx tsx scripts/seed-rr-data.ts
 *
 * Requires DB_AURORA_* env vars in .env.local
 */

import { readFileSync } from 'fs';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

// Load .env.local manually (no dotenv dependency needed)
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local — make sure it exists in the project root');
  process.exit(1);
}

const RESOURCE_ARN = process.env.DB_AURORA_RESOURCE_ARN!;
const SECRET_ARN = process.env.DB_AURORA_SECRET_ARN!;
const DATABASE = process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db';

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY!,
  },
});

async function run(sql: string) {
  const cmd = new ExecuteStatementCommand({
    resourceArn: RESOURCE_ARN,
    secretArn: SECRET_ARN,
    database: DATABASE,
    sql,
  });
  return client.send(cmd);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDec(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

// ---------------------------------------------------------------------------
// Seed: rr_campaign_snapshots
// ---------------------------------------------------------------------------

async function seedCampaignSnapshots() {
  console.log('Seeding rr_campaign_snapshots...');

  const campaigns = [
    { id: '1001', name: 'Dallas Foreclosures Q1', type: 'rr', status: 'active', totalSent: 2450, totalDelivered: 1890, letters30d: 120, postcards30d: 340, onHold: 0, followUp: 3 },
    { id: '1002', name: 'Miami Probate Leads', type: 'rr', status: 'active', totalSent: 1800, totalDelivered: 1420, letters30d: 85, postcards30d: 210, onHold: 2, followUp: 0 },
    { id: '1003', name: 'Phoenix Tax Liens', type: 'smartdrop', status: 'active', totalSent: 3200, totalDelivered: 2650, letters30d: 0, postcards30d: 520, onHold: 0, followUp: 5 },
    { id: '1004', name: 'Atlanta Vacant Properties', type: 'rr', status: 'paused', totalSent: 890, totalDelivered: 720, letters30d: 0, postcards30d: 0, onHold: 0, followUp: 0 },
    { id: '1005', name: 'Denver Pre-Foreclosure', type: 'smartdrop', status: 'active', totalSent: 560, totalDelivered: 410, letters30d: 30, postcards30d: 95, onHold: 1, followUp: 2 },
  ];

  // Create snapshots for the last 24 hours (one per hour)
  for (let h = 0; h < 24; h++) {
    const snapshotAt = hoursAgo(23 - h);
    for (const c of campaigns) {
      // Simulate slight growth over the hours
      const sentDelta = c.status === 'active' ? rand(0, 3) * h : 0;
      const deliveredDelta = c.status === 'active' ? Math.floor(sentDelta * 0.8) : 0;

      await run(`
        INSERT INTO rr_campaign_snapshots
          (campaign_id, campaign_name, domain, campaign_type, status, total_sent,
           total_delivered, last_sent_date, letters_delivered_30d, postcards_delivered_30d,
           on_hold_count, follow_up_pending_count, smartdrop_authorization_status, snapshot_at)
        VALUES
          ('${c.id}', '${c.name}', '8020rei_demo', '${c.type}', '${c.status}',
           ${c.totalSent + sentDelta}, ${c.totalDelivered + deliveredDelta},
           ${c.status === 'active' ? `'${snapshotAt}'` : 'NULL'},
           ${c.letters30d}, ${c.postcards30d}, ${c.onHold}, ${c.followUp},
           ${c.type === 'smartdrop' ? "'authorized'" : 'NULL'},
           '${snapshotAt}')
      `);
    }
  }

  console.log(`  Inserted ${24 * campaigns.length} campaign snapshot rows`);
}

// ---------------------------------------------------------------------------
// Seed: rr_daily_metrics
// ---------------------------------------------------------------------------

async function seedDailyMetrics() {
  console.log('Seeding rr_daily_metrics...');

  let count = 0;
  for (let d = 14; d >= 0; d--) {
    const date = daysAgo(d);

    // Rapid Response metrics
    const rrSendsTotal = rand(25, 65);
    const rrSendsSuccess = Math.floor(rrSendsTotal * randDec(0.88, 0.98));
    const rrOnHold = rand(0, 3);
    const rrProtected = rand(0, 5);
    const rrUndeliverable = rand(0, 4);
    const rrError = rand(0, 2);
    const rrDelivered = Math.floor(rrSendsSuccess * randDec(0.70, 0.85));
    const rrCostTotal = randDec(rrSendsTotal * 0.45, rrSendsTotal * 0.65);
    const rrAvgCost = randDec(0.42, 0.58);
    const rrPcmRate = rrSendsTotal > 0 ? randDec(85, 99) : 0;
    const rrDeliveryRate30d = randDec(72, 88);
    const rrFollowUpSent = rand(2, 10);
    const rrFollowUpFailed = d === 5 ? 2 : 0; // Simulate a follow-up failure 5 days ago

    await run(`
      INSERT INTO rr_daily_metrics
        (date, domain, campaign_type, sends_total, sends_success, sends_on_hold,
         sends_protected, sends_undeliverable, sends_error, delivered_count,
         cost_total, avg_unit_cost, pcm_submission_rate, delivery_rate_30d,
         follow_up_sent, follow_up_failed)
      VALUES
        ('${date}', '8020rei_demo', 'rr', ${rrSendsTotal}, ${rrSendsSuccess}, ${rrOnHold},
         ${rrProtected}, ${rrUndeliverable}, ${rrError}, ${rrDelivered},
         ${rrCostTotal}, ${rrAvgCost}, ${rrPcmRate}, ${rrDeliveryRate30d},
         ${rrFollowUpSent}, ${rrFollowUpFailed})
      ON CONFLICT (date, domain, campaign_type) DO UPDATE SET
        sends_total = EXCLUDED.sends_total,
        sends_success = EXCLUDED.sends_success
    `);

    // SmartDrop metrics (lower volume, batch-based)
    const sdSendsTotal = rand(10, 35);
    const sdSendsSuccess = Math.floor(sdSendsTotal * randDec(0.90, 0.99));
    const sdDelivered = Math.floor(sdSendsSuccess * randDec(0.75, 0.90));
    // Simulate a cost spike 3 days ago
    const costMultiplier = d === 3 ? 2.8 : 1.0;
    const sdCostTotal = randDec(sdSendsTotal * 0.45 * costMultiplier, sdSendsTotal * 0.60 * costMultiplier);
    const sdAvgCost = d === 3 ? randDec(1.10, 1.30) : randDec(0.42, 0.55);

    await run(`
      INSERT INTO rr_daily_metrics
        (date, domain, campaign_type, sends_total, sends_success, sends_on_hold,
         sends_protected, sends_undeliverable, sends_error, delivered_count,
         cost_total, avg_unit_cost, pcm_submission_rate, delivery_rate_30d,
         follow_up_sent, follow_up_failed)
      VALUES
        ('${date}', '8020rei_demo', 'smartdrop', ${sdSendsTotal}, ${sdSendsSuccess}, 0,
         ${rand(0, 2)}, ${rand(0, 2)}, ${rand(0, 1)}, ${sdDelivered},
         ${sdCostTotal}, ${sdAvgCost}, ${sdSendsTotal > 0 ? randDec(90, 99) : 0}, ${randDec(76, 90)},
         0, 0)
      ON CONFLICT (date, domain, campaign_type) DO UPDATE SET
        sends_total = EXCLUDED.sends_total,
        sends_success = EXCLUDED.sends_success
    `);

    count += 2;
  }

  console.log(`  Inserted ${count} daily metric rows`);
}

// ---------------------------------------------------------------------------
// Seed: rr_pcm_alignment
// ---------------------------------------------------------------------------

async function seedPcmAlignment() {
  console.log('Seeding rr_pcm_alignment...');

  let count = 0;
  for (let h = 0; h < 48; h++) {
    const checkedAt = hoursAgo(47 - h);

    // Simulate a broken pipeline scenario starting 12 hours ago
    const pipelineBroken = h >= 36; // last 12 hours
    const staleCount = pipelineBroken ? rand(3, 8) : 0;
    const orphanedCount = pipelineBroken ? rand(1, 3) : 0;
    const oldestStaleDays = pipelineBroken ? rand(15, 22) : 0;
    const syncGap = pipelineBroken ? rand(1, 4) : 0;

    const vendorBreakdown = JSON.stringify({
      Processing: rand(5, 15),
      Mailing: rand(10, 25),
      'En Route': rand(8, 20),
      Delivered: rand(80, 150),
      Undeliverable: rand(2, 8),
      Returned: pipelineBroken ? rand(3, 7) : rand(0, 2),
    });

    const deliveryLagMedian = randDec(4.0, 7.5);
    const deliveryLagP95 = randDec(10.0, 16.0);
    const undeliverableRate7d = randDec(2.0, pipelineBroken ? 9.5 : 5.0);

    await run(`
      INSERT INTO rr_pcm_alignment
        (checked_at, domain, stale_sent_count, orphaned_orders_count, oldest_stale_days,
         vendor_status_breakdown, delivery_lag_median_days, delivery_lag_p95_days,
         undeliverable_rate_7d, back_office_sync_gap)
      VALUES
        ('${checkedAt}', '8020rei_demo', ${staleCount}, ${orphanedCount}, ${oldestStaleDays},
         '${vendorBreakdown}'::jsonb, ${deliveryLagMedian}, ${deliveryLagP95},
         ${undeliverableRate7d}, ${syncGap})
    `);

    count++;
  }

  console.log(`  Inserted ${count} PCM alignment rows`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Rapid Response Seed Script ===');
  console.log(`Database: ${DATABASE}`);
  console.log(`Region: ${process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1'}`);
  console.log('');

  try {
    await seedCampaignSnapshots();
    await seedDailyMetrics();
    await seedPcmAlignment();
    console.log('\nDone! All seed data inserted successfully.');
  } catch (err) {
    console.error('\nFailed:', err);
    process.exit(1);
  }
}

main();
