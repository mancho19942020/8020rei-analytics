/**
 * Workspace Widgets
 *
 * Centralized exports for all widget components.
 */

// Overview tab widgets
export { MetricsOverviewWidget } from './MetricsOverviewWidget';
export { TimeSeriesWidget } from './TimeSeriesWidget';
export { BarChartWidget } from './BarChartWidget';
export { DataTableWidget } from './DataTableWidget';

// Users tab widgets
export { UserActivityWidget } from './UserActivityWidget';
export { NewVsReturningWidget } from './NewVsReturningWidget';
export { EngagementMetricsWidget } from './EngagementMetricsWidget';
export { SessionSummaryWidget } from './SessionSummaryWidget';

// Features tab widgets
export { FeatureUsageWidget } from './FeatureUsageWidget';
export { FeatureDistributionWidget } from './FeatureDistributionWidget';
export { FeatureAdoptionWidget } from './FeatureAdoptionWidget';
export { FeatureTrendWidget } from './FeatureTrendWidget';
export { TopPagesWidget } from './TopPagesWidget';

// Clients tab widgets
export { ClientsOverviewWidget } from './ClientsOverviewWidget';
export { ClientsTableWidget } from './ClientsTableWidget';
export { ClientActivityTrendWidget } from './ClientActivityTrendWidget';

// Traffic tab widgets
export { TrafficBySourceWidget } from './TrafficBySourceWidget';
export { TrafficByMediumWidget } from './TrafficByMediumWidget';
export { TopReferrersWidget } from './TopReferrersWidget';
export { SessionsByDayWidget } from './SessionsByDayWidget';
export { FirstVisitsTrendWidget } from './FirstVisitsTrendWidget';

// Technology tab widgets
export { DeviceCategoryWidget } from './DeviceCategoryWidget';
export { BrowserDistributionWidget } from './BrowserDistributionWidget';
export { OperatingSystemWidget } from './OperatingSystemWidget';
export { DeviceLanguageWidget } from './DeviceLanguageWidget';

// Geography tab widgets
export { CountryWidget } from './CountryWidget';
export { ContinentWidget } from './ContinentWidget';
export { RegionWidget } from './RegionWidget';
export { CityWidget } from './CityWidget';

// Events tab widgets
export { EventBreakdownWidget } from './EventBreakdownWidget';
export { EventVolumeTrendWidget } from './EventVolumeTrendWidget';
export { EventMetricsWidget } from './EventMetricsWidget';
export { ScrollDepthWidget } from './ScrollDepthWidget';

// Insights tab widgets
export { InsightsSummaryWidget } from './InsightsSummaryWidget';
export { AlertsByCategoryWidget } from './AlertsByCategoryWidget';
export { AlertsFeedWidget } from './AlertsFeedWidget';

// Product > Client Domains tab widgets
export { DomainActivityOverviewWidget } from './DomainActivityOverviewWidget';
export { DomainLeaderboardWidget } from './DomainLeaderboardWidget';
export { DomainActivityTrendWidget } from './DomainActivityTrendWidget';
export { RevenueByDomainWidget } from './RevenueByDomainWidget';

// Product > Product Projects tab widgets
export { ProjectStatusOverviewWidget } from './ProjectStatusOverviewWidget';
export { ProjectsTableWidget } from './ProjectsTableWidget';
export { BugTrackingWidget } from './BugTrackingWidget';
export { TeamWorkloadWidget } from './TeamWorkloadWidget';
export { DeliveryTimelineWidget } from './DeliveryTimelineWidget';

// Features > 8020REI > Rapid Response tab widgets
export { RrSystemStatusWidget } from './RrSystemStatusWidget';
export { RrOperationalPulseWidget } from './RrOperationalPulseWidget';
export { RrOpsStatusStripWidget } from './RrOpsStatusStripWidget';
export { RrQualityMetricsWidget } from './RrQualityMetricsWidget';
export { RrPcmHealthWidget } from './RrPcmHealthWidget';
export { RrPostalPerformanceWidget } from './RrPostalPerformanceWidget';
export { RrSendsTrendWidget } from './RrSendsTrendWidget';
export { RrStatusBreakdownWidget } from './RrStatusBreakdownWidget';
export { RrAlertsFeedWidget } from './RrAlertsFeedWidget';
export { RrCampaignTableWidget } from './RrCampaignTableWidget';
export { RrQ2GoalWidget } from './RrQ2GoalWidget';
export { RrQ2TopContributorsWidget } from './RrQ2TopContributorsWidget';
export { RrSystemCoverageWidget } from './RrSystemCoverageWidget';
export { RrDataIntegrityWidget } from './RrDataIntegrityWidget';

// Features > 8020REI > DM Campaign Overview tab widgets
export { DmOverviewHeadlineWidget } from './DmOverviewHeadlineWidget';
export { DmOverviewTestCostCardsWidget } from './DmOverviewTestCostCardsWidget';
export { DmOverviewSendTrendWidget } from './DmOverviewSendTrendWidget';
export { DmOverviewBalanceFlowWidget } from './DmOverviewBalanceFlowWidget';

// Features > 8020REI > DM Campaign Operational Health / Business Results tab widgets
export { DmAlertsFeedWidget } from './DmAlertsFeedWidget';
export { DmOnHoldBreakdownWidget } from './DmOnHoldBreakdownWidget';
export type { OnHoldBreakdownData, OnHoldBreakdownCampaign } from './DmOnHoldBreakdownWidget';
export { DmFunnelOverviewWidget } from './DmFunnelOverviewWidget';
export { DmClientPerformanceWidget } from './DmClientPerformanceWidget';
export { DmTemplateLeaderboardWidget } from './DmTemplateLeaderboardWidget';
export { DmConversionTrendWidget } from './DmConversionTrendWidget';
export { DmRevenueCostWidget } from './DmRevenueCostWidget';
export { DmGeoBreakdownWidget } from './DmGeoBreakdownWidget';
export { DmPropertyTimelineModal } from './DmPropertyTimelineModal';

// Features > 8020REI > Properties API tab widgets
export { ApiOverviewWidget } from './ApiOverviewWidget';
export { ApiCallsTrendWidget } from './ApiCallsTrendWidget';
export { ApiResponseTrendWidget } from './ApiResponseTrendWidget';
export { ApiEndpointBreakdownWidget } from './ApiEndpointBreakdownWidget';
export { ApiTopClientsWidget } from './ApiTopClientsWidget';
export { ApiErrorTrackerWidget } from './ApiErrorTrackerWidget';
export { ApiRecentLogsWidget } from './ApiRecentLogsWidget';

// Features > 8020REI > Auto Export tab widgets
export { AutoExportOverviewWidget } from './AutoExportOverviewWidget';
export { AutoExportAdoptionTrendWidget } from './AutoExportAdoptionTrendWidget';
export { AutoExportFrequencyBreakdownWidget } from './AutoExportFrequencyBreakdownWidget';
export { AutoExportReliabilityWidget } from './AutoExportReliabilityWidget';
export { AutoExportFailureReasonsWidget } from './AutoExportFailureReasonsWidget';
export { AutoExportRuntimeTrendWidget } from './AutoExportRuntimeTrendWidget';
export { AutoExportVolumeTrendWidget } from './AutoExportVolumeTrendWidget';
export { AutoExportTopClientsWidget } from './AutoExportTopClientsWidget';
export { AutoExportConfigHealthWidget } from './AutoExportConfigHealthWidget';
export { AutoExportRunLogWidget } from './AutoExportRunLogWidget';

// Features > 8020REI > DM Campaign PCM & Profitability tab widgets
export { PcmReconciliationOverviewWidget } from './PcmReconciliationOverviewWidget';
export { PcmVolumeComparisonWidget } from './PcmVolumeComparisonWidget';
export { PcmCostAnalysisWidget } from './PcmCostAnalysisWidget';
export { PcmStatusComparisonWidget } from './PcmStatusComparisonWidget';
export { PcmMismatchTableWidget } from './PcmMismatchTableWidget';
export { PcmMarginSummaryWidget } from './PcmMarginSummaryWidget';
export { PcmMailClassComparisonWidget } from './PcmMailClassComparisonWidget';
export { PcmClientMarginsWidget } from './PcmClientMarginsWidget';
export { PcmMarginTrendWidget } from './PcmMarginTrendWidget';
export { PcmPriceAlertWidget } from './PcmPriceAlertWidget';
export { PcmPriceChangeDetectionWidget } from './PcmPriceChangeDetectionWidget';
export { PcmPricingOverviewWidget } from './PcmPricingOverviewWidget';
export { PcmPricingHistoryWidget } from './PcmPricingHistoryWidget';
export { PcmDataMatchWidget } from './PcmDataMatchWidget';
export { PcmMarginPeriodWidget } from './PcmMarginPeriodWidget';
export { PcmClientsProfitableWidget } from './PcmClientsProfitableWidget';
export { PcmClientsBreakevenWidget } from './PcmClientsBreakevenWidget';
export { PcmClientsLosingWidget } from './PcmClientsLosingWidget';
export { PcmDomainTableWidget } from './PcmDomainTableWidget';
export { PcmTemplateTableWidget } from './PcmTemplateTableWidget';

// Product Tasks > Asana board widgets
export { AsanaBoardOverviewWidget } from './AsanaBoardOverviewWidget';
export { AsanaTasksTableWidget } from './AsanaTasksTableWidget';
export { AsanaTeamWorkloadWidget } from './AsanaTeamWorkloadWidget';
export { AsanaSectionBreakdownWidget } from './AsanaSectionBreakdownWidget';
export { AsanaWeeklyTrendWidget } from './AsanaWeeklyTrendWidget';
export { AsanaTaskAgingWidget } from './AsanaTaskAgingWidget';
export { AsanaAlertsFeedWidget } from './AsanaAlertsFeedWidget';

// Engagement tab widgets
export { PeakHoursWidget } from './PeakHoursWidget';
export { AvgSessionDurationWidget } from './AvgSessionDurationWidget';
export { SessionsPerUserWidget } from './SessionsPerUserWidget';
export { ActiveDaysWidget } from './ActiveDaysWidget';

// Platform Analytics tab widgets
export { PaActiveUsersWidget } from './PaActiveUsersWidget';
export { PaVisitorLogWidget } from './PaVisitorLogWidget';
export { PaUsageTrendsWidget } from './PaUsageTrendsWidget';
export { PaPopularSectionsWidget } from './PaPopularSectionsWidget';
export { PaPeakHoursWidget } from './PaPeakHoursWidget';
export { PaUserEngagementWidget } from './PaUserEngagementWidget';
