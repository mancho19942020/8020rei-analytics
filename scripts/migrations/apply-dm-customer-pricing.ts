/**
 * Aurora migration runner for dm_customer_pricing.
 *
 * Clone of apply-via-bastion.ts adapted for the 2026-04-20 customer-pricing
 * table. See that file's header comment for the full protocol + prerequisites.
 *
 * Context: monolith PR feat(Metrics): sync customer pricing per domain to
 * Aurora (#1969) will start writing one row per (domain, mail_class) into
 * this table on every hourly InsightsToAuroraJob run. Must exist before PR
 * merges or syncCustomerPricing() will log errors.
 *
 * Usage (run from metrics-hub repo root):
 *   1. aws sso login --profile awsgerman
 *   2. Start SSM tunnel in background:
 *      aws ssm start-session --target i-0ec6ba57b6928eaec \
 *        --document-name AWS-StartPortForwardingSessionToRemoteHost \
 *        --parameters '{"host":["aurora-services-8020rei.cluster-cugyzrsol1ye.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}' \
 *        --profile awsgerman --region us-east-1 &
 *   3. Fetch master creds + run:
 *      cp scripts/migrations/apply-dm-customer-pricing.ts backend/migrate.ts
 *      MASTER_SECRET="arn:aws:secretsmanager:us-east-1:611201211946:secret:rds!cluster-805145e7-57ac-4f93-b4fb-dc116eaf3bb7-qFVgHA"
 *      SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$MASTER_SECRET" --profile awsgerman --region us-east-1 --query 'SecretString' --output text)
 *      export PG_MASTER_USER=$(echo "$SECRET_JSON" | python3 -c "import json,sys;print(json.loads(sys.stdin.read())['username'])")
 *      export PG_MASTER_PASS=$(echo "$SECRET_JSON" | python3 -c "import json,sys;print(json.loads(sys.stdin.read())['password'])")
 *      cd backend && ./node_modules/.bin/tsx migrate.ts
 *      rm backend/migrate.ts
 *   4. Kill the aws ssm process.
 */

import { Client } from 'pg';

const APP_USER = 'prod_aurora_db_user';
const DATABASE = 'grafana8020db';
const LOCAL_PORT = 15432;

const DDL = `
  CREATE TABLE IF NOT EXISTS dm_customer_pricing (
    domain         VARCHAR(255)  NOT NULL,
    mail_class     VARCHAR(32)   NOT NULL,
    unitary_cost   NUMERIC(10,4) NOT NULL,
    pcm_cost       NUMERIC(10,4) NULL,
    effective_from DATE          NULL,
    updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (domain, mail_class)
  );

  CREATE INDEX IF NOT EXISTS ix_dm_customer_pricing_updated
    ON dm_customer_pricing (updated_at DESC);
`;

const GRANT_SQL = `GRANT SELECT, INSERT, UPDATE, DELETE ON dm_customer_pricing TO ${APP_USER};`;

async function main() {
  const username = process.env.PG_MASTER_USER;
  const password = process.env.PG_MASTER_PASS;
  if (!username || !password) {
    throw new Error(
      'PG_MASTER_USER and PG_MASTER_PASS must be set. The caller injects these from Secrets Manager.'
    );
  }
  console.log(`[migration] Authenticating as master user "${username}"`);

  const client = new Client({
    host: 'localhost',
    port: LOCAL_PORT,
    database: DATABASE,
    user: username,
    password,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('[migration] Connected to Aurora via SSM tunnel');

  try {
    await client.query(DDL);
    console.log('[migration] ✓ dm_customer_pricing table + index ensured');

    await client.query(GRANT_SQL);
    console.log(`[migration] ✓ Granted CRUD on dm_customer_pricing to ${APP_USER}`);

    const r = await client.query(`SELECT COUNT(*) AS n FROM dm_customer_pricing`);
    console.log(`[migration] ✓ Table is readable — ${r.rows[0].n} rows (expected 0 on first run)`);

    const grants = await client.query(
      `SELECT grantee, privilege_type
       FROM information_schema.role_table_grants
       WHERE table_name = 'dm_customer_pricing' AND grantee = $1
       ORDER BY privilege_type`,
      [APP_USER]
    );
    console.log(
      `[migration] ✓ ${APP_USER} privileges:`,
      grants.rows.map((g) => g.privilege_type).join(', ')
    );

    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'dm_customer_pricing'
       ORDER BY ordinal_position`
    );
    console.log('[migration] ✓ Columns:');
    for (const c of cols.rows) {
      console.log(`    - ${c.column_name} (${c.data_type}, nullable=${c.is_nullable})`);
    }
  } finally {
    await client.end();
  }

  console.log(
    '\n[migration] Done. Monolith InsightsToAuroraJob can now write to dm_customer_pricing.'
  );
}

main().catch((err) => {
  console.error('[migration] Failed:', err);
  process.exit(1);
});
