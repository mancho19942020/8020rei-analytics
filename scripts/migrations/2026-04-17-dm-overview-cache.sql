-- DM Overview Aurora cache table
-- Created: 2026-04-17
--
-- Purpose: persist the computed DM Overview payloads (headline, send-trend,
-- margin-trend, balance-flow) so user-facing GET /api/dm-overview never waits
-- on PCM pagination. The /refresh cron populates this table every 15 min.
--
-- The Next.js RDS Data API user does not have CREATE privilege on the public
-- schema, so this DDL must be applied by a DBA/admin user. Run once per env.

CREATE TABLE IF NOT EXISTS dm_overview_cache (
  cache_key   TEXT        PRIMARY KEY,
  payload     JSONB       NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: explicit grant to the RDS Data API user (substitute <api_user>).
-- Uncomment and fill in if your api user doesn't already inherit from public.
-- GRANT SELECT, INSERT, UPDATE, DELETE ON dm_overview_cache TO <api_user>;
