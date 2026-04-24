/**
 * Read-only probe: does dm_customer_pricing have rows yet?
 *
 * Written 2026-04-22 after monolith PR #1969 merged. Answers the question:
 * "has the backoffice cron fired at least once since the deploy, and is
 * syncCustomerPricing actually writing?"
 *
 * Reuses the master-secret flow from apply-via-bastion.ts. Plain SELECTs
 * only — no DDL, no writes.
 *
 * Usage:
 *   1. aws sso login --profile awsgerman (if session expired)
 *   2. Start SSM tunnel in background (see apply-via-bastion.ts header)
 *   3. Fetch creds + run + clean up (see apply-via-bastion.ts)
 */

import { Client } from 'pg';

const DATABASE = 'grafana8020db';
const LOCAL_PORT = 15432;

async function main() {
  const username = process.env.PG_MASTER_USER;
  const password = process.env.PG_MASTER_PASS;
  if (!username || !password) {
    throw new Error('PG_MASTER_USER and PG_MASTER_PASS must be set');
  }

  const client = new Client({
    host: 'localhost',
    port: LOCAL_PORT,
    database: DATABASE,
    user: username,
    password,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('[check] Connected\n');

  try {
    const countRes = await client.query('SELECT COUNT(*) AS n FROM dm_customer_pricing');
    const totalRows = Number(countRes.rows[0].n);
    console.log(`[check] dm_customer_pricing total rows: ${totalRows}`);

    if (totalRows === 0) {
      console.log(
        '\n[check] ⚠ Empty. The backoffice cron has not fired (or the prod deploy has not landed) since the DDL was applied.'
      );
      return;
    }

    const domainSplit = await client.query(
      `SELECT mail_class, COUNT(DISTINCT domain) AS domains, COUNT(*) AS rows,
              MIN(updated_at) AS oldest, MAX(updated_at) AS newest
         FROM dm_customer_pricing
         GROUP BY mail_class
         ORDER BY mail_class`
    );
    console.log('\n[check] Per mail class:');
    for (const r of domainSplit.rows) {
      console.log(
        `  - ${r.mail_class}: ${r.rows} rows across ${r.domains} domains (oldest ${r.oldest}, newest ${r.newest})`
      );
    }

    const sample = await client.query(
      `SELECT domain, mail_class, unitary_cost, pcm_cost, updated_at
         FROM dm_customer_pricing
         ORDER BY domain, mail_class
         LIMIT 10`
    );
    console.log('\n[check] Sample rows (first 10):');
    for (const r of sample.rows) {
      console.log(
        `  - ${r.domain} / ${r.mail_class}: customer=$${r.unitary_cost}  pcm=$${r.pcm_cost ?? 'null'}  updated=${r.updated_at.toISOString()}`
      );
    }

    const paul = await client.query(
      `SELECT domain, mail_class, unitary_cost, pcm_cost, updated_at
         FROM dm_customer_pricing
         WHERE domain ILIKE '%paulfrancis%'`
    );
    if (paul.rows.length > 0) {
      console.log('\n[check] Paul Francis Homes verification:');
      for (const r of paul.rows) {
        console.log(
          `  - ${r.domain} / ${r.mail_class}: $${r.unitary_cost} (expected first_class=0.9000, standard=0.6600)`
        );
      }
    } else {
      console.log('\n[check] (No Paul Francis Homes row yet — domain filter matched nothing.)');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[check] Failed:', err);
  process.exit(1);
});
