/**
 * SuggestionsModal Component
 *
 * Modal form for submitting platform suggestions/feedback.
 * Sends the suggestion to the product owner via email.
 *
 * USAGE:
 * <SuggestionsModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   user={user}
 * />
 */

'use client';

import { useState } from 'react';
import { AxisModal } from '@/components/axis/AxisModal';
import { AxisButton } from '@/components/axis/AxisButton';
import { AxisInput } from '@/components/axis/AxisInput';
import { AxisSelect } from '@/components/axis/AxisSelect';
import { AxisCallout } from '@/components/axis/AxisCallout';
import type { User } from 'firebase/auth';

const CATEGORY_OPTIONS = [
  { value: 'Feature Request', label: 'Feature Request' },
  { value: 'Bug Report', label: 'Bug Report' },
  { value: 'UI/UX Feedback', label: 'UI/UX Feedback' },
  { value: 'General Suggestion', label: 'General Suggestion' },
];

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function SuggestionsModal({ isOpen, onClose, user }: SuggestionsModalProps) {
  const [category, setCategory] = useState('Feature Request');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCategory('Feature Request');
    setSubject('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate
    if (!subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please enter a description (at least 10 characters).');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          userEmail: user?.email || 'unknown',
          userName: user?.displayName || user?.email?.split('@')[0] || 'Unknown User',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send suggestion. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  // Success state
  if (success) {
    return (
      <AxisModal open={isOpen} onClose={handleClose} title="Suggestion Sent" size="sm">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-body-large font-semibold text-content-primary mb-1">Thank you!</p>
            <p className="text-body-regular text-content-secondary">
              Your suggestion has been sent. We appreciate your feedback.
            </p>
          </div>
          <AxisButton variant="filled" size="md" onClick={handleClose}>
            Close
          </AxisButton>
        </div>
      </AxisModal>
    );
  }

  return (
    <AxisModal
      open={isOpen}
      onClose={handleClose}
      title="Submit a Suggestion"
      size="md"
      footer={
        <>
          <AxisButton variant="outlined" size="md" onClick={handleClose} disabled={sending}>
            Cancel
          </AxisButton>
          <AxisButton variant="filled" size="md" onClick={handleSubmit} disabled={sending}>
            {sending ? 'Sending...' : 'Send Suggestion'}
          </AxisButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && (
          <AxisCallout type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </AxisCallout>
        )}

        <p className="text-body-regular text-content-secondary">
          Share your ideas, report issues, or suggest improvements for Metrics Hub. Your feedback helps us build a better platform.
        </p>

        <AxisSelect
          label="Category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(val) => setCategory(val)}
          required
        />

        <AxisInput
          label="Subject"
          placeholder="Brief summary of your suggestion"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        {/* Textarea — no Axis primitive exists, styled to match AxisInput */}
        <div className="w-full">
          <label className="block text-label mb-1.5 text-content-primary font-medium">
            Description<span className="text-error-500 ml-0.5">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your suggestion in detail..."
            rows={5}
            className="w-full px-4 py-3 text-body-regular bg-surface-base border border-stroke rounded-sm font-sans transition-colors duration-150 focus:outline-none focus:border-main-500 focus:ring-2 focus:ring-main-200 dark:focus:ring-main-900 hover:border-stroke-strong text-content-primary resize-vertical"
          />
          <p className="text-label mt-1.5 text-content-secondary">
            Minimum 10 characters
          </p>
        </div>

        <div className="flex items-center gap-2 text-label text-content-tertiary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          <span>Your suggestion will be sent to the product team via email</span>
        </div>
      </div>
    </AxisModal>
  );
}
