/**
 * PCM Alignment Reconciler — orchestrator.
 *
 * Runs every 30 min on the same cadence as the overview-warmup cron, staggered
 * by 15 min so PCM isn't hit twice in the same minute.
 *
 * Strategy:
 *   1. Read the latest Aurora-cached payloads (headline/send-trend/balance-flow)
 *      that the warmup cron produced up to 15 min ago. These already contain
 *      both hub-side and PCM-side numbers computed with identical math — the
 *      cross-tab invariant "every tab's company margin matches to the cent"
 *      is enforced *by reusing the same computation*, not by independent
 *      re-derivation.
 *   2. Extract per-widget values and compare.
 *   3. Build AlignmentDoc[] and write to Firestore.
 *
 * When a contract has `splits_by_campaign_type = true`, the reconciler emits
 * three docs (total / rr / smartdrop). Until the monolith-side campaign_type
 * join is implemented (Phase 3b), the per-type rows are `info` severity with
 * `notes.pending = 'type-split-data'`.
 */

import { readCache, refreshAllCaches } from '@/app/api/dm-overview/compute';
import type {
  AlignmentDoc,
  AlignmentSeverity,
  AlignmentCampaignType,
  ReconcileRunResult,
} from '@/types/pcm-alignment';
import { WIDGET_CONTRACTS, contractId, IMPLEMENTED_RECONCILERS } from './contracts';
import { classifySeverity } from './severity';
import { writeAlignmentDocs, getPreviousSeverityMap, transitionKey } from './firestore-io';
import { classifyTransition, fireTransitionAlerts } from './slack-alerts';
import type { Transition } from './slack-alerts';
import { fetchCustomerRates, type CustomerRateSnapshot } from './customer-rates';

interface HeadlinePayload {
  lifetimePieces: { pcm: number; aurora: number };
  companyMargin: {
    margin: number;
    clientRevenue: number;
    pcmCostReal: number;
    pcmCostTest: number;
    grossMargin: number;
    auroraStoredPcmCost: number;
    auroraStoredMargin: number;
    pcmVsAuroraCostDelta: number;
  };
  adoption: { activeClients: number };
  activeCampaigns: { active: number };
  testActivity: { pieces: number; cost: number; perDomain: Array<{ domain: string; pieces: number; cost: number }> };
  meta: { pcmTotalOrders: number; pcmCanceled: number };
}

interface SendTrendPayload {
  series: Array<{
    month: string;
    firstClass: number;
    standard: number;
    total: number;
    cutoffDate: string;
    cutoffDay: number;
    isCurrentMonth: boolean;
  }>;
  todayDay: number;
  alignedAt: string;
  lifetimeTotal: number;
}

interface BalanceFlowPayload {
  balance: number;
  totalCost: number;
}

/**
 * One reconciliation pass. Writes Firestore docs (unless `dryRun`).
 * Returns a summary suitable for the cron response body + logs.
 */
export async function runReconcile({ dryRun }: { dryRun: boolean }): Promise<ReconcileRunResult> {
  const start = Date.now();
  const run_id = new Date().toISOString().substring(0, 19) + 'Z';
  const errors: string[] = [];

  // Read pre-computed payloads (populated by overview-warmup cron 0–30 min ago).
  const [headlineEnv, sendTrendEnv, balanceFlowEnv, customerRates] = await Promise.all([
    readCache<HeadlinePayload>('headline').catch((e) => {
      errors.push(`readCache(headline) failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }),
    readCache<SendTrendPayload>('send-trend').catch((e) => {
      errors.push(`readCache(send-trend) failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }),
    readCache<BalanceFlowPayload>('balance-flow').catch((e) => {
      errors.push(`readCache(balance-flow) failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }),
    fetchCustomerRates().catch((e) => {
      errors.push(`fetchCustomerRates failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }),
  ]);

  const headline = headlineEnv?.data ?? null;
  const sendTrend = sendTrendEnv?.data ?? null;
  const balanceFlow = balanceFlowEnv?.data ?? null;

  const docs: AlignmentDoc[] = [];

  for (const contract of WIDGET_CONTRACTS) {
    const id = contractId(contract);
    const implemented = IMPLEMENTED_RECONCILERS.has(id);

    const { hub, pcm, notes } = implemented
      ? extractValues(id, { headline, sendTrend, balanceFlow, customerRates })
      : { hub: null, pcm: null, notes: { status: 'not_implemented', scheduled_phase: '3b/3c' } };

    const campaignTypes: AlignmentCampaignType[] = contract.splits_by_campaign_type
      ? ['total', 'rr', 'smartdrop']
      : ['total'];

    for (const ct of campaignTypes) {
      // Per-type split is pending monolith campaign_type join. Until then, only
      // the `total` row carries actual values; `rr` + `smartdrop` are info stubs.
      const isTypeStub = ct !== 'total';
      const hubVal = isTypeStub ? null : hub;
      const pcmVal = isTypeStub ? null : pcm;
      const noteBag = isTypeStub
        ? { ...notes, pending: 'type-split-data', scheduled_phase: '3b' }
        : notes;

      const { severity, delta, delta_pct } = classifySeverity(hubVal, pcmVal, contract.thresholds);

      docs.push({
        run_id,
        widget_key: contract.widget_key,
        sub_key: contract.sub_key,
        campaign_type: ct,
        tab: contract.tab,
        hub_value: hubVal,
        pcm_value: pcmVal,
        delta,
        delta_pct,
        severity,
        autocorrect_action: contract.autocorrect_action,
        autocorrected: false,   // Phase 5 wires up the actual self-heal
        notes: noteBag as Record<string, unknown>,
        computed_at: new Date().toISOString(),
      });
    }
  }

  const severity_counts = docs.reduce<Record<AlignmentSeverity, number>>(
    (acc, d) => {
      acc[d.severity]++;
      return acc;
    },
    { green: 0, yellow: 0, red: 0, info: 0 },
  );

  // ─── Phase 5: self-heal + flag-monolith annotation ───────────────────────
  //
  // Self-heal only fires for red + refresh-cache (hub-owned caches we're
  // entitled to overwrite). Flag-monolith red findings are annotated in the
  // doc but not acted on — Phase 6 will pick those up for Slack alerts.
  //
  // Rate limit: one refreshAllCaches() call per reconcile cycle regardless of
  // how many widgets flag. The refresh rebuilds all overview caches in one
  // pass, so multiple triggers in a single cycle would be redundant work.
  //
  // Default OFF (opt-in) for initial rollout safety. Set
  // PCM_ALIGNMENT_SELF_HEAL=true on Cloud Run to enable. See the post-deploy
  // verification runbook in personal-documents for the rollout sequence.
  const selfHealEnabled = process.env.PCM_ALIGNMENT_SELF_HEAL === 'true';
  const healCandidates = docs.filter(
    (d) => d.severity === 'red' && d.autocorrect_action === 'refresh-cache',
  );
  const flagCandidates = docs.filter(
    (d) => d.severity === 'red' && d.autocorrect_action === 'flag-monolith',
  );

  let autocorrections_applied = 0;
  let selfHealError: string | null = null;

  if (!dryRun && selfHealEnabled && healCandidates.length > 0) {
    try {
      await refreshAllCaches();
      autocorrections_applied = healCandidates.length;
      for (const d of healCandidates) {
        d.autocorrected = true;
        d.notes = {
          ...d.notes,
          self_heal: 'dm_overview_cache refreshed; next cycle should resolve to green',
          self_heal_triggered_at: new Date().toISOString(),
        };
      }
    } catch (e) {
      selfHealError = e instanceof Error ? e.message : String(e);
      errors.push(`refreshAllCaches (self-heal) failed: ${selfHealError}`);
      for (const d of healCandidates) {
        d.autocorrected = false;
        d.notes = { ...d.notes, self_heal_error: selfHealError };
      }
    }
  }

  // Annotate flag-monolith reds so Phase 6's alerter has a stable, queryable
  // marker without re-deriving intent.
  for (const d of flagCandidates) {
    d.notes = {
      ...d.notes,
      needs_owner: 'monolith',
      action: 'flag-only — hub does not write monolith-owned tables',
    };
  }

  // ─── Phase 6: tier-transition detection + Slack alerts ───────────────────
  //
  // Read the previous severity per (widget × sub × campaign_type), compare to
  // the current run, and fire a Slack message only when severity crosses into
  // or out of 'red'. This is Germán's "Option A" — no 30-min ping spam for a
  // steady-state red; a single ping when it happens + morning digest later.
  //
  // Default OFF (opt-in) for initial rollout safety — prevents surprise Slack
  // pings to the team on first live reconcile. Set PCM_ALIGNMENT_SLACK=true
  // on Cloud Run to enable once the Firestore log has been validated.
  const slackEnabled = process.env.PCM_ALIGNMENT_SLACK === 'true';
  let alerts_fired = 0;
  const transitions: Transition[] = [];

  if (!dryRun && slackEnabled) {
    try {
      const previousMap = await getPreviousSeverityMap(docs[0]?.computed_at ?? new Date().toISOString());
      for (const d of docs) {
        const prev = previousMap.get(transitionKey(d.widget_key, d.sub_key, d.campaign_type)) ?? null;
        const t = classifyTransition(d, prev);
        if (t) {
          transitions.push(t);
          d.notes = { ...d.notes, transition: t.kind };
        }
      }
      alerts_fired = await fireTransitionAlerts(transitions);
    } catch (e) {
      errors.push(`transition alerts failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  let docs_written = 0;
  if (!dryRun) {
    try {
      docs_written = await writeAlignmentDocs(docs);
    } catch (e) {
      errors.push(`writeAlignmentDocs failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    run_id,
    dry_run: dryRun,
    docs_written,
    autocorrections_applied,
    alerts_fired,
    severity_counts,
    duration_ms: Date.now() - start,
    errors,
  };
}

/**
 * Per-widget extractor. Returns the pair of numbers to compare + free-form notes.
 * Kept as a single switch so the audit trail for how each widget is reconciled
 * lives in one file, readable against docs/alignment-contracts.md.
 */
function extractValues(
  id: string,
  sources: {
    headline: HeadlinePayload | null;
    sendTrend: SendTrendPayload | null;
    balanceFlow: BalanceFlowPayload | null;
    customerRates: CustomerRateSnapshot | null;
  },
): { hub: number | null; pcm: number | null; notes: Record<string, unknown> } {
  const { headline, sendTrend, balanceFlow, customerRates } = sources;

  switch (id) {
    // Aurora-only: activeClients / activeCampaigns → hub_value with pcm=null → info severity.
    case 'dm-overview-headline.active-clients':
      if (!headline) return missing('headline');
      return {
        hub: headline.adoption.activeClients,
        pcm: null,
        notes: { source: 'rr_campaign_snapshots via Aurora', pcm_equivalent: 'none' },
      };
    case 'dm-overview-headline.active-campaigns':
      if (!headline) return missing('headline');
      return {
        hub: headline.activeCampaigns.active,
        pcm: null,
        notes: { source: 'rr_campaign_snapshots via Aurora', pcm_equivalent: 'none' },
      };

    // Core reconciliation — Aurora vs PCM pieces count.
    // Aurora side reads delivered (USPS-confirmed) since that's what the
    // "Total delivered" hero card displays. Delta is expected and reflects
    // pieces still in transit, returned, or undeliverable.
    case 'dm-overview-headline.lifetime-pieces':
      if (!headline) return missing('headline');
      return {
        hub: headline.lifetimePieces.aurora,
        pcm: headline.lifetimePieces.pcm,
        notes: {
          aurora_source: 'dm_client_funnel.total_delivered',
          pcm_source: 'PCM /order count (excl test + canceled)',
          note: 'Aurora delivered ≤ PCM shipped — gap is in-transit / undeliverable',
        },
      };

    // Margin (sensitive). Aurora margin vs PCM-invoice-derived margin.
    // Hub displays the PCM-invoice margin (= auroraClientRevenue - pcmCostReal - pcmCostTest).
    // PCM "ground truth" for comparison = same formula using PCM-side numbers only.
    // Since both sides of computeHeadline use the SAME era rates, drift here
    // primarily reflects the delta between Aurora stored PCM cost and invoice PCM cost.
    case 'dm-overview-headline.company-margin':
      if (!headline) return missing('headline');
      return {
        hub: headline.companyMargin.margin,
        pcm: headline.companyMargin.clientRevenue - headline.companyMargin.pcmCostReal - headline.companyMargin.pcmCostTest,
        notes: {
          revenue: headline.companyMargin.clientRevenue,
          pcm_cost_real: headline.companyMargin.pcmCostReal,
          pcm_cost_test: headline.companyMargin.pcmCostTest,
          aurora_stored_margin: headline.companyMargin.auroraStoredMargin,
          pcm_vs_aurora_cost_delta: headline.companyMargin.pcmVsAuroraCostDelta,
          invariant: 'Must match Profitability > Net company margin to the cent',
        },
      };

    // Send trend: the MTD chart itself is same-day-cutoff, so summing its series
    // is NOT the lifetime total. We expose `lifetimeTotal` separately in the cache
    // specifically so this reconciliation keeps comparing apples to apples:
    // "did the sendTrend recount lose any orders vs what headline saw?"
    case 'dm-overview-send-trend':
      if (!sendTrend || !headline) return missing('sendTrend');
      return {
        hub: sendTrend.lifetimeTotal,
        pcm: headline.lifetimePieces.pcm,
        notes: {
          source: 'PCM /order lifetime (clients only) — same-shape as headline.lifetimePieces.pcm',
          aligned_to_day: sendTrend.todayDay,
          aligned_at: sendTrend.alignedAt,
          mtd_sum: sendTrend.series.reduce((s, m) => s + m.total, 0),
          month_count: sendTrend.series.length,
        },
      };

    // Test cost total — sum across per-domain entries.
    case 'dm-overview-test-cost-cards.total':
      if (!headline) return missing('headline');
      return {
        hub: headline.testActivity.cost,
        pcm: headline.companyMargin.pcmCostTest,
        notes: {
          pieces: headline.testActivity.pieces,
          domains: headline.testActivity.perDomain.map((d) => d.domain),
        },
      };

    // PCM account balance — hub displays what PCM reports; reconciliation is tautological
    // but we still record it for freshness + a warning if balance ≤ 0.
    case 'dm-overview-balance-flow.account-balance':
      if (!balanceFlow) return missing('balanceFlow');
      return {
        hub: balanceFlow.balance,
        pcm: balanceFlow.balance,
        notes: {
          source: 'PCM /integration/balance',
          warn_non_positive: balanceFlow.balance <= 0,
        },
      };

    // Profitability tab — same numbers as Overview, rolled up differently.
    // Cross-tab invariant: the Profitability net-company-margin MUST equal
    // Overview company-margin to the cent. We enforce this by reading from
    // the SAME source (computeHeadline) rather than re-deriving.
    case 'pcm-margin-summary.total-revenue':
      if (!headline) return missing('headline');
      return {
        hub: headline.companyMargin.clientRevenue,
        pcm: null,  // revenue is internal; no PCM equivalent
        notes: { source: 'dm_client_funnel.total_cost (what hub charged clients)' },
      };

    case 'pcm-margin-summary.pcm-cost-clients':
      if (!headline) return missing('headline');
      return {
        hub: headline.companyMargin.pcmCostReal,
        pcm: headline.companyMargin.auroraStoredPcmCost,
        notes: {
          hub_method: 'computePcmInvoiceCost(orders) — PCM /order × era rates',
          pcm_method_for_comparison: 'Aurora-stored total_pcm_cost from monolith',
          delta_hint: 'If hub > aurora_stored, monolith rates are stale ($0.625 vs $0.63)',
        },
      };

    case 'pcm-margin-summary.gross-margin':
      if (!headline) return missing('headline');
      return {
        hub: headline.companyMargin.grossMargin,
        pcm: headline.companyMargin.clientRevenue - headline.companyMargin.pcmCostReal,
        notes: { invariant: 'revenue − pcmCostReal = grossMargin' },
      };

    case 'pcm-margin-summary.internal-test-cost':
      if (!headline) return missing('headline');
      return {
        hub: headline.testActivity.cost,
        pcm: headline.companyMargin.pcmCostTest,
        notes: { invariant: 'Must match dm-overview-test-cost-cards.total' },
      };

    case 'pcm-margin-summary.net-company-margin':
      if (!headline) return missing('headline');
      return {
        hub: headline.companyMargin.margin,
        pcm: headline.companyMargin.grossMargin - headline.companyMargin.pcmCostTest,
        notes: {
          invariant: 'Must match Overview > Company margin to the cent',
          formula: 'grossMargin − internal test cost',
        },
      };

    // ─── Phase 3c: customer rate drift (data-driven, no hardcoded rates) ───
    //
    // Compares the 7-day-blended customer rate against the single most
    // recent day's rate, per class. Agreement = rate is stable. Divergence
    // = either a rate transition is in progress (avg catching up) OR orders
    // landed at an unexpected rate (monolith pricing update not propagated).
    //
    // hub = 7d avg (what the Pricing Overview widget displays as headline)
    // pcm = latest observed (what's actually happening on fresh orders)
    //
    // "pcm" here doesn't mean PCM-vendor-rate — it means "ground truth per
    // this metric's definition," which for customer rates is the latest
    // observed transaction, since we can't read the monolith's `parameters`
    // table directly from the hub. When the monolith ships dm_customer_pricing
    // to Aurora, we switch to that and rename this to `parameters` for clarity.
    case 'pcm-pricing-overview.standard-rate-drift':
      if (!customerRates || !customerRates.dataAvailable) return missing('customerRates');
      return {
        hub: customerRates.standard.avg7d,
        pcm: customerRates.standard.latest,
        notes: {
          class: 'standard',
          avg_7d: customerRates.standard.avg7d,
          latest_observed: customerRates.standard.latest,
          latest_observed_at: customerRates.standard.latestAt,
          source: 'dm_volume_summary (monolith-populated)',
          interpretation:
            'Green: 7d avg matches latest — rate stable. Yellow/Red: latest diverges from avg — rate transition in progress OR monolith pricing update not propagated. Hub cannot heal; flag to monolith team.',
        },
      };

    case 'pcm-pricing-overview.first-class-rate-drift':
      if (!customerRates || !customerRates.dataAvailable) return missing('customerRates');
      return {
        hub: customerRates.firstClass.avg7d,
        pcm: customerRates.firstClass.latest,
        notes: {
          class: 'first_class',
          avg_7d: customerRates.firstClass.avg7d,
          latest_observed: customerRates.firstClass.latest,
          latest_observed_at: customerRates.firstClass.latestAt,
          source: 'dm_volume_summary (monolith-populated)',
          note_on_null:
            customerRates.firstClass.latest === null
              ? 'No First Class orders in last 90 days — hub has no recent rate to confirm. If a new FC customer rate was set but no orders are flowing, the dashboard has no signal. Investigate send-pipeline activity for this class.'
              : undefined,
          interpretation:
            'Green: 7d avg matches latest — rate stable. Yellow/Red: latest diverges from avg — rate transition in progress OR monolith pricing update not propagated. Hub cannot heal; flag to monolith team.',
        },
      };

    default:
      return { hub: null, pcm: null, notes: { status: 'no_extractor_for_id', id } };
  }
}

function missing(source: string) {
  return {
    hub: null,
    pcm: null,
    notes: { status: 'source_payload_missing', source },
  };
}
