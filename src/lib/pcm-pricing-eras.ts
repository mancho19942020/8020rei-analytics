/**
 * PCM pricing eras — single source of truth for what PCM charges 8020REI.
 *
 * IMPORTANT: only the PCM-cost side of the P&L uses these hardcoded rates.
 * Customer-side revenue (what 8020REI charges its clients) is tracked
 * reliably by the monolith in `dm_client_funnel.total_cost` and
 * `dm_volume_summary.daily_cost` — no inference needed there. The Pricing
 * history widget derives the full customer-rate trend directly from those
 * columns. We only hardcode PCM rates because:
 *   (a) the monolith's `parameters.pcm_cost` uses $0.625/$0.875 which
 *       matches no invoice, and
 *   (b) it's null for ~8% of pieces lifetime / ~88% of last 30 days.
 * PCM invoice rates change only when the vendor contract changes (quarterly
 * at most), so hardcoding them here is safe; it's a rate schedule, not a
 * live metric. Any consumer doing a margin calculation must cross this
 * schedule with Aurora's customer revenue — the asymmetry is intentional.
 *
 * Rates verified from 264 PCM invoice PDFs spanning Dec 2024 – Apr 2026.
 * If PCM changes pricing, update this file only — every consumer picks up
 * the new rate on the next deploy with no code change elsewhere.
 *
 * Drift prevented: previously `dm-overview/compute.ts` had Era 2 FC at
 * $1.14 while `dm-reports/route.ts` + `pcm-validation/route.ts` had $1.16.
 * Camilo-verified invoice rate is $1.16. Consolidating into this module
 * eliminated ~$43 of cumulative margin drift in All-time calculations.
 */

export interface PcmEra {
  /** Start month, YYYY-MM (inclusive) */
  start: string;
  /** End month, YYYY-MM (inclusive). '2099-12' = current/indefinite. */
  end: string;
  label: string;
  /** First-class per-piece rate PCM charges 8020REI in this era */
  fcRate: number;
  /** Standard per-piece rate PCM charges 8020REI in this era */
  stdRate: number;
}

export const PCM_ERAS: readonly PcmEra[] = [
  { start: '2024-12', end: '2025-06', label: 'Era 1: Original', fcRate: 0.94, stdRate: 0.74 },
  { start: '2025-07', end: '2025-10', label: 'Era 2: Price hike', fcRate: 1.16, stdRate: 0.93 },
  { start: '2025-11', end: '2099-12', label: 'Era 3: Current',    fcRate: 0.87, stdRate: 0.63 },
];

/**
 * Find the PCM era covering a given date (YYYY-MM-DD).
 * Returns the latest era as a fallback if no match (should not happen with
 * the current era list since era 3 extends to 2099).
 */
export function getPcmEra(dateISO: string): PcmEra {
  const month = dateISO.slice(0, 7);
  for (const era of PCM_ERAS) {
    if (month >= era.start && month <= era.end) return era;
  }
  return PCM_ERAS[PCM_ERAS.length - 1];
}

/**
 * Per-piece PCM rate for a given date + mail class. Used throughout the
 * Profitability tab, Overview Company margin, and Reports.
 */
export function pcmRate(dateISO: string, mailClass: 'fc' | 'std'): number {
  const era = getPcmEra(dateISO);
  return mailClass === 'fc' ? era.fcRate : era.stdRate;
}

/** Rates effective today — convenience for widgets showing current state. */
export function currentPcmRates(): { fc: number; std: number; era: PcmEra } {
  const today = new Date().toISOString().slice(0, 10);
  const era = getPcmEra(today);
  return { fc: era.fcRate, std: era.stdRate, era };
}

/**
 * Sum era-rate PCM cost over a list of orders. Orders should already be
 * filtered (non-canceled, non-test-domain). Returns a rounded-to-cent value.
 */
export function computePcmInvoiceCost(orders: Array<{ date: string; mailClass: 'fc' | 'std' }>): number {
  let total = 0;
  for (const o of orders) total += pcmRate(o.date, o.mailClass);
  return Math.round(total * 100) / 100;
}
