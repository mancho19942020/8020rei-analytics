/**
 * Probe PCM API for automation-relevant endpoints: invoice, billing,
 * statement, account. Informs the "can we automate PCM vendor-rate drift
 * detection" question.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv(p: string) {
  try { for (const l of readFileSync(p,'utf-8').split('\n')) { const t=l.trim(); if(!t||t.startsWith('#'))continue; const i=t.indexOf('='); if(i<0)continue; const k=t.slice(0,i).trim(); const v=t.slice(i+1).trim().replace(/^["']|["']$/g,''); if(!process.env[k]) process.env[k]=v; } } catch{}
}
loadEnv(resolve(__dirname, '../.env.local'));

async function main() {
  const PCM = 'https://v3.pcmintegrations.com';
  const authRes = await fetch(`${PCM}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.PCM_API_KEY, apiSecret: process.env.PCM_API_SECRET }),
  });
  if (!authRes.ok) {
    console.log('auth failed', authRes.status);
    return;
  }
  const { token } = await authRes.json() as { token: string };

  const probes = [
    '/invoice', '/invoices', '/billing', '/statement', '/statements',
    '/account', '/accounts', '/integration/invoice', '/integration/statement',
    '/integration/balance', '/integration/account',
    '/reports', '/reports/monthly', '/reports/invoice',
    '/transactions', '/transaction',
    '/products', '/pricing', '/rate', '/rates', '/price',
    '/order?billing=true&page=1&perPage=1',
  ];
  for (const p of probes) {
    try {
      const r = await fetch(`${PCM}${p}`, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
      let sample = '';
      if (r.ok) {
        const j = await r.json().catch(() => null);
        if (j) {
          const s = JSON.stringify(j);
          sample = ' body-snippet: ' + s.slice(0, 140).replace(/\n/g, ' ');
        }
      }
      console.log(`${r.status.toString().padEnd(4)} ${p}${sample}`);
    } catch (e) {
      console.log(`ERR  ${p} — ${(e as Error).message}`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
