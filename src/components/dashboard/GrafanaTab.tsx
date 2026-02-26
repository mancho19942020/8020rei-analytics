'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import {
  getFirestoreDb,
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from '@/lib/firebase/firestore';
import { AxisButton, AxisSkeleton, AxisCallout } from '@/components/axis';
import { TabHandle } from '@/types/widget';
import { GrafanaContributorCard } from './grafana/GrafanaContributorCard';
import { GrafanaDashboardCard } from './grafana/GrafanaDashboardCard';
import { GrafanaProfileModal } from './grafana/GrafanaProfileModal';
import type { GrafanaContributor, GrafanaDashboard } from './grafana/types';

const COLLECTION = 'grafana_contributors';

export const GrafanaTab = forwardRef<TabHandle>(function GrafanaTab(_, ref) {
  useImperativeHandle(ref, () => ({
    resetLayout: () => {},
    openWidgetCatalog: () => {},
  }), []);

  const { user } = useAuth();

  // Data state
  const [contributors, setContributors] = useState<GrafanaContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // View state: null = gallery, string = selected contributor id
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // -------------------------------------------------------------------
  // Fetch all contributors from Firestore
  // -------------------------------------------------------------------
  async function fetchContributors() {
    setLoading(true);
    setFetchError(null);
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data: GrafanaContributor[] = snapshot.docs.map(d => ({
        ...(d.data() as Omit<GrafanaContributor, 'id'>),
        id: d.id,
      }));
      setContributors(data);
    } catch (err) {
      console.error('[GrafanaTab] fetch error:', err);
      setFetchError('Could not load Grafana profiles. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContributors();
  }, []);

  // -------------------------------------------------------------------
  // Save (create or update) the current user's contributor profile
  // -------------------------------------------------------------------
  async function handleSave(data: {
    name: string;
    title: string;
    dashboards: GrafanaDashboard[];
  }) {
    if (!user) throw new Error('Not authenticated');
    const db = getFirestoreDb();
    const ref = doc(db, COLLECTION, user.uid);
    const isNew = !ownContributor;

    await setDoc(ref, {
      id: user.uid,
      email: user.email ?? '',
      name: data.name,
      title: data.title,
      dashboards: data.dashboards,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
    });

    // Optimistically update local state
    const updated: GrafanaContributor = {
      id: user.uid,
      email: user.email ?? '',
      name: data.name,
      title: data.title,
      dashboards: data.dashboards,
    };
    setContributors(prev => {
      const exists = prev.find(c => c.id === user.uid);
      if (exists) {
        return prev.map(c => (c.id === user.uid ? updated : c));
      }
      return [updated, ...prev];
    });
  }

  // -------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------
  const ownContributor = user ? contributors.find(c => c.id === user.uid) : undefined;
  const selectedContributor = selectedId ? contributors.find(c => c.id === selectedId) : null;

  // -------------------------------------------------------------------
  // RENDER: Loading skeletons
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <AxisSkeleton variant="text" size="lg" width="200px" />
          <AxisSkeleton variant="button" size="md" width="180px" />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {[1, 2, 3, 4].map(i => (
            <AxisSkeleton key={i} variant="card" size="lg" />
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // RENDER: Profile detail view
  // -------------------------------------------------------------------
  if (selectedContributor) {
    return (
      <div>
        {/* Back + header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <AxisButton
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(null)}
            iconLeft={
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            }
          >
            Back
          </AxisButton>

          <div style={{ flex: 1 }}>
            <h2 className="text-2xl font-bold text-content-primary" style={{ margin: 0 }}>
              {selectedContributor.name}
            </h2>
            <p className="text-sm text-content-secondary" style={{ margin: 0 }}>
              {selectedContributor.title}
            </p>
          </div>

          {user?.uid === selectedContributor.id && (
            <AxisButton
              variant="outlined"
              size="sm"
              onClick={() => setModalOpen(true)}
              iconLeft={
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              }
            >
              Edit Profile
            </AxisButton>
          )}
        </div>

        {/* Dashboard grid */}
        {selectedContributor.dashboards.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
              gap: 12,
            }}
          >
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
              className="text-content-tertiary"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            <p className="text-body-regular text-content-secondary">No dashboards added yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {selectedContributor.dashboards.map(dashboard => (
              <GrafanaDashboardCard key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
        )}

        {/* Edit modal (available from detail view too) */}
        <GrafanaProfileModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          existing={ownContributor}
          defaultName={user?.displayName ?? user?.email ?? ''}
          defaultEmail={user?.email ?? ''}
          onSave={handleSave}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------
  // RENDER: Gallery view (default)
  // -------------------------------------------------------------------
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 className="text-2xl font-bold text-content-primary mb-2">
              Grafana Dashboards
            </h2>
            <p className="text-base text-content-secondary">
              Team-linked Grafana boards — click a profile to explore dashboards.
            </p>
          </div>

          <AxisButton
            variant={ownContributor ? 'outlined' : 'filled'}
            size="md"
            onClick={() => setModalOpen(true)}
            iconLeft={
              ownContributor ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )
            }
          >
            {ownContributor ? 'Edit Your Profile' : 'Add Your Dashboards'}
          </AxisButton>
        </div>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="mb-6">
          <AxisCallout type="error">{fetchError}</AxisCallout>
        </div>
      )}

      {/* Empty state */}
      {!fetchError && contributors.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 320,
            gap: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-surface-raised border border-stroke"
          >
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-content-tertiary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <div>
            <p className="text-body-large font-semibold text-content-primary" style={{ marginBottom: 6 }}>
              No Grafana profiles yet
            </p>
            <p className="text-body-regular text-content-secondary">
              Be the first to add your dashboards.
            </p>
          </div>
          <AxisButton variant="filled" size="md" onClick={() => setModalOpen(true)}>
            Add Your Dashboards
          </AxisButton>
        </div>
      )}

      {/* Contributor grid */}
      {contributors.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {contributors.map(contributor => (
            <GrafanaContributorCard
              key={contributor.id}
              contributor={contributor}
              isOwnCard={user?.uid === contributor.id}
              onView={() => setSelectedId(contributor.id)}
              onEdit={() => setModalOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <GrafanaProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existing={ownContributor}
        defaultName={user?.displayName ?? user?.email ?? ''}
        defaultEmail={user?.email ?? ''}
        onSave={handleSave}
      />
    </div>
  );
});
