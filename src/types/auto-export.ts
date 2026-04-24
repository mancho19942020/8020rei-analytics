/**
 * Auto Export — shared types
 *
 * Shapes returned by /api/auto-export and consumed by the Auto Export
 * tab widgets. Mirrors the field-level rationale in
 * personal-documents/8020-metrics-hub/auto-export/AUTO_EXPORT_DATA_MODEL.md.
 */

export interface AutoExportTrend {
  value: number;
  isPositive: boolean;
}

export interface AutoExportOverview {
  activeClients: number;
  totalRuns: number;
  successRate: number;
  propertiesExported: number;
  trends?: {
    activeClients: AutoExportTrend;
    totalRuns: AutoExportTrend;
    successRate: AutoExportTrend;
    propertiesExported: AutoExportTrend;
  };
}

export interface AutoExportAdoptionPoint {
  date: string;
  activeClients: number;
}

export interface AutoExportAdoption {
  series: AutoExportAdoptionPoint[];
  goal: number;
}

export interface AutoExportReliabilityPoint {
  date: string;
  sent: number;
  failed: number;
  noResults: number;
  pending: number;
}

export interface AutoExportFailureReason {
  errorMessage: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  affectedDomains: number;
  affectedConfigs: number;
}

export interface AutoExportRuntimePoint {
  date: string;
  avgRuntimeSeconds: number;
  p95RuntimeSeconds: number;
}

export interface AutoExportReliability {
  stacks: AutoExportReliabilityPoint[];
  runtime: AutoExportRuntimePoint[];
  failureReasons: AutoExportFailureReason[];
}

export interface AutoExportVolumePoint {
  date: string;
  propertiesExported: number;
}

export interface AutoExportFrequencyBreakdown {
  daily: number;
  weekly: number;
  monthly: number;
  quarterly: number;
}

export interface AutoExportVolume {
  series: AutoExportVolumePoint[];
  frequency: AutoExportFrequencyBreakdown;
}

export interface AutoExportConfigHealth {
  orphaned: number;
  neverRun: number;
  stale: number;
}

export interface AutoExportTopClient {
  domain: string;
  activeConfigs: number;
  runs: number;
  successRate: number;
  propertiesExported: number;
  lastActivity: string;
}

export interface AutoExportRunLogEntry {
  id: number;
  domain: string;
  configurationId: number;
  configuredFilterName: string | null;
  frequency: string;
  filterPropertiesBy: string;
  status: string;
  retryCount: number;
  propertiesCount: number | null;
  fileFormat: string | null;
  recipientsCount: number;
  errorMessage: string | null;
  durationSeconds: number | null;
  createdBy: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface AutoExportRunLogPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AutoExportData {
  overview: AutoExportOverview | null;
  adoption: AutoExportAdoption | null;
  reliability: AutoExportReliability | null;
  volume: AutoExportVolume | null;
  configHealth: AutoExportConfigHealth | null;
  topClients: AutoExportTopClient[];
  runLog: AutoExportRunLogEntry[];
}
