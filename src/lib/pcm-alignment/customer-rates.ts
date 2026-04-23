/**
 * Customer rate detection — no hardcoded prices.
 *
 * Derives per-class customer rates from `dm_volume_summary` (the only place
 * the monolith writes customer-side cost × pieces). Two views:
 *   - `avg7d` — 7-day blended rate per class. Stable but lagging.
 *   - `latest` — single most recent day's rate per class. Surfaces price
 *     transitions the moment one order lands at a new rate.
 *
 * The divergence between the two is the signal: when they differ by >1%,
 * either a rate transition is in progress or the monolith's pricing update
 * didn't propagate to fresh orders. The reconciler flags this drift.
 *
 * This module does NOT hardcode any customer price. Per Germán's rule —
 * "updated and visible here and constantly updated, no through manual updates."
 */

import { runAuroraQuery, isAuroraConfigured } from '@/lib/aurora';
import { TEST_DOMAINS_SQL as TEST_DOMAINS } from '@/lib/domain-filter';

export interface ClassRateSnapshot {
  avg7d: number | null;
  latest: number | null;
  latestAt: string | null;
}

export interface CustomerRateSnapshot {
  standard: ClassRateSnapshot;
  firstClass: ClassRateSnapshot;
  dataAvailable: boolean;
}

/** Empty-state snapshot, returned when Aurora is unreachable. */
const EMPTY_SNAPSHOT: CustomerRateSnapshot = {
  standard: { avg7d: null, latest: null, latestAt: null },
  firstClass: { avg7d: null, latest: null, latestAt: null },
  dataAvailable: false,
};

/**
 * Fetch both views of customer rates (7d avg + latest observed) in a single
 * Aurora round-trip per view. Returns null-filled snapshot on error so the
 * reconciler keeps running.
 */
export async function fetchCustomerRates(): Promise<CustomerRateSnapshot> {
  if (!isAuroraConfigured()) return EMPTY_SNAPSHOT;

  try {
    const [avgRows, latestRows] = await Promise.all([
      runAuroraQuery(`
        SELECT
          mail_class,
          ROUND(SUM(daily_cost)::numeric / NULLIF(SUM(daily_sends), 0)::numeric, 4) AS rate
        FROM dm_volume_summary
        WHERE mail_class IN ('standard', 'first_class')
          AND date >= CURRENT_DATE - INTERVAL '7 days'
          AND daily_sends > 0
          AND domain NOT IN (${TEST_DOMAINS})
        GROUP BY mail_class
      `),
      runAuroraQuery(`
        WITH ranked AS (
          SELECT
            mail_class,
            date,
            daily_cost,
            daily_sends,
            ROW_NUMBER() OVER (PARTITION BY mail_class ORDER BY date DESC) AS rn
          FROM dm_volume_summary
          WHERE mail_class IN ('standard', 'first_class')
            AND date >= CURRENT_DATE - INTERVAL '90 days'
            AND daily_sends > 0
            AND domain NOT IN (${TEST_DOMAINS})
        )
        SELECT
          mail_class,
          date,
          ROUND(daily_cost::numeric / NULLIF(daily_sends, 0)::numeric, 4) AS rate
        FROM ranked
        WHERE rn = 1
      `),
    ]);

    const avgStd = avgRows.find((r) => r.mail_class === 'standard');
    const avgFc = avgRows.find((r) => r.mail_class === 'first_class');
    const latestStd = latestRows.find((r) => r.mail_class === 'standard');
    const latestFc = latestRows.find((r) => r.mail_class === 'first_class');

    const snapshot: CustomerRateSnapshot = {
      standard: {
        avg7d: avgStd ? Number(avgStd.rate) : null,
        latest: latestStd ? Number(latestStd.rate) : null,
        latestAt: latestStd?.date ? String(latestStd.date).slice(0, 10) : null,
      },
      firstClass: {
        avg7d: avgFc ? Number(avgFc.rate) : null,
        latest: latestFc ? Number(latestFc.rate) : null,
        latestAt: latestFc?.date ? String(latestFc.date).slice(0, 10) : null,
      },
      dataAvailable: avgRows.length > 0 || latestRows.length > 0,
    };

    return snapshot;
  } catch (e) {
    // Surface to caller via dataAvailable=false; the reconciler records an
    // `info` severity with a notes.error explaining the fetch failure.
    console.error('[customer-rates] fetch failed', e);
    return EMPTY_SNAPSHOT;
  }
}
