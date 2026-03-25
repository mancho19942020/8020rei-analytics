/**
 * Builds a query string for date range parameters.
 * Uses startDate/endDate for custom ranges, falls back to days for presets.
 */
export function buildDateQueryString(days: number, startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    return `startDate=${startDate}&endDate=${endDate}`;
  }
  return `days=${days}`;
}
