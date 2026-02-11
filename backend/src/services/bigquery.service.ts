/**
 * BigQuery Service
 *
 * Handles all BigQuery operations for GA4 analytics data.
 * Supports multiple properties (8020REI, 8020Roofing).
 *
 * This service will eventually consolidate all BigQuery queries
 * from the frontend src/lib/queries.ts file.
 */

import { BigQuery } from '@google-cloud/bigquery';

// Property configuration
const GA4_PROPERTIES: Record<string, { projectId: string; datasetId: string }> = {
  '8020rei': {
    projectId: 'web-app-production-451214',
    datasetId: 'analytics_489035450',
  },
  '8020roofing': {
    projectId: 'web-app-production-451214', // TODO: Update with actual project
    datasetId: 'analytics_XXXXXXXXX', // TODO: Update with actual dataset
  },
};

type UserType = 'all' | 'internal' | 'external';

export class BigQueryService {
  private client: BigQuery;

  constructor() {
    // Initialize BigQuery client
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentials) {
      // Production: Use service account credentials from env
      const parsedCredentials = JSON.parse(credentials);
      this.client = new BigQuery({
        projectId: parsedCredentials.project_id,
        credentials: parsedCredentials,
      });
      console.log('[BigQuery] Initialized with service account credentials');
    } else {
      // Local development: Use gcloud CLI credentials
      this.client = new BigQuery();
      console.log('[BigQuery] Using Application Default Credentials (gcloud CLI)');
    }
  }

  /**
   * Get the BigQuery dataset for a property
   */
  private getDataset(property: string) {
    const config = GA4_PROPERTIES[property];
    if (!config) {
      throw new Error(`Unknown property: ${property}`);
    }
    return `\`${config.projectId}.${config.datasetId}\``;
  }

  /**
   * Build user filter clause based on userType
   */
  private getUserFilterClause(userType: UserType): string {
    switch (userType) {
      case 'internal':
        return "AND user_affiliation = 'internal'";
      case 'external':
        return "AND user_affiliation = 'external'";
      default:
        return '';
    }
  }

  /**
   * Get main metrics for dashboard overview
   */
  async getMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<{
    total_users: number;
    total_events: number;
    page_views: number;
    active_clients: number;
  }> {
    const dataset = this.getDataset(property);
    const userFilter = this.getUserFilterClause(userType);

    const query = `
      WITH user_sessions AS (
        SELECT
          user_pseudo_id,
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_affiliation') AS user_affiliation
        FROM ${dataset}.events_*
        WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
        ${userFilter}
      )
      SELECT
        COUNT(DISTINCT user_pseudo_id) as total_users,
        COUNT(*) as total_events,
        COUNTIF(event_name = 'page_view') as page_views,
        0 as active_clients
      FROM user_sessions
    `;

    const [rows] = await this.client.query({ query });
    return rows[0] || { total_users: 0, total_events: 0, page_views: 0, active_clients: 0 };
  }

  /**
   * Get user metrics (DAU, WAU, MAU, engagement)
   */
  async getUserMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getUserMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      dau: 0,
      wau: 0,
      mau: 0,
      engagement_rate: 0,
      avg_session_duration: 0,
    };
  }

  /**
   * Get feature metrics (usage, adoption)
   */
  async getFeatureMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getFeatureMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      features: [],
      adoption_rate: 0,
    };
  }

  /**
   * Get client metrics
   */
  async getClientMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getClientMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      clients: [],
      active_count: 0,
    };
  }

  /**
   * Get traffic metrics (source, medium)
   */
  async getTrafficMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getTrafficMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      sources: [],
      mediums: [],
    };
  }

  /**
   * Get technology metrics (device, browser, OS)
   */
  async getTechnologyMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getTechnologyMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      devices: [],
      browsers: [],
      operating_systems: [],
    };
  }

  /**
   * Get geography metrics (country, region, city)
   */
  async getGeographyMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getGeographyMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      countries: [],
      regions: [],
      cities: [],
    };
  }

  /**
   * Get event metrics
   */
  async getEventMetrics(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getEventMetrics - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      events: [],
      total_events: 0,
    };
  }

  /**
   * Get insights and alerts
   */
  async getInsights(
    property: string,
    days: number,
    userType: UserType
  ): Promise<unknown> {
    // TODO: Implement actual query from frontend queries.ts
    console.log(`[BigQuery] getInsights - property: ${property}, days: ${days}, userType: ${userType}`);
    return {
      alerts: [],
      recommendations: [],
    };
  }
}
