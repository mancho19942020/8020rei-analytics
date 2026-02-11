/**
 * API Types
 *
 * Standardized API request and response types.
 * Used by both frontend (fetching) and backend (responding).
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
  timestamp?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error response
 */
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

/**
 * Common metrics query parameters
 */
export interface MetricsQueryParams {
  days?: number;
  userType?: 'all' | 'internal' | 'external';
  property?: string;
}

/**
 * Analytics-specific query parameters
 */
export interface AnalyticsQueryParams extends MetricsQueryParams {
  property?: '8020rei' | '8020roofing';
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// DATA SOURCE TYPES
// ============================================================================

/**
 * Data source identifier
 */
export type DataSource =
  | 'bigquery-ga4'
  | 'salesforce'
  | 'aws-aurora'
  | 'aws-athena'
  | 'skiptrace-batch-elites'
  | 'skiptrace-direct-skip'
  | 'back-office'
  | 'slack'
  | 'ml-models';

/**
 * Data source status
 */
export interface DataSourceStatus {
  source: DataSource;
  status: 'connected' | 'disconnected' | 'not_configured' | 'error';
  lastChecked?: string;
  latency?: number;
  error?: string;
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: DataSourceStatus[];
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Cache configuration per source
 */
export interface CacheConfig {
  source: DataSource;
  ttlSeconds: number;
  enabled: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  type: 'redis' | 'memory';
  entries: number;
  hitRate?: number;
  memoryUsage?: number;
}
