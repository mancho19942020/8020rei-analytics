'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@/lib/firebase/AuthContext';
import {
  getFirestoreDb,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
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
  // Delete the current user's contributor profile
  // -------------------------------------------------------------------
  async function handleDelete() {
    if (!user) throw new Error('Not authenticated');
    const db = getFirestoreDb();
    const ref = doc(db, COLLECTION, user.uid);
    await deleteDoc(ref);
    setContributors(prev => prev.filter(c => c.id !== user.uid));
    setSelectedId(null);
    setModalOpen(false);
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
        {/* Header skeleton — mirrors actual header layout */}
        <div className="mb-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <AxisSkeleton variant="custom" width="168px" height="22px" rounded="md" />
            <AxisSkeleton variant="custom" width="148px" height="30px" rounded="md" />
          </div>
        </div>

        {/* Row skeletons — mirror actual contributor card layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="bg-surface-raised border border-stroke"
              style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}
            >
              {/* Avatar circle */}
              <AxisSkeleton variant="custom" width="36px" height="36px" rounded="full" />

              {/* Name + title stacked */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AxisSkeleton variant="custom" width="130px" height="13px" rounded="md" />
                <AxisSkeleton variant="custom" width="86px" height="11px" rounded="md" />
              </div>

              {/* Tag block */}
              <AxisSkeleton variant="custom" width="96px" height="22px" rounded="full" />

              {/* Button block */}
              <AxisSkeleton variant="custom" width="120px" height="30px" rounded="md" />
            </div>
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
        {/* Back button — standalone row */}
        <div style={{ marginBottom: 20 }}>
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
        </div>

        {/* Profile header block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 className="text-xl font-semibold text-content-primary" style={{ margin: '0 0 4px 0' }}>
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
              Edit dashboards
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
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
              className="text-content-tertiary"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            <p className="text-sm text-content-secondary">No dashboards added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          onDelete={ownContributor ? handleDelete : undefined}
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
      <div className="mb-6">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <h2 className="text-xl font-semibold text-content-primary" style={{ margin: 0 }}>
            Grafana dashboards
          </h2>

          <AxisButton
            variant={ownContributor ? 'outlined' : 'filled'}
            size="sm"
            onClick={() => setModalOpen(true)}
            iconLeft={
              ownContributor ? (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              ) : (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )
            }
          >
            {ownContributor ? 'Edit your dashboards' : 'Add your dashboards'}
          </AxisButton>
        </div>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="mb-4">
          <AxisCallout type="error">{fetchError}</AxisCallout>
        </div>
      )}

      {/* Empty state */}
      {!fetchError && contributors.length === 0 && (
        <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-raised border border-stroke mb-4">
              <svg className="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-content-primary mb-2">No Grafana profiles yet</h3>
            <p className="text-sm text-content-secondary" style={{ marginBottom: 20 }}>
              Be the first to add your dashboards.
            </p>
            <AxisButton variant="filled" size="sm" onClick={() => setModalOpen(true)}>
              Add your dashboards
            </AxisButton>
          </div>
        </div>
      )}

      {/* Contributor list */}
      {contributors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contributors.map(contributor => (
            <GrafanaContributorCard
              key={contributor.id}
              contributor={contributor}
              onView={() => setSelectedId(contributor.id)}
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
