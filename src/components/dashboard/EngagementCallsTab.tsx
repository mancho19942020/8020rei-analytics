'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton, AxisTag } from '@/components/axis';
import { TabHandle } from '@/types/widget';

// Types for engagement call documents
interface ClientInsight {
  clientName: string;
  participant?: string;
  date?: string;
  csName?: string;
  painPoints: string[];
  opportunities: string[];
}

interface EngagementDocument {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  folderName?: string;
  folderId?: string;
  preview?: string;
  clientNames?: string[];
  driveUrl?: string;
}

interface DocumentContent {
  id: string;
  name: string;
  html: string;
  text: string;
  createdTime: string;
  modifiedTime: string;
  folderName?: string;
  clients?: ClientInsight[];
  driveUrl?: string;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Extract title from document name (remove extension and clean up)
function extractTitle(name: string): string {
  return name
    .replace(/\.(docx?|pdf)$/i, '')
    .replace(/^\d+\s*/, '')
    .trim();
}

// External link icon used in Drive buttons
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// Card component showing client names instead of text preview
function DocumentCard({
  document,
  onClick,
}: {
  document: EngagementDocument;
  onClick: () => void;
}) {
  const clientNames = document.clientNames || [];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-raised rounded-2xl p-6
                 shadow-xs hover:shadow-md border border-stroke
                 transition-all duration-300 group flex flex-col min-h-[280px]"
    >
      {/* Folder badge */}
      {document.folderName && document.folderName !== 'Root' && (
        <div className="mb-4">
          <AxisTag color="neutral" size="sm" variant="outlined">
            {document.folderName}
          </AxisTag>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-content-primary mb-3 line-clamp-2 leading-snug">
        {extractTitle(document.name)}
      </h3>

      {/* Client names as tags */}
      <div className="flex-grow">
        {clientNames.length > 0 ? (
          <>
            <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">
              Clients analyzed
            </p>
            <div className="flex flex-wrap gap-1.5">
              {clientNames.map((name) => (
                <AxisTag key={name} color="info" size="sm">
                  {name}
                </AxisTag>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-content-tertiary italic">
            No client insights parsed yet
          </p>
        )}
      </div>

      {/* Footer - Date and hover indicator */}
      <div className="mt-4 pt-4 border-t border-stroke flex items-center justify-between">
        <span className="text-xs text-content-tertiary">
          {formatDate(document.modifiedTime)}
        </span>
        <span className="text-xs font-medium text-main-600 dark:text-main-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Read
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
}

// Upload card component (dashed border style)
function UploadCard({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <button
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      disabled={isUploading}
      className={`w-full rounded-2xl p-6 min-h-[280px] flex flex-col items-center justify-center
                 border-2 border-dashed transition-all duration-300
                 ${isDragging
                   ? 'border-main-500 bg-main-50 dark:bg-main-900/20'
                   : 'border-stroke hover:border-main-400 dark:hover:border-main-500'
                 }
                 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                 group`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {isUploading ? (
        <>
          <div className="w-12 h-12 rounded-full border-2 border-main-500 border-t-transparent animate-spin mb-4" />
          <span className="text-base font-medium text-content-secondary">
            Uploading...
          </span>
        </>
      ) : (
        <>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors
                         ${isDragging
                           ? 'bg-main-100 dark:bg-main-800'
                           : 'light-gray-bg group-hover:bg-main-100 dark:group-hover:bg-main-800'
                         }`}>
            <svg
              className={`w-7 h-7 transition-colors
                        ${isDragging
                          ? 'text-main-600 dark:text-main-400'
                          : 'text-content-tertiary group-hover:text-main-600 dark:group-hover:text-main-400'
                        }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>

          <span className={`text-base font-medium transition-colors
                          ${isDragging
                            ? 'text-main-600 dark:text-main-400'
                            : 'text-content-secondary group-hover:text-main-600 dark:group-hover:text-main-400'
                          }`}>
            {isDragging ? 'Drop file here' : 'Create New Doc'}
          </span>
          <span className="text-xs text-content-tertiary mt-2">
            Drop a .docx file or click to upload
          </span>
        </>
      )}
    </button>
  );
}

// Drive link button component
function DriveButton({ driveUrl }: { driveUrl: string }) {
  return (
    <a
      href={driveUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      <AxisButton variant="outlined" size="sm" iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}>
        View full document in Drive
      </AxisButton>
    </a>
  );
}

// Client insight section component
function ClientSection({ client }: { client: ClientInsight }) {
  const hasMeta = client.participant || client.date || client.csName;

  return (
    <div className="bg-surface-raised rounded-xl border border-stroke p-5">
      {/* Client name header */}
      <h3 className="text-base font-semibold text-content-primary mb-1">
        {client.clientName}
      </h3>

      {/* Metadata row */}
      {hasMeta && (
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-content-tertiary">
          {client.date && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {client.date}
            </span>
          )}
          {client.participant && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              {client.participant}
            </span>
          )}
          {client.csName && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              CS: {client.csName}
            </span>
          )}
        </div>
      )}
      {!hasMeta && <div className="mb-3" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pain Points */}
        {client.painPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-error-500)' }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-error-700 dark:text-error-300">
                Pain Points
              </span>
            </div>
            <ul className="space-y-1.5">
              {client.painPoints.map((point, idx) => (
                <li key={idx} className="text-sm text-content-secondary leading-relaxed flex gap-2">
                  <span className="text-content-tertiary mt-1 shrink-0">&bull;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {client.opportunities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-500)' }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-success-700 dark:text-success-300">
                Opportunities
              </span>
            </div>
            <ul className="space-y-1.5">
              {client.opportunities.map((opp, idx) => (
                <li key={idx} className="text-sm text-content-secondary leading-relaxed flex gap-2">
                  <span className="text-content-tertiary mt-1 shrink-0">&bull;</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Insights summary reader (replaces Notion-style document reader)
function InsightsReader({
  document,
  onBack,
}: {
  document: DocumentContent;
  onBack: () => void;
}) {
  const clients = document.clients || [];
  const driveUrl = document.driveUrl;

  return (
    <div className="min-h-full">
      {/* Back button */}
      <div className="mb-8">
        <AxisButton
          onClick={onBack}
          variant="ghost"
          size="sm"
          iconLeft={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          }
        >
          Back to all calls
        </AxisButton>
      </div>

      {/* Content area */}
      <div className="max-w-[820px] mx-auto px-4">
        {/* Document header */}
        <header className="mb-8 pb-6 border-b border-stroke">
          {/* Folder badge */}
          {document.folderName && (
            <div className="mb-4">
              <AxisTag color="neutral" variant="outlined">
                {document.folderName}
              </AxisTag>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-content-primary mb-4 leading-tight">
            {extractTitle(document.name)}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-content-secondary mb-4">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(document.modifiedTime)}</span>
            </div>
            {clients.length > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span>{clients.length} client{clients.length !== 1 ? 's' : ''} analyzed</span>
              </div>
            )}
          </div>

          {/* Drive link - top */}
          {driveUrl && <DriveButton driveUrl={driveUrl} />}
        </header>

        {/* Client insights */}
        {clients.length > 0 ? (
          <div className="space-y-4">
            {clients.map((client, idx) => (
              <ClientSection key={idx} client={client} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-content-secondary mb-4">
              No structured insights could be parsed from this document.
            </p>
            {driveUrl && (
              <p className="text-sm text-content-tertiary">
                Open the full document in Drive to review the content.
              </p>
            )}
          </div>
        )}

        {/* Drive link - bottom */}
        {driveUrl && clients.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stroke">
            <DriveButton driveUrl={driveUrl} />
          </div>
        )}
      </div>
    </div>
  );
}

// Loading skeleton for cards
function CardsSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <AxisSkeleton variant="custom" width="200px" height="22px" rounded="md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Upload card placeholder */}
        <div
          className="border-2 border-dashed border-stroke rounded-2xl"
          style={{ minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <AxisSkeleton variant="custom" width="56px" height="56px" rounded="full" />
          <AxisSkeleton variant="custom" width="120px" height="14px" rounded="md" />
          <AxisSkeleton variant="custom" width="180px" height="12px" rounded="md" />
        </div>

        {/* Document card skeletons — badge + title + client tags + footer */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface-raised border border-stroke rounded-2xl p-6" style={{ minHeight: 280, display: 'flex', flexDirection: 'column' }}>
            {/* Folder badge */}
            <div className="mb-4">
              <AxisSkeleton variant="custom" width="64px" height="20px" rounded="md" />
            </div>

            {/* Title — 2 lines */}
            <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AxisSkeleton variant="custom" width="100%" height="20px" rounded="md" />
              <AxisSkeleton variant="custom" width="72%" height="20px" rounded="md" />
            </div>

            {/* Client tag label */}
            <div className="mb-2">
              <AxisSkeleton variant="custom" width="100px" height="12px" rounded="md" />
            </div>

            {/* Client tag pills */}
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['80px', '100px', '70px'].map((w, j) => (
                <AxisSkeleton key={j} variant="custom" width={w} height="24px" rounded="full" />
              ))}
            </div>

            {/* Footer — date */}
            <div className="mt-4 pt-4 border-t border-stroke">
              <AxisSkeleton variant="custom" width="110px" height="12px" rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading skeleton for insights reader
function ReaderSkeleton() {
  return (
    <div className="max-w-[820px] mx-auto">
      <div className="mb-6"><AxisSkeleton variant="custom" width="120px" height="20px" rounded="md" /></div>
      <div className="mb-4"><AxisSkeleton variant="custom" width="80px" height="24px" rounded="md" /></div>
      <div className="mb-4"><AxisSkeleton variant="custom" width="100%" height="36px" rounded="md" /></div>
      <div className="mb-6"><AxisSkeleton variant="custom" width="200px" height="16px" rounded="md" /></div>
      <div className="mb-8"><AxisSkeleton variant="custom" width="180px" height="32px" rounded="md" /></div>

      {/* Client section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-raised border border-stroke rounded-xl p-5 mb-4">
          <div className="mb-4"><AxisSkeleton variant="custom" width="140px" height="18px" rounded="md" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <AxisSkeleton variant="custom" width="80px" height="12px" rounded="md" />
              <AxisSkeleton variant="custom" width="100%" height="14px" rounded="md" />
              <AxisSkeleton variant="custom" width="90%" height="14px" rounded="md" />
            </div>
            <div className="space-y-2">
              <AxisSkeleton variant="custom" width="90px" height="12px" rounded="md" />
              <AxisSkeleton variant="custom" width="100%" height="14px" rounded="md" />
              <AxisSkeleton variant="custom" width="85%" height="14px" rounded="md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main component
export const EngagementCallsTab = forwardRef<TabHandle>(function EngagementCallsTab(_, ref) {
  useImperativeHandle(ref, () => ({
    resetLayout: () => {},
    openWidgetCatalog: () => {},
  }), []);
  const [documents, setDocuments] = useState<EngagementDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function fetchDocuments(refresh = false) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ includePreview: 'true' });
      if (refresh) params.set('refresh', 'true');
      const res = await fetch(`/api/engagement-calls?${params}`);
      const json = await res.json();

      if (json.success) {
        setDocuments(json.data.documents);
      } else {
        setError(json.error || 'Failed to fetch documents');
      }
    } catch {
      setError('Failed to connect to API');
    }

    setLoading(false);
  }

  async function fetchDocument(id: string) {
    setLoadingDocument(true);

    try {
      const res = await fetch(`/api/engagement-calls/${id}`);
      const json = await res.json();

      if (json.success) {
        setSelectedDocument(json.data);
      } else {
        setError(json.error || 'Failed to fetch document');
      }
    } catch {
      setError('Failed to connect to API');
    }

    setLoadingDocument(false);
  }

  useEffect(() => {
    void fetchDocuments();
  }, []);

  function handleCardClick(document: EngagementDocument) {
    fetchDocument(document.id);
  }

  function handleBack() {
    setSelectedDocument(null);
  }

  async function handleUpload(file: File) {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/engagement-calls/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        setUploadSuccess(`"${json.data.fileName}" uploaded successfully`);
        await fetchDocuments();
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setUploadError(json.error || 'Upload failed');
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch {
      setUploadError('Failed to upload file');
      setTimeout(() => setUploadError(null), 5000);
    }

    setIsUploading(false);
  }

  // Loading state
  if (loading) {
    return <CardsSkeleton />;
  }

  // Error state
  if (error && !selectedDocument) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md w-full">
          <AxisCallout type="error" title="Failed to load documents">
            <p className="mb-4">{error}</p>
            <AxisButton onClick={() => fetchDocuments()} variant="filled">
              Retry
            </AxisButton>
          </AxisCallout>
        </div>
      </div>
    );
  }

  // Insights reader view
  if (selectedDocument) {
    return <InsightsReader document={selectedDocument} onBack={handleBack} />;
  }

  // Loading document view
  if (loadingDocument) {
    return <ReaderSkeleton />;
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-raised border border-stroke mb-4">
            <svg className="w-8 h-8 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-2">No documents found</h3>
          <p className="text-sm text-content-secondary max-w-sm">
            No engagement call documents were found in the connected Google Drive folder.
          </p>
        </div>
      </div>
    );
  }

  // Cards view
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-content-primary" style={{ margin: 0 }}>
          Engagement call reports
        </h2>
        <AxisButton
          onClick={() => fetchDocuments(true)}
          disabled={loading}
          variant="outlined"
          size="sm"
          iconLeft={
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
            </svg>
          }
        >
          Refresh
        </AxisButton>
      </div>

      {/* Upload feedback messages */}
      {uploadSuccess && (
        <div className="mb-6">
          <AxisCallout type="success">{uploadSuccess}</AxisCallout>
        </div>
      )}
      {uploadError && (
        <div className="mb-6">
          <AxisCallout type="error">{uploadError}</AxisCallout>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Upload card - first position */}
        <UploadCard onUpload={handleUpload} isUploading={isUploading} />

        {/* Document cards */}
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onClick={() => handleCardClick(doc)}
          />
        ))}
      </div>
    </div>
  );
});
