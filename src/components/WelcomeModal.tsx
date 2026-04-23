'use client';

import { useState, useEffect, useRef } from 'react';
import { AxisModal } from '@/components/axis/AxisModal';
import { AxisButton } from '@/components/axis/AxisButton';
import { AxisTag } from '@/components/axis/AxisTag';
import { SIDEBAR_ICONS } from '@/lib/sidebarIcons';

// ─── Feature flag ────────────────────────────────────────
// Set to true to enable the welcome modal for all users.
// When false, the modal never renders regardless of seen-state.
export const WELCOME_MODAL_ENABLED = true;

// ─── Storage key (bump version to re-show after major updates) ───
const STORAGE_KEY = 'welcome-modal-seen-v1';

// ─── Feature cards content ───────────────────────────────
interface FeatureCard {
  icon: keyof typeof SIDEBAR_ICONS;
  title: string;
  description: string;
  tag: string;
  tagColor: 'success' | 'info' | 'alert' | 'neutral';
}

const FEATURES: FeatureCard[] = [
  {
    icon: 'analytics',
    title: 'Analytics',
    description: 'GA4 data for 8020REI — users, engagement, technology, geography, events, and AI-powered insights.',
    tag: 'Live',
    tagColor: 'success',
  },
  {
    icon: 'features',
    title: 'Features',
    description: 'DM Campaign health (operational + business results), Properties API performance, and more coming soon.',
    tag: 'Live',
    tagColor: 'success',
  },
  {
    icon: 'feedback-loop',
    title: 'Feedback loop',
    description: 'Import and review user feedback from multiple channels in one central place.',
    tag: 'Live',
    tagColor: 'success',
  },
  {
    icon: 'engagement-calls',
    title: 'Engagement calls',
    description: 'Log, track, and review client engagement calls with file attachments via Google Drive.',
    tag: 'Live',
    tagColor: 'success',
  },
  {
    icon: 'product-tasks',
    title: 'Product tasks',
    description: 'AI task board and Bugs & DI board — powered by Asana, surfaced right here.',
    tag: 'New',
    tagColor: 'info',
  },
  {
    icon: 'grafana',
    title: 'Grafana',
    description: 'Embedded Grafana dashboards for infrastructure and real-time monitoring.',
    tag: 'Beta',
    tagColor: 'alert',
  },
];

// ─── Component ───────────────────────────────────────────

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  // Capture ?welcome=true synchronously before the router replaces the URL
  const isPreviewRef = useRef(
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('welcome') === 'true'
  );

  useEffect(() => {
    if (isPreviewRef.current) {
      setOpen(true);
      return;
    }
    if (!WELCOME_MODAL_ENABLED) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== 'true') {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Don't mark as seen when previewing — so real users still get it
    if (!isPreviewRef.current) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  if (!WELCOME_MODAL_ENABLED && !isPreviewRef.current) return null;

  return (
    <AxisModal
      open={open}
      onClose={handleClose}
      title="Welcome to Metrics Hub"
      size="lg"
      footer={
        <AxisButton variant="filled" size="lg" onClick={handleClose}>
          Get started
        </AxisButton>
      }
    >
      {/* Intro text */}
      <p
        className="text-body-large text-content-secondary"
        style={{ margin: '0 0 8px', lineHeight: 1.6 }}
      >
        All your data sources in one place. Here is what you have access to:
      </p>

      {/* Feature cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginTop: 16,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-surface-raised border border-stroke rounded-xl transition-all duration-200 hover:border-main-500 dark:hover:border-main-400"
            style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}
          >
            {/* Icon circle */}
            <div
              className="bg-main-50 dark:bg-main-950 text-main-500 dark:text-main-400"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {SIDEBAR_ICONS[f.icon]}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="text-label font-semibold text-content-primary">{f.title}</span>
                <AxisTag color={f.tagColor} size="sm">{f.tag}</AxisTag>
              </div>
              <p
                className="text-body-regular text-content-secondary"
                style={{ margin: 0, lineHeight: 1.5 }}
              >
                {f.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon note */}
      <p
        className="text-body-regular text-content-tertiary"
        style={{ margin: '16px 0 0', textAlign: 'center' }}
      >
        More sections — Customer Success, QA, Pipelines, ML Models — are on the way.
      </p>
    </AxisModal>
  );
}
