import { readFileSync } from 'fs';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

try {
  const envContent = readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
} catch { process.exit(1); }

const client = new RDSDataClient({
  region: process.env.DB_AURORA_DEFAULT_REGION || 'us-east-1',
  credentials: { accessKeyId: process.env.DB_AURORA_ACCESS_KEY_ID!, secretAccessKey: process.env.DB_AURORA_SECRET_ACCESS_KEY! },
});

async function q(sql: string) {
  const res = await client.send(new ExecuteStatementCommand({
    resourceArn: process.env.DB_AURORA_RESOURCE_ARN!, secretArn: process.env.DB_AURORA_SECRET_ARN!,
    database: process.env.AWS_AURORA_GRAFANA_DB || 'grafana8020db', sql,
  }));
  return res.records;
}

async function main() {
  console.log('=== Layer 2 Tables Check ===\n');

  // Row counts
  const counts = await q(`
    SELECT
      (SELECT COUNT(*) FROM dm_property_conversions) as c1,
      (SELECT COUNT(*) FROM dm_template_performance) as c2,
      (SELECT COUNT(*) FROM dm_client_funnel) as c3
  `);
  console.log('dm_property_conversions:', counts?.[0]?.[0]?.longValue);
  console.log('dm_template_performance:', counts?.[0]?.[1]?.longValue);
  console.log('dm_client_funnel:', counts?.[0]?.[2]?.longValue);

  const total = (counts?.[0]?.[0]?.longValue ?? 0) + (counts?.[0]?.[1]?.longValue ?? 0) + (counts?.[0]?.[2]?.longValue ?? 0);

  if (total > 0) {
    // Domain breakdown
    const domains = await q('SELECT domain, COUNT(*) as cnt FROM dm_property_conversions GROUP BY domain ORDER BY cnt DESC LIMIT 10');
    console.log('\nTop 10 domains in dm_property_conversions:');
    domains?.forEach((r: any) => console.log('  ', r[0]?.stringValue, ':', r[1]?.longValue, 'rows'));

    // Funnel totals
    const funnel = await q(`
      SELECT
        SUM(total_properties_mailed) as mailed,
        SUM(leads) as leads,
        SUM(appointments) as appts,
        SUM(contracts) as contracts,
        SUM(deals) as deals,
        SUM(total_revenue) as revenue
      FROM dm_client_funnel
    `);
    console.log('\nFunnel totals (dm_client_funnel):');
    console.log('  mailed:', funnel?.[0]?.[0]?.longValue);
    console.log('  leads:', funnel?.[0]?.[1]?.longValue);
    console.log('  appointments:', funnel?.[0]?.[2]?.longValue);
    console.log('  contracts:', funnel?.[0]?.[3]?.longValue);
    console.log('  deals:', funnel?.[0]?.[4]?.longValue);
    console.log('  revenue:', funnel?.[0]?.[5]?.stringValue || funnel?.[0]?.[5]?.doubleValue);

    // Template performance
    const templates = await q('SELECT template_name, template_type, total_sent, leads_generated, deals_generated FROM dm_template_performance ORDER BY total_sent DESC LIMIT 5');
    console.log('\nTop 5 templates (dm_template_performance):');
    templates?.forEach((r: any) => console.log('  ', r[0]?.stringValue, `(${r[1]?.stringValue})`, '- sent:', r[2]?.longValue, '- leads:', r[3]?.longValue, '- deals:', r[4]?.longValue));

    // Distinct domains across all tables
    const domainCounts = await q(`
      SELECT
        (SELECT COUNT(DISTINCT domain) FROM dm_property_conversions) as d1,
        (SELECT COUNT(DISTINCT domain) FROM dm_template_performance) as d2,
        (SELECT COUNT(DISTINCT domain) FROM dm_client_funnel) as d3
    `);
    console.log('\nDistinct domains:');
    console.log('  dm_property_conversions:', domainCounts?.[0]?.[0]?.longValue);
    console.log('  dm_template_performance:', domainCounts?.[0]?.[1]?.longValue);
    console.log('  dm_client_funnel:', domainCounts?.[0]?.[2]?.longValue);
  } else {
    console.log('\n⚠ All Layer 2 tables are empty — jobs may still be processing in the Horizon queue.');
    console.log('Ask Carolina to check Horizon dashboard for job status on operations_queue.');
  }
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1); });
