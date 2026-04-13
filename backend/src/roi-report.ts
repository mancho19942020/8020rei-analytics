import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
import { AuroraService } from './services/aurora.service.js';
const aurora = new AuroraService();
const TEST_EX = `('8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com')`;

async function main() {
  console.log('=== ALL-TIME CONVERSION & REVENUE (dm_property_conversions) ===');
  const roi = await aurora.executeQuery(`
    SELECT domain, COUNT(*) as props,
      COALESCE(SUM(CASE WHEN became_lead_at IS NOT NULL THEN 1 ELSE 0 END),0) as leads,
      COALESCE(SUM(CASE WHEN became_appointment_at IS NOT NULL THEN 1 ELSE 0 END),0) as appts,
      COALESCE(SUM(CASE WHEN became_contract_at IS NOT NULL THEN 1 ELSE 0 END),0) as contracts,
      COALESCE(SUM(CASE WHEN became_deal_at IS NOT NULL THEN 1 ELSE 0 END),0) as deals,
      COALESCE(SUM(deal_revenue),0) as revenue, COALESCE(SUM(total_cost),0) as cost
    FROM dm_property_conversions
    WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
    GROUP BY domain ORDER BY COALESCE(SUM(deal_revenue),0) DESC
  `);
  let tl=0,ta=0,tc=0,td=0,tr=0,tco=0,tp=0;
  for (const r of roi) {
    const l=Number(r.leads),a=Number(r.appts),c=Number(r.contracts),d=Number(r.deals),rv=Number(r.revenue),co=Number(r.cost),p=Number(r.props);
    tl+=l;ta+=a;tc+=c;td+=d;tr+=rv;tco+=co;tp+=p;
    console.log(`${r.domain}|${p}|${l}|${a}|${c}|${d}|${rv.toFixed(2)}|${co.toFixed(2)}`);
  }
  console.log(`TOTAL|${tp}|${tl}|${ta}|${tc}|${td}|${tr.toFixed(2)}|${tco.toFixed(2)}`);
  console.log(`\nROI (corrected cost $19,515.92): Revenue=$${tr.toFixed(2)} / Cost=$19,515.92 = ${(tr/19515.92).toFixed(1)}x ROAS / Net=$${(tr-19515.92).toFixed(2)}`);
  console.log(`ROI (PCM cost $18,300.29): Revenue=$${tr.toFixed(2)} / Cost=$18,300.29 = ${(tr/18300.29).toFixed(1)}x ROAS / Net=$${(tr-18300.29).toFixed(2)}`);

  console.log('\n=== 90-DAY CONVERSIONS ===');
  const r90 = (await aurora.executeQuery(`
    SELECT COUNT(*) as p, COALESCE(SUM(CASE WHEN became_lead_at IS NOT NULL THEN 1 ELSE 0 END),0) as l,
      COALESCE(SUM(CASE WHEN became_appointment_at IS NOT NULL THEN 1 ELSE 0 END),0) as a,
      COALESCE(SUM(CASE WHEN became_contract_at IS NOT NULL THEN 1 ELSE 0 END),0) as c,
      COALESCE(SUM(CASE WHEN became_deal_at IS NOT NULL THEN 1 ELSE 0 END),0) as d,
      COALESCE(SUM(deal_revenue),0) as r, COALESCE(SUM(total_cost),0) as co
    FROM dm_property_conversions WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
      AND first_sent_date >= CURRENT_DATE - INTERVAL '90 days'
  `))[0];
  console.log(`Props=${r90.p}|Leads=${r90.l}|Appts=${r90.a}|Contracts=${r90.c}|Deals=${r90.d}|Revenue=$${Number(r90.r).toFixed(2)}|Cost=$${Number(r90.co).toFixed(2)}`);

  console.log('\n=== 30-DAY CONVERSIONS ===');
  const r30 = (await aurora.executeQuery(`
    SELECT COUNT(*) as p, COALESCE(SUM(CASE WHEN became_lead_at IS NOT NULL THEN 1 ELSE 0 END),0) as l,
      COALESCE(SUM(CASE WHEN became_appointment_at IS NOT NULL THEN 1 ELSE 0 END),0) as a,
      COALESCE(SUM(CASE WHEN became_contract_at IS NOT NULL THEN 1 ELSE 0 END),0) as c,
      COALESCE(SUM(CASE WHEN became_deal_at IS NOT NULL THEN 1 ELSE 0 END),0) as d,
      COALESCE(SUM(deal_revenue),0) as r, COALESCE(SUM(total_cost),0) as co
    FROM dm_property_conversions WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
      AND first_sent_date >= CURRENT_DATE - INTERVAL '30 days'
  `))[0];
  console.log(`Props=${r30.p}|Leads=${r30.l}|Appts=${r30.a}|Contracts=${r30.c}|Deals=${r30.d}|Revenue=$${Number(r30.r).toFixed(2)}|Cost=$${Number(r30.co).toFixed(2)}`);

  // Per-domain 90-day breakdown
  console.log('\n=== 90-DAY PER-DOMAIN BREAKDOWN ===');
  const d90 = await aurora.executeQuery(`
    SELECT domain, COUNT(*) as p,
      COALESCE(SUM(CASE WHEN became_lead_at IS NOT NULL THEN 1 ELSE 0 END),0) as l,
      COALESCE(SUM(CASE WHEN became_deal_at IS NOT NULL THEN 1 ELSE 0 END),0) as d,
      COALESCE(SUM(deal_revenue),0) as r, COALESCE(SUM(total_cost),0) as co
    FROM dm_property_conversions WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
      AND first_sent_date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY domain ORDER BY COALESCE(SUM(deal_revenue),0) DESC
  `);
  for (const r of d90) console.log(`${r.domain}|${r.p}|${r.l}|${r.d}|${Number(r.r).toFixed(2)}|${Number(r.co).toFixed(2)}`);
}
main().catch(console.error);
