/**
 * Grafana Contributors — shared data types
 *
 * Stored in Firestore collection: grafana_contributors
 * Document ID = Firebase Auth uid
 */

export interface GrafanaDashboard {
  id: string;          // crypto.randomUUID()
  name: string;
  url: string;
  description?: string;
}

export interface GrafanaContributor {
  id: string;          // Firebase uid (also the Firestore doc ID)
  name: string;
  email: string;
  title: string;
  dashboards: GrafanaDashboard[];
  createdAt?: unknown;  // Firestore Timestamp (server-side)
  updatedAt?: unknown;  // Firestore Timestamp (server-side)
}
