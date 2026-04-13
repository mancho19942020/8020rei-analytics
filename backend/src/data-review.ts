import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
import { AuroraService } from './services/aurora.service.js';

const aurora = new AuroraService();
const TEST_EX = `('8020rei_demo','8020rei_migracion_test','_test_debug','_test_debug3','supertest_8020rei_com','sandbox_8020rei_com')`;

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        CLEAN DATA REVIEW — ALL AURORA TABLES        ║');
  console.log('║  PCM Reference: 23,884 recipients / $18,300.29      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. dm_client_funnel — ALL TIME (latest snapshot per domain)
  console.log('━━━ TABLE 1: dm_client_funnel (latest snapshot per domain) ━━━');
  const cf = await aurora.executeQuery(`
    SELECT f.domain, f.date,
      COALESCE(f.total_sends,0) as sends, COALESCE(f.total_delivered,0) as delivered,
      COALESCE(f.total_cost,0) as cost, COALESCE(f.total_properties_mailed,0) as mailed,
      COALESCE(f.active_campaigns,0) as campaigns
    FROM dm_client_funnel f
    INNER JOIN (SELECT domain, MAX(date) as max_date FROM dm_client_funnel
      WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX} GROUP BY domain
    ) l ON f.domain = l.domain AND f.date = l.max_date
    WHERE f.domain IS NOT NULL AND f.domain NOT IN ${TEST_EX}
    ORDER BY COALESCE(f.total_sends,0) DESC
  `);
  let cfs=0,cfd=0,cfc=0;
  for (const r of cf) { const s=Number(r.sends),d=Number(r.delivered),c=Number(r.cost); cfs+=s;cfd+=d;cfc+=c;
    console.log(`  ${r.domain} | snapshot=${r.date} | sends=${s} | delivered=${d} | cost=$${c.toFixed(2)} | mailed=${r.mailed} | campaigns=${r.campaigns}`);
  }
  console.log(`  >>> TOTAL: ${cfs} sends | ${cfd} delivered | $${cfc.toFixed(2)} cost | ${cf.length} domains\n`);

  // 2. dm_property_conversions — ALL TIME (no date filter)
  console.log('━━━ TABLE 2: dm_property_conversions (ALL TIME, no date filter) ━━━');
  const pc = await aurora.executeQuery(`
    SELECT domain, COUNT(*) as properties,
      COALESCE(SUM(total_sends),0) as sends, COALESCE(SUM(total_delivered),0) as delivered,
      COALESCE(SUM(total_cost),0) as cost,
      MIN(first_sent_date) as earliest, MAX(first_sent_date) as latest
    FROM dm_property_conversions
    WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
    GROUP BY domain ORDER BY COALESCE(SUM(total_sends),0) DESC
  `);
  let pcs=0,pcd=0,pcc=0,pcp=0;
  for (const r of pc) { const p=Number(r.properties),s=Number(r.sends),d=Number(r.delivered),c=Number(r.cost); pcs+=s;pcd+=d;pcc+=c;pcp+=p;
    console.log(`  ${r.domain} | props=${p} | sends=${s} | delivered=${d} | cost=$${c.toFixed(2)} | range=${r.earliest} to ${r.latest}`);
  }
  console.log(`  >>> TOTAL: ${pcp} properties | ${pcs} sends | ${pcd} delivered | $${pcc.toFixed(2)} cost | ${pc.length} domains\n`);

  // 3. dm_volume_summary — cumulative (MAX per domain)
  console.log('━━━ TABLE 3: dm_volume_summary (MAX cumulative per domain) ━━━');
  const vs = await aurora.executeQuery(`
    SELECT domain,
      COALESCE(MAX(cumulative_sends),0) as cum_sends, COALESCE(MAX(cumulative_cost),0) as cum_cost,
      MAX(date) as latest_date
    FROM dm_volume_summary
    WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
    GROUP BY domain ORDER BY COALESCE(MAX(cumulative_sends),0) DESC
  `);
  let vss=0,vsc=0;
  for (const r of vs) { const s=Number(r.cum_sends),c=Number(r.cum_cost); vss+=s;vsc+=c;
    console.log(`  ${r.domain} | cum_sends=${s} | cum_cost=$${c.toFixed(2)} | latest=${r.latest_date}`);
  }
  console.log(`  >>> TOTAL: ${vss} sends | $${vsc.toFixed(2)} cost | ${vs.length} domains\n`);

  // 4. dm_volume_summary — LATEST date only (most recent snapshot)
  console.log('━━━ TABLE 3b: dm_volume_summary (LATEST DATE ONLY per domain) ━━━');
  const vsLatest = await aurora.executeQuery(`
    SELECT v.domain, v.cumulative_sends, v.cumulative_cost, v.daily_sends, v.daily_cost, v.date
    FROM dm_volume_summary v
    INNER JOIN (SELECT domain, MAX(date) as max_date FROM dm_volume_summary
      WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX} GROUP BY domain
    ) l ON v.domain = l.domain AND v.date = l.max_date
    WHERE v.domain IS NOT NULL AND v.domain NOT IN ${TEST_EX}
    ORDER BY COALESCE(v.cumulative_sends,0) DESC
  `);
  let vls=0,vlc=0;
  for (const r of vsLatest) { const s=Number(r.cumulative_sends),c=Number(r.cumulative_cost); vls+=s;vlc+=c;
    console.log(`  ${r.domain} | date=${r.date} | cum_sends=${s} | cum_cost=$${c.toFixed(2)} | daily_sends=${r.daily_sends} | daily_cost=$${Number(r.daily_cost||0).toFixed(2)}`);
  }
  console.log(`  >>> TOTAL: ${vls} sends | $${vlc.toFixed(2)} cost\n`);

  // 5. dm_template_performance
  console.log('━━━ TABLE 4: dm_template_performance ━━━');
  const tp = await aurora.executeQuery(`
    SELECT domain, template_name, template_type,
      COALESCE(total_sent,0) as sent, COALESCE(total_delivered,0) as delivered,
      COALESCE(total_cost,0) as cost
    FROM dm_template_performance
    WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
    ORDER BY COALESCE(total_sent,0) DESC
    LIMIT 20
  `);
  let tps=0,tpc=0;
  for (const r of tp) { const s=Number(r.sent),c=Number(r.cost); tps+=s;tpc+=c;
    console.log(`  ${r.domain} | template=${r.template_name || 'unknown'} | type=${r.template_type || 'unknown'} | sent=${s} | delivered=${r.delivered} | cost=$${c.toFixed(2)}`);
  }
  // Get totals
  const tpTotals = await aurora.executeQuery(`
    SELECT COALESCE(SUM(total_sent),0) as sent, COALESCE(SUM(total_cost),0) as cost
    FROM dm_template_performance WHERE domain IS NOT NULL AND domain NOT IN ${TEST_EX}
  `);
  console.log(`  >>> TOTAL: ${tpTotals[0]?.sent} sent | $${Number(tpTotals[0]?.cost||0).toFixed(2)} cost\n`);

  // 6. CROSS-TABLE COMPARISON
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CROSS-TABLE COMPARISON vs PCM (23,884 / $18,300.29)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  PCM Dashboard:          23,884 recipients | $18,300.29`);
  console.log(`  dm_client_funnel:       ${cfs} sends      | $${cfc.toFixed(2)} (delta: ${cfs-23884} / $${(cfc-18300.29).toFixed(2)})`);
  console.log(`  dm_property_conversions:${pcs} sends      | $${pcc.toFixed(2)} (delta: ${pcs-23884} / $${(pcc-18300.29).toFixed(2)})`);
  console.log(`  dm_volume_summary:      ${vls} sends      | $${vlc.toFixed(2)} (delta: ${vls-23884} / $${(vlc-18300.29).toFixed(2)})`);
  console.log(`  dm_template_performance:${tpTotals[0]?.sent} sent | $${Number(tpTotals[0]?.cost||0).toFixed(2)}`);

  // 7. Domain-level comparison between tables
  console.log('\n━━━ DOMAIN-LEVEL CROSS-TABLE CHECK ━━━');
  const allDomains = new Set([...cf.map(r=>r.domain), ...pc.map(r=>r.domain), ...vsLatest.map(r=>r.domain)]);
  const cfMap = Object.fromEntries(cf.map(r=>[r.domain, {sends:Number(r.sends), cost:Number(r.cost)}]));
  const pcMap = Object.fromEntries(pc.map(r=>[r.domain, {sends:Number(r.sends), cost:Number(r.cost)}]));
  const vlMap = Object.fromEntries(vsLatest.map(r=>[r.domain, {sends:Number(r.cumulative_sends), cost:Number(r.cumulative_cost)}]));

  for (const d of [...allDomains].sort()) {
    const c = cfMap[d as string] || {sends:0,cost:0};
    const p = pcMap[d as string] || {sends:0,cost:0};
    const v = vlMap[d as string] || {sends:0,cost:0};
    const match = c.sends === p.sends && Math.abs(c.cost - p.cost) < 1;
    const volMatch = Math.abs(c.sends - v.sends) < 10;
    console.log(`  ${d}: funnel=${c.sends}/$${c.cost.toFixed(0)} | prop_conv=${p.sends}/$${p.cost.toFixed(0)} | vol_sum=${v.sends}/$${v.cost.toFixed(0)} ${!match?'⚠️ MISMATCH':'✓'} ${!volMatch?'🔴 VOL_SUM_INFLATED':''}`);
  }
}

main().catch(console.error);
