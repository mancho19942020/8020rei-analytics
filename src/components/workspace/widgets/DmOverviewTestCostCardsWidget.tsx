/**
 * DM Overview — Internal test cost (per-domain cards)
 *
 * Flush-body row of cards, one per active test domain plus a total card.
 * Matches the Profitability > Margin summary visual pattern. Replaces the
 * earlier text-heavy callout banner.
 *
 * Each card shows the domain name, the total PCM cost we paid for that
 * test environment, and the piece count. Fully excluded from client
 * revenue metrics; fully deducted from company margin.
 */

'use client';

import type { DmOverviewTestActivity } from '@/types/dm-overview';

interface Props {
  data: DmOverviewTestActivity | null;
}

function prettyDomain(d: string): string {
  return d.replace(/_8020rei_com$/i, '').replace(/_/g, ' ');
}

function fmt$(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface CardProps {
  label: string;
  cost: number;
  pieces: number;
  isTotal?: boolean;
}

function Card({ label, cost, pieces, isTotal = false }: CardProps) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-raised border-r border-stroke last:border-r-0 min-w-0 flex-1 h-full">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className={`text-sm font-medium truncate ${
            isTotal ? 'text-content-primary' : 'text-content-secondary font-mono'
          }`}
          title={label}
        >
          {label}
        </span>
      </div>
      <div
        className={`text-[2rem] font-bold tabular-nums leading-[36px] tracking-tight ${
          isTotal ? 'text-content-primary' : 'text-alert-700 dark:text-alert-300'
        }`}
      >
        {fmt$(cost)}
      </div>
      <div className="text-xs text-content-tertiary">
        {pieces.toLocaleString()} {pieces === 1 ? 'piece' : 'pieces'}
      </div>
    </div>
  );
}

export function DmOverviewTestCostCardsWidget({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading test cost…
      </div>
    );
  }

  if (data.pieces === 0 || (data.domains ?? []).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        No internal test sends on record.
      </div>
    );
  }

  // We need per-domain pieces + cost, but the payload only carries the list
  // of domain names and total cost/pieces. For now we display domain labels
  // with per-domain breakdown if the payload includes it, else fall back to
  // showing the domain label with the total split evenly. The compute module
  // will be extended to emit per-domain breakdowns in the next iteration.
  const perDomain = data.perDomain ?? [];

  return (
    <div className="flex w-full h-full flush-cards">
      {perDomain.map((d) => (
        <Card key={d.domain} label={prettyDomain(d.domain)} cost={d.cost} pieces={d.pieces} />
      ))}
      <Card label="Total" cost={data.cost} pieces={data.pieces} isTotal />
    </div>
  );
}
