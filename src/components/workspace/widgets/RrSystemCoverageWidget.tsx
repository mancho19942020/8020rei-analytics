/**
 * System Coverage Widget (Operational Health)
 *
 * 4 MetricCards showing data pipeline coverage:
 * Clients tracked | Templates tracked | Properties tracked | Attribution rate
 *
 * Moved from Business Results "Data quality" pills → redesigned as MetricCards.
 */

'use client';

import { MetricCard } from '@/components/workspace/MetricCard';

interface RrSystemCoverageData {
  totalClients: number;
  totalTemplates: number;
  totalProperties: number;
  attributionRate: number;
  attributedCount: number;
  propertyDataAvailable: boolean;
}

interface RrSystemCoverageWidgetProps {
  data: RrSystemCoverageData | null;
}

const ClientsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const TemplatesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const PropertiesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const AttributionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function RrSystemCoverageWidget({ data }: RrSystemCoverageWidgetProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
        System coverage data loading...
      </div>
    );
  }

  const hasPropertyData = data.propertyDataAvailable || data.totalProperties > 0;
  const attrColor = data.attributionRate >= 80 ? 'bg-success-700' : data.attributionRate >= 60 ? 'bg-alert-700' : 'bg-error-700';

  return (
    <div className="flex w-full h-full flush-cards">
      <MetricCard
        label="Clients tracked"
        value={data.totalClients}
        icon={<ClientsIcon />}
        iconBgClass="bg-main-700"
        format="number"
        subtitle="Distinct client domains in dm_property_conversions (excludes test domains). 8020REI internal view — NOT the same as PCM domain count, which only sees domains that have physical orders."
      />
      <MetricCard
        label="Templates tracked"
        value={data.totalTemplates}
        icon={<TemplatesIcon />}
        iconBgClass="bg-accent-1-700"
        format="number"
        subtitle="Distinct 8020REI template configurations used across all domains (from dm_property_conversions). NOT the same as PCM's design catalog size — PCM tracks ~28 canonical designs in the vendor system; see PCM & Profitability → Template catalog for the PCM-side count."
      />
      <MetricCard
        label="Properties tracked"
        value={hasPropertyData ? data.totalProperties : 0}
        icon={<PropertiesIcon />}
        iconBgClass="bg-accent-2-700"
        format="number"
        subtitle={hasPropertyData ? 'Distinct property records in the conversion tracking system. A single property that received multiple pieces counts as 1 here; for total deliveries see DM Campaign → Overview → Total delivered.' : 'Property data pending monolith fix'}
      />
      <MetricCard
        label="Attribution rate"
        value={hasPropertyData ? `${data.attributionRate}%` : '—'}
        icon={<AttributionIcon />}
        iconBgClass={hasPropertyData ? attrColor : 'bg-neutral-500'}
        subtitle={hasPropertyData ? `${data.attributedCount} of ${data.totalProperties} properties linked to a campaign. Conversions before Sep 2025 have NULL attribution by design, so 100% is unreachable for lifetime-scoped views.` : 'Property data pending monolith fix'}
      />
    </div>
  );
}
