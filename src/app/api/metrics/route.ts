import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/bigquery';
import { 
  getMetricsQuery, 
  getUsersByDayQuery, 
  getFeatureUsageQuery, 
  getTopClientsQuery 
} from '@/lib/queries';

interface Metrics {
  total_users: number;
  total_events: number;
  page_views: number;
  active_clients: number;
}

interface DailyData {
  event_date: string;
  users: number;
  events: number;
}

interface FeatureData {
  feature: string;
  views: number;
}

interface ClientData {
  client: string;
  events: number;
  users: number;
  page_views: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');
  
  try {
    const [metrics, usersByDay, featureUsage, topClients] = await Promise.all([
      runQuery<Metrics>(getMetricsQuery(days)),
      runQuery<DailyData>(getUsersByDayQuery(days)),
      runQuery<FeatureData>(getFeatureUsageQuery(days)),
      runQuery<ClientData>(getTopClientsQuery(days)),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        metrics: metrics[0],
        usersByDay,
        featureUsage,
        topClients,
      }
    });
    
  } catch (error) {
    console.error('BigQuery error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
