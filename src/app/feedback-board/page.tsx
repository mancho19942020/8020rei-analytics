/**
 * /feedback-board — admin inbox for the in-app feedback tool.
 *
 * Real-time, gated to canAccessFeedbackBoard (Germán + Juliana by default).
 * Non-admins see an access-denied callout. Anonymous users get redirected
 * to /login by the AuthProvider gate (same as the rest of the dashboard).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/AuthContext';
import { canAccessFeedbackBoard } from '@/lib/access';
import { AxisCallout } from '@/components/axis/AxisCallout';
import { AxisButton } from '@/components/axis/AxisButton';
import { AxisSkeleton } from '@/components/axis/AxisSkeleton';
import { AdminFeedbackBoard } from './AdminFeedbackBoard';

export default function FeedbackBoardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // While auth is resolving, render skeleton chrome.
  // If signed-out (user === null after loading), the AuthProvider in layout
  // already prompts re-auth. We additionally redirect to /login for clarity.
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <AxisSkeleton variant="custom" width="100%" height="48px" />
          <AxisSkeleton variant="custom" width="100%" height="120px" />
          <AxisSkeleton variant="custom" width="100%" height="120px" />
          <AxisSkeleton variant="custom" width="100%" height="120px" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!canAccessFeedbackBoard(user.email)) {
    return (
      <div className="min-h-screen bg-surface-base p-8">
        <div className="max-w-2xl mx-auto">
          <AxisCallout type="error" title="Access denied">
            <p className="mb-3">
              The Feedback Inbox is restricted to product owners. If you believe you should
              have access, ask Germán to add your email to{' '}
              <code className="text-label bg-surface-raised px-1.5 py-0.5 rounded">
                FEEDBACK_BOARD_AUTHORIZED_EMAILS
              </code>{' '}
              in <code className="text-label bg-surface-raised px-1.5 py-0.5 rounded">
                src/lib/access.ts
              </code>.
            </p>
            <AxisButton variant="outlined" size="sm" onClick={() => router.push('/')}>
              Back to dashboard
            </AxisButton>
          </AxisCallout>
        </div>
      </div>
    );
  }

  return <AdminFeedbackBoard currentUserEmail={user.email ?? ''} />;
}
