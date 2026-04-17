/**
 * Aurora migration runner via SSM bastion tunnel.
 *
 * Reusable pattern for DDL / DBA operations that the app's RDS user cannot
 * execute (CREATE TABLE, GRANT, CREATE INDEX, etc.). Customize the DDL /
 * APP_USER at the top of the file for each new migration.
 *
 * Why this pattern:
 *   - The Developer_Full_Access SSO role lacks `rds-data:ExecuteStatement`.
 *   - The Aurora cluster is in a private VPC.
 *   - Bastion EC2 `i-0ec6ba57b6928eaec` ("bastion-host") is reachable via
 *     AWS SSM Session Manager — no SSH keys or VPN required.
 *   - The cluster master secret (rds!cluster-805145e7-…) grants DDL.
 *
 * Prerequisites:
 *   - `aws sso login --profile awsgerman`
 *   - session-manager-plugin installed
 *   - `pg` package available (in backend/node_modules)
 *
 * Usage:
 *   1. Open SSM tunnel in a background shell:
 *      aws ssm start-session --target i-0ec6ba57b6928eaec \
 *        --document-name AWS-StartPortForwardingSessionToRemoteHost \
 *        --parameters '{"host":["aurora-services-8020rei.cluster-cugyzrsol1ye.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}' \
 *        --profile awsgerman --region us-east-1 &
 *
 *   2. Copy this script into backend/ (so `pg` resolves), fetch master creds,
 *      run, then delete the copy:
 *      cp scripts/migrations/apply-via-bastion.ts backend/migrate.ts
 *      MASTER_SECRET="arn:aws:secretsmanager:us-east-1:611201211946:secret:rds!cluster-805145e7-57ac-4f93-b4fb-dc116eaf3bb7-qFVgHA"
 *      SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$MASTER_SECRET" --profile awsgerman --region us-east-1 --query 'SecretString' --output text)
 *      export PG_MASTER_USER=$(echo "$SECRET_JSON" | python3 -c "import json,sys;print(json.loads(sys.stdin.read())['username'])")
 *      export PG_MASTER_PASS=$(echo "$SECRET_JSON" | python3 -c "import json,sys;print(json.loads(sys.stdin.read())['password'])")
 *      cd backend && ./node_modules/.bin/tsx migrate.ts
 *      rm backend/migrate.ts
 *
 *   3. Close tunnel: kill the aws ssm process.
 *
 * History: applied 2026-04-17 to create dm_overview_cache + GRANT to
 * prod_aurora_db_user.
 */

import { Client } from 'pg';

// Master creds are provided via env vars (PG_MASTER_USER, PG_MASTER_PASS),
// fetched by the caller with `aws secretsmanager get-secret-value` using
// the awsgerman SSO profile.
const APP_USER = 'prod_aurora_db_user';
const DATABASE = 'grafana8020db';
const LOCAL_PORT = 15432;

const DDL = `
  CREATE TABLE IF NOT EXISTS dm_overview_cache (
    cache_key   TEXT        PRIMARY KEY,
    payload     JSONB       NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const GRANT_SQL = `GRANT SELECT, INSERT, UPDATE, DELETE ON dm_overview_cache TO ${APP_USER};`;

async function main() {
  const username = process.env.PG_MASTER_USER;
  const password = process.env.PG_MASTER_PASS;
  if (!username || !password) {
    throw new Error(
      'PG_MASTER_USER and PG_MASTER_PASS must be set. The caller injects these from Secrets Manager.'
    );
  }
  console.log(`[migration] Authenticating as master user "${username}"`);

  // 2. Connect through SSM tunnel on localhost:15432
  // RDS requires SSL. For the tunneled case we accept the cert (rejectUnauthorized false).
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
    // 3. CREATE TABLE
    await client.query(DDL);
    console.log('[migration] ✓ dm_overview_cache table ensured');

    // 4. GRANT
    await client.query(GRANT_SQL);
    console.log(`[migration] ✓ Granted CRUD on dm_overview_cache to ${APP_USER}`);

    // 5. Verify
    const r = await client.query(
      `SELECT COUNT(*) AS n FROM dm_overview_cache`
    );
    console.log(`[migration] ✓ Table is readable — ${r.rows[0].n} rows (expected 0)`);

    const grants = await client.query(
      `SELECT grantee, privilege_type
       FROM information_schema.role_table_grants
       WHERE table_name = 'dm_overview_cache' AND grantee = $1
       ORDER BY privilege_type`,
      [APP_USER]
    );
    console.log(`[migration] ✓ ${APP_USER} privileges:`, grants.rows.map((g) => g.privilege_type).join(', '));
  } finally {
    await client.end();
  }

  console.log('\n[migration] Done. The /api/dm-overview/refresh endpoint can now populate this cache.');
}

main().catch((err) => {
  console.error('[migration] Failed:', err);
  process.exit(1);
});
