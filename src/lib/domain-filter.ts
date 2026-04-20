/**
 * Canonical test-domain exclusion list.
 *
 * Every DM Campaign query (Overview, Operational Health, Business Results,
 * Profitability, alerts) MUST filter these out of any metric presented as
 * "real client" data. Internal QA / demo / sandbox domains still incur PCM
 * cost and are surfaced separately on the Overview → Internal test cost row,
 * but they are never counted as revenue, adoption, conversions, or campaigns.
 *
 * Source of truth: this file. Duplicating the list in individual route files
 * caused cross-tab drift (e.g. qapre_8020rei_com and testing5_8020rei_com
 * were missing from 7 of 8 endpoints prior to 2026-04-17 consolidation).
 */

export const TEST_DOMAINS: readonly string[] = [
  '8020rei_demo',
  '8020rei_migracion_test',
  '_test_debug',
  '_test_debug3',
  'supertest_8020rei_com',
  'sandbox_8020rei_com',
  'qapre_8020rei_com',
  'testing5_8020rei_com',
  'showcaseproductsecomllc_8020rei_com',
];

export const TEST_DOMAIN_SET: ReadonlySet<string> = new Set(TEST_DOMAINS);

/** Comma-separated single-quoted SQL list, safe for `domain NOT IN (...)` clauses. */
export const TEST_DOMAINS_SQL: string = TEST_DOMAINS.map((d) => `'${d}'`).join(', ');

/** Canonical SQL predicate — use wherever a WHERE clause needs to exclude test domains. */
export const EXCLUDE_TEST_DOMAINS_SQL: string = `domain NOT IN (${TEST_DOMAINS_SQL})`;
