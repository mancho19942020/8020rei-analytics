/**
 * PCM Reconciliation Service
 *
 * Runs periodic reconciliation between our Aurora data and the PostcardMania API.
 * Fetches orders, batches, and account info from PCM and compares against Aurora totals.
 *
 * Reconciliation results are cached in memory and served via the pcm-validation route.
 */

import { PcmApiClient, type PcmOrder, type PcmBalance, type PcmDesign } from './pcm-api-client.js';
import { AuroraService } from './aurora.service.js';

// ─── Types ─────────────────────────────────────────────────────

export interface ReconciliationSummary {
  lastRunAt: string | null;
  lastRunDurationMs: number;
  nextRunAt: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  error: string | null;

  // PCM account info
  pcmBalance: number;
  pcmOrderCount: number;
  pcmDesignCount: number;

  // Aurora totals (from dm_client_funnel latest snapshot)
  auroraTotalSends: number;
  auroraTotalDelivered: number;
  auroraTotalCost: number;
  auroraDomainCount: number;

  // Comparison
  volumeDelta: number;        // pcmOrderCount - auroraTotalSends
  volumeDeltaPercent: number;
  matchRate: number;          // percentage of alignment (0-100)

  // Per-domain Aurora breakdown
  domainBreakdown: DomainBreakdownRow[];

  // PCM order status distribution (when orders are accessible)
  pcmStatusDistribution: Record<string, number>;

  // PCM designs summary
  pcmDesigns: DesignSummary[];
}

export interface DomainBreakdownRow {
  domain: string;
  auroraSends: number;
  auroraDelivered: number;
  auroraCost: number;
  auroraMailed: number;
  pcmOrders: number;  // Will be 0 until order access is resolved
  delta: number;
}

export interface DesignSummary {
  designID: number;
  name: string;
  productType: string;
  approvedDate: string;
  mailClasses: string[];
}

export interface StatusComparisonRow {
  status: string;
  auroraCount: number;
  pcmCount: number;
  delta: number;
}

// ─── Service ───────────────────────────────────────────────────

const RECONCILIATION_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const TEST_DOMAINS_EXCLUSION = `
  AND domain NOT IN (
    '8020rei_demo', '8020rei_migracion_test',
    '_test_debug', '_test_debug3',
    'supertest_8020rei_com', 'sandbox_8020rei_com'
  )
`;

export class PcmReconciliationService {
  private pcmClient: PcmApiClient;
  private aurora: AuroraService;
  private summary: ReconciliationSummary | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.pcmClient = new PcmApiClient();
    this.aurora = new AuroraService();
  }

  isConfigured(): boolean {
    return this.pcmClient.isConfigured() && this.aurora.isConfigured();
  }

  getSummary(): ReconciliationSummary | null {
    return this.summary;
  }

  /** Start the recurring reconciliation job */
  start(): void {
    if (!this.isConfigured()) {
      console.log('[PCM Reconciliation] Not configured — skipping start');
      return;
    }

    console.log('[PCM Reconciliation] Starting (interval: 6h)');

    // Run immediately on start
    this.runReconciliation().catch(err =>
      console.error('[PCM Reconciliation] Initial run failed:', err)
    );

    // Schedule recurring runs
    this.intervalId = setInterval(() => {
      this.runReconciliation().catch(err =>
        console.error('[PCM Reconciliation] Scheduled run failed:', err)
      );
    }, RECONCILIATION_INTERVAL_MS);
  }

  /** Stop the recurring job */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[PCM Reconciliation] Stopped');
    }
  }

  /** Trigger a manual reconciliation run */
  async triggerManual(): Promise<ReconciliationSummary> {
    await this.runReconciliation();
    return this.summary!;
  }

  /** Core reconciliation logic */
  private async runReconciliation(): Promise<void> {
    if (this.summary?.status === 'running') {
      console.log('[PCM Reconciliation] Already running, skipping');
      return;
    }

    const startTime = Date.now();
    console.log('[PCM Reconciliation] Starting reconciliation run...');

    // Initialize summary as running
    this.summary = {
      ...this.getEmptySummary(),
      status: 'running',
      lastRunAt: new Date().toISOString(),
    };

    try {
      // Run PCM API and Aurora queries in parallel
      const [pcmData, auroraData] = await Promise.all([
        this.fetchPcmData(),
        this.fetchAuroraData(),
      ]);

      // Build the reconciliation summary
      const durationMs = Date.now() - startTime;

      this.summary = {
        lastRunAt: new Date().toISOString(),
        lastRunDurationMs: durationMs,
        nextRunAt: new Date(Date.now() + RECONCILIATION_INTERVAL_MS).toISOString(),
        status: 'completed',
        error: null,

        pcmBalance: pcmData.balance,
        pcmOrderCount: pcmData.orderCount,
        pcmDesignCount: pcmData.designCount,

        auroraTotalSends: auroraData.totalSends,
        auroraTotalDelivered: auroraData.totalDelivered,
        auroraTotalCost: auroraData.totalCost,
        auroraDomainCount: auroraData.domainCount,

        volumeDelta: pcmData.orderCount - auroraData.totalSends,
        volumeDeltaPercent: auroraData.totalSends > 0
          ? ((pcmData.orderCount - auroraData.totalSends) / auroraData.totalSends) * 100
          : 0,
        matchRate: this.calculateMatchRate(pcmData.orderCount, auroraData.totalSends),

        domainBreakdown: auroraData.domainBreakdown.map(d => ({
          ...d,
          pcmOrders: 0, // Will be populated when order access is resolved
          delta: 0 - d.auroraSends,
        })),

        pcmStatusDistribution: pcmData.statusDistribution,
        pcmDesigns: pcmData.designs,
      };

      console.log(`[PCM Reconciliation] Completed in ${durationMs}ms — ` +
        `Aurora: ${auroraData.totalSends} sends, PCM: ${pcmData.orderCount} orders, ` +
        `${pcmData.designCount} designs, $${pcmData.balance} balance`);

    } catch (err) {
      const error = err as Error;
      this.summary = {
        ...this.getEmptySummary(),
        status: 'error',
        error: error.message,
        lastRunAt: new Date().toISOString(),
        lastRunDurationMs: Date.now() - startTime,
      };
      console.error('[PCM Reconciliation] Failed:', error.message);
    }
  }

  /** Fetch data from the PCM API */
  private async fetchPcmData(): Promise<{
    balance: number;
    orderCount: number;
    designCount: number;
    statusDistribution: Record<string, number>;
    designs: DesignSummary[];
  }> {
    // Fetch in parallel: balance, orders (first page for count), designs
    const [balanceData, ordersData, designsData] = await Promise.all([
      this.pcmClient.getBalance().catch(err => {
        console.warn('[PCM Reconciliation] Balance fetch failed:', err.message);
        return { moneyOnAccount: 0 } as PcmBalance;
      }),
      this.pcmClient.getOrders({ page: 1, perPage: 1 }).catch(err => {
        console.warn('[PCM Reconciliation] Orders fetch failed:', err.message);
        return { results: [], pagination: { totalResults: 0, page: 1, perPage: 1, totalPages: 0, nextPage: null, prevPage: null } };
      }),
      this.pcmClient.getDesigns({ page: 1, perPage: 100 }).catch(err => {
        console.warn('[PCM Reconciliation] Designs fetch failed:', err.message);
        return { results: [], pagination: { totalResults: 0, page: 1, perPage: 100, totalPages: 0, nextPage: null, prevPage: null } };
      }),
    ]);

    // Build status distribution from orders if we have them
    const statusDistribution: Record<string, number> = {};
    if (ordersData.pagination.totalResults > 0) {
      // Fetch all orders for full status distribution
      const { orders } = await this.pcmClient.getAllOrders();
      for (const order of orders) {
        statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
      }
    }

    // Map designs to summary
    const designs: DesignSummary[] = designsData.results.map(d => ({
      designID: d.designID,
      name: (d as unknown as { friendlyName?: string }).friendlyName || d.name || `Design #${d.designID}`,
      productType: (d as unknown as { productType?: string }).productType || d.designType || 'unknown',
      approvedDate: (d as unknown as { approvalDateTime?: string }).approvalDateTime || d.createdOn || '',
      mailClasses: (d as unknown as { mailClasses?: string[] }).mailClasses || [],
    }));

    return {
      balance: balanceData.moneyOnAccount,
      orderCount: ordersData.pagination.totalResults,
      designCount: designsData.pagination.totalResults,
      statusDistribution,
      designs,
    };
  }

  /** Fetch data from Aurora */
  private async fetchAuroraData(): Promise<{
    totalSends: number;
    totalDelivered: number;
    totalCost: number;
    domainCount: number;
    domainBreakdown: Omit<DomainBreakdownRow, 'pcmOrders' | 'delta'>[];
  }> {
    // Get per-domain totals from dm_client_funnel (latest snapshot per domain)
    const rows = await this.aurora.executeQuery(`
      SELECT
        f.domain,
        COALESCE(f.total_sends, 0) as total_sends,
        COALESCE(f.total_delivered, 0) as total_delivered,
        COALESCE(f.total_cost, 0) as total_cost,
        COALESCE(f.total_properties_mailed, 0) as total_mailed
      FROM dm_client_funnel f
      INNER JOIN (
        SELECT domain, MAX(date) as max_date
        FROM dm_client_funnel
        WHERE domain IS NOT NULL
          ${TEST_DOMAINS_EXCLUSION}
        GROUP BY domain
      ) latest ON f.domain = latest.domain AND f.date = latest.max_date
      WHERE f.domain IS NOT NULL
        ${TEST_DOMAINS_EXCLUSION}
      ORDER BY COALESCE(f.total_sends, 0) DESC
    `);

    const domainBreakdown = rows.map(row => ({
      domain: String(row.domain),
      auroraSends: Number(row.total_sends || 0),
      auroraDelivered: Number(row.total_delivered || 0),
      auroraCost: Number(row.total_cost || 0),
      auroraMailed: Number(row.total_mailed || 0),
    }));

    const totalSends = domainBreakdown.reduce((sum, d) => sum + d.auroraSends, 0);
    const totalDelivered = domainBreakdown.reduce((sum, d) => sum + d.auroraDelivered, 0);
    const totalCost = domainBreakdown.reduce((sum, d) => sum + d.auroraCost, 0);

    return {
      totalSends,
      totalDelivered,
      totalCost,
      domainCount: domainBreakdown.length,
      domainBreakdown,
    };
  }

  /** Calculate match rate between two totals */
  private calculateMatchRate(pcmTotal: number, auroraTotal: number): number {
    if (pcmTotal === 0 && auroraTotal === 0) return 100;
    if (pcmTotal === 0 || auroraTotal === 0) return 0;
    const ratio = Math.min(pcmTotal, auroraTotal) / Math.max(pcmTotal, auroraTotal);
    return Math.round(ratio * 10000) / 100; // 2 decimal places
  }

  private getEmptySummary(): ReconciliationSummary {
    return {
      lastRunAt: null,
      lastRunDurationMs: 0,
      nextRunAt: null,
      status: 'idle',
      error: null,
      pcmBalance: 0,
      pcmOrderCount: 0,
      pcmDesignCount: 0,
      auroraTotalSends: 0,
      auroraTotalDelivered: 0,
      auroraTotalCost: 0,
      auroraDomainCount: 0,
      volumeDelta: 0,
      volumeDeltaPercent: 0,
      matchRate: 0,
      domainBreakdown: [],
      pcmStatusDistribution: {},
      pcmDesigns: [],
    };
  }
}
