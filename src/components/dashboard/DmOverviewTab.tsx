/**
 * DmOverviewTab
 *
 * DM Campaign → Overview sub-tab. Executive lens for Camilo, his boss, and
 * the CEO: "is this tool making the company money?".
 *
 * Layout order:
 *   1. Headline row (4 cards): Active clients · Lifetime pieces · Company margin · Active campaigns
 *   2. Send volume trend (full-width, 14 months from PCM)
 *   3. Internal test cost (one card per QA domain + total)
 *   4. Balance reconciliation (daily pieces vs cost + PCM account balance)
 *
 * All reads go through /api/dm-overview which reads from the Aurora-persisted
 * cache (refreshed every 30 min by GitHub Actions). Users never wait on PCM.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AxisCallout, AxisSkeleton, AxisButton } from '@/components/axis';
import { authFetch } from '@/lib/auth-fetch';
import {
  DmOverviewHeadlineWidget,
  DmOverviewTestCostCardsWidget,
  DmOverviewSendTrendWidget,
  DmOverviewBalanceFlowWidget,
} from '@/components/workspace/widgets';
import { Widget } from '@/components/workspace/Widget';
import type {
  DmOverviewHeadline,
  DmOverviewSendTrend,
  DmOverviewBalanceFlow,
} from '@/types/dm-overview';

interface OverviewPayload {
  headline: DmOverviewHeadline | null;
  sendTrend: DmOverviewSendTrend | null;
  balanceFlow: DmOverviewBalanceFlow | null;
}

export function DmOverviewTab() {
  const [data, setData] = useState<OverviewPayload>({
    headline: null,
    sendTrend: null,
    balanceFlow: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s, b] = await Promise.all([
        authFetch('/api/dm-overview?type=headline').then((r) => r.json()),
        authFetch('/api/dm-overview?type=send-trend').then((r) => r.json()),
        authFetch('/api/dm-overview?type=balance-flow').then((r) => r.json()),
      ]);

      if (!h.success) throw new Error(h.error || 'Headline fetch failed');

      setData({
        headline: h.data as DmOverviewHeadline,
        sendTrend: s.success ? (s.data as DmOverviewSendTrend) : null,
        balanceFlow: b.success ? (b.data as DmOverviewBalanceFlow) : null,
      });
      setCacheAge(typeof h.ageMinutes === 'number' ? h.ageMinutes : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data.headline) {
    // Just skeletons — no scary "90 seconds" banner. With the Aurora cache,
    // every steady-state load is <500ms; the skeleton flashes briefly on fast
    // loads and fills the space if the very-first post-deploy request lands.
    return (
      <div className="space-y-4">
        <AxisSkeleton variant="widget" height="150px" fullWidth />
        <AxisSkeleton variant="chart" height="320px" fullWidth />
        <AxisSkeleton variant="widget" height="150px" fullWidth />
        <AxisSkeleton variant="chart" height="380px" fullWidth />
      </div>
    );
  }

  if (error && !data.headline) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <AxisCallout type="error" title="Failed to load overview">
          <p className="mb-4">{error}</p>
          <AxisButton onClick={fetchData} variant="filled">Retry</AxisButton>
        </AxisCallout>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headline row */}
      <div style={{ height: 150 }}>
        <Widget
          title="Headline metrics"
          tooltip="Active clients from rr_campaign_snapshots. Lifetime pieces: PCM authoritative, Aurora delta surfaced explicitly. Company margin = client revenue − PCM cost (includes internal test sends). Active campaigns: Aurora-only."
          flushBody
          timeScope="all-time"
          widgetKey="dm-overview-headline"
        >
          <DmOverviewHeadlineWidget data={data.headline} />
        </Widget>
      </div>

      {/* Send volume trend — full width (margin trend removed: dm_client_funnel has no historical months, and reconstructing from other tables would disagree with Profitability's lifetime margin, which is exactly the cross-tab inconsistency we committed to avoid) */}
      <div style={{ height: 320 }}>
        <Widget
          title="Send volume trend"
          tooltip="Monthly mail pieces sent since first PCM order. Sourced from PCM /order (14-month history). Excludes canceled orders and test domains."
          timeScope="all-time"
          widgetKey="dm-overview-send-trend"
        >
          <DmOverviewSendTrendWidget data={data.sendTrend} />
        </Widget>
      </div>

      {/* Internal test cost (per-domain card row) */}
      <div style={{ height: 150 }}>
        <Widget
          title="Internal test cost"
          tooltip="QA / sandbox environments paid by 8020REI with no client revenue. Deducted from the Company margin card above. One card per active test domain; totals on the right."
          flushBody
          timeScope="all-time"
          widgetKey="dm-overview-test-cost-cards"
        >
          <DmOverviewTestCostCardsWidget data={data.headline?.testActivity ?? null} />
        </Widget>
      </div>

      {/* Balance reconciliation */}
      <div style={{ height: 380 }}>
        <Widget
          title="Balance reconciliation"
          tooltip="Daily PCM cost (era-priced) alongside daily mail pieces, plus the current PCM account balance. Designed to surface days where sends spike but balance has not been topped up — the 'we spent 2K on a 200 top-up' pattern. Fixed 60-day window, independent of the header date filter."
          timeScope="all-time"
          widgetKey="dm-overview-balance-flow"
        >
          <DmOverviewBalanceFlowWidget data={data.balanceFlow} />
        </Widget>
      </div>

      {/* Fetch footer */}
      {data.headline && (
        <p className="text-xs text-content-tertiary px-2">
          Fetched at {new Date(data.headline.fetchedAt).toLocaleTimeString()}
          {cacheAge !== null && ` · Aurora cache age: ${cacheAge} min`}
          {' · Cron refreshes every 30 min · Aurora + PCM dual-sourced'}
        </p>
      )}
    </div>
  );
}
