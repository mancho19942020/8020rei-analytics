-- =========================================================================
--  dm_customer_pricing — per-domain current customer rate snapshot
-- =========================================================================
--
-- PURPOSE: expose the monolith's `parameters.unitary_cost` (per company_id)
-- in Aurora so the metrics hub can display each client's live customer rate
-- (e.g. Paul Francis Homes FC = $0.90) without guessing from aggregates.
--
-- MOTIVATION (2026-04-20): the Pricing overview widget currently displays a
-- 7-day blended rate across ALL clients ($0.6542 Std). Individual clients
-- can be on different rates — Johansy updated Std $0.63 → $0.66 and FC
-- $0.87 → $0.90 on Apr 16, but FC aggregate still reads $0.87 in Aurora
-- because no FC sends have happened since. There is no way for the metrics
-- hub to know each tenant's live parameters.unitary_cost today.
--
-- WRITER (expected, monolith side — NOT YET IMPLEMENTED):
--   Extend services/InsightsMetricService.php — add a per-domain
--   syncCustomerPricing() method that reads Parameters::whereIn([
--     'rapid-response-standard', 'rapid-response-first-class',
--   ]) and upserts one row per (domain, mail_class) into this Aurora table.
--   Call from InsightsToAuroraJob::handle() alongside the existing
--   syncCampaignSnapshots / syncDailyMetrics / syncPcmAlignment.
--
-- READER (metrics hub, once data lands):
--   PcmPricingOverviewWidget replaces its aggregate card with a per-domain
--   breakdown. When filter_by_client_domain is set, card shows that client's
--   exact rates; otherwise collapses to a "X clients, rates range $A-$B" summary.
--   Until this writer ships, the widget keeps the aggregate + "Aggregate
--   across clients" caveat.
--
-- APPLY: use scripts/migrations/apply-via-bastion.ts with the SSO flow
-- documented in .ai/reference/aurora-ddl-protocol.md (memory:
-- feedback_aurora_ddl_protocol.md). Idempotent — safe to re-run.
-- =========================================================================

CREATE TABLE IF NOT EXISTS dm_customer_pricing (
  domain                VARCHAR(255) NOT NULL,
  mail_class            VARCHAR(32)  NOT NULL,         -- 'standard' | 'first_class'
  unitary_cost          NUMERIC(10,4) NOT NULL,        -- parameters.unitary_cost (per-piece $)
  pcm_cost              NUMERIC(10,4) NULL,            -- parameters.pcm_cost (vendor side, known-stale)
  effective_from        DATE NULL,                     -- if monolith ever writes history, lower bound
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (domain, mail_class)
);

CREATE INDEX IF NOT EXISTS ix_dm_customer_pricing_updated
  ON dm_customer_pricing (updated_at DESC);

COMMENT ON TABLE dm_customer_pricing IS
  'Per-domain customer pricing snapshot, synced from monolith parameters table. '
  'Each (domain, mail_class) pair = one row with the current unitary_cost. '
  'Written by InsightsToAuroraJob after syncCustomerPricing() lands in '
  'services/InsightsMetricService.php (see 2026-04-20 audit entry session 8).';

COMMENT ON COLUMN dm_customer_pricing.unitary_cost IS
  'What 8020REI charges this client per piece. Source of truth at runtime: '
  'parameters.unitary_cost (WHERE name IN (rapid-response-standard, '
  'rapid-response-first-class)). The Checkout screen at '
  'services/RapidResponses/RapidResponseService.php:786-803 reads the same field.';

COMMENT ON COLUMN dm_customer_pricing.pcm_cost IS
  'Monolith-stored PCM vendor cost per piece. Historically set to $0.625/$0.875 '
  'which matches no invoice. Metrics hub IGNORES this column for margin — uses '
  'src/lib/pcm-pricing-eras.ts (invoice-verified era schedule) instead. Stored '
  'here only for reconciliation / drift visibility.';
