'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { AxisSkeleton, AxisCallout, AxisButton } from '@/components/axis';
import { TabHandle } from '@/types/widget';

// Types for engagement call documents
interface EngagementDocument {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  folderName?: string;
  folderId?: string;
  preview?: string;
}

interface DocumentContent {
  id: string;
  name: string;
  html: string;
  text: string;
  createdTime: string;
  modifiedTime: string;
  folderName?: string;
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
    .replace(/^\d+\s*/, '') // Remove leading numbers
    .trim();
}

// Card component for document preview (Vertical design with better styling)
function DocumentCard({
  document,
  onClick,
}: {
  document: EngagementDocument;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface-raised rounded-2xl p-6
                 shadow-sm hover:shadow-lg border border-stroke
                 transition-all duration-300 group flex flex-col min-h-[280px]"
    >
      {/* Folder badge - Main blue color */}
      {document.folderName && document.folderName !== 'Root' && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide
                         bg-main-100 text-main-700
                         dark:bg-main-500/20 dark:text-main-300">
            {document.folderName}
          </span>
        </div>
      )}

      {/* Title - Bold and prominent */}
      <h3 className="text-lg font-bold text-content-primary mb-3 line-clamp-2 leading-snug">
        {extractTitle(document.name)}
      </h3>

      {/* Preview text - Takes up most of the card */}
      {document.preview && (
        <p className="text-sm text-content-secondary line-clamp-6 leading-relaxed flex-grow">
          {document.preview}
        </p>
      )}

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
      // Reset input so same file can be selected again
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
          {/* Uploading state */}
          <div className="w-12 h-12 rounded-full border-2 border-main-500 border-t-transparent animate-spin mb-4" />
          <span className="text-base font-medium text-content-secondary">
            Uploading...
          </span>
        </>
      ) : (
        <>
          {/* Plus icon */}
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

          {/* Text */}
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

// Document reader component (Notion-style)
function DocumentReader({
  document,
  onBack,
}: {
  document: DocumentContent;
  onBack: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-180px)]">
      {/* Back button - fixed at top */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all calls
        </button>
      </div>

      {/* Document content - centered with max-width (Notion-style) */}
      <div className="max-w-[720px] mx-auto px-4">
        {/* Document header */}
        <header className="mb-12 pb-8 border-b border-stroke">
          {/* Folder badge */}
          {document.folderName && (
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-main-100 text-main-700 dark:bg-main-900/30 dark:text-main-300">
                {document.folderName}
              </span>
            </div>
          )}

          {/* Title - Large like Notion */}
          <h1 className="text-4xl font-bold text-content-primary mb-6 leading-tight">
            {extractTitle(document.name)}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap gap-6 text-base text-content-secondary">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Modified: {formatDate(document.modifiedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Created: {formatDate(document.createdTime)}</span>
            </div>
          </div>
        </header>

        {/* Document content - Notion-style typography */}
        <article
          className="engagement-document-content"
          dangerouslySetInnerHTML={{ __html: document.html }}
        />
      </div>

      {/* Notion-style typography CSS */}
      <style jsx global>{`
        .engagement-document-content {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--color-content-secondary, #64748b);
        }

        /* Headings - Large with lots of space */
        .engagement-document-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-content-primary, #0f172a);
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          line-height: 1.3;
        }

        .engagement-document-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-content-primary, #0f172a);
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .engagement-document-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-content-primary, #0f172a);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        /* Paragraphs - Comfortable reading */
        .engagement-document-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }

        /* Strong/Bold text */
        .engagement-document-content strong {
          font-weight: 600;
          color: var(--color-content-primary, #0f172a);
        }

        /* Lists - Proper spacing */
        .engagement-document-content ul,
        .engagement-document-content ol {
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }

        .engagement-document-content li {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }

        .engagement-document-content li::marker {
          color: var(--color-content-tertiary, #94a3b8);
        }

        /* Nested lists */
        .engagement-document-content li > ul,
        .engagement-document-content li > ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        /* Links */
        .engagement-document-content a {
          color: var(--color-main-600, #2563eb);
          text-decoration: none;
        }

        .engagement-document-content a:hover {
          text-decoration: underline;
        }

        /* Blockquotes */
        .engagement-document-content blockquote {
          border-left: 3px solid var(--color-main-500, #3b82f6);
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: var(--color-content-secondary, #64748b);
        }

        /* Tables */
        .engagement-document-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 1rem;
        }

        .engagement-document-content th,
        .engagement-document-content td {
          padding: 0.75rem 1rem;
          border: 1px solid var(--color-stroke, #e2e8f0);
          text-align: left;
        }

        .engagement-document-content th {
          background: var(--color-surface-raised, #f8fafc);
          font-weight: 600;
          color: var(--color-content-primary, #0f172a);
        }

        /* Code */
        .engagement-document-content code {
          background: var(--color-surface-raised, #f1f5f9);
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }

        .engagement-document-content pre {
          background: var(--color-surface-raised, #f1f5f9);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        /* Horizontal rule */
        .engagement-document-content hr {
          border: none;
          border-top: 1px solid var(--color-stroke, #e2e8f0);
          margin: 2.5rem 0;
        }

        /* First element - no top margin */
        .engagement-document-content > *:first-child {
          margin-top: 0;
        }

        /* Dark mode adjustments */
        .dark .engagement-document-content {
          color: var(--color-content-secondary, #94a3b8);
        }

        .dark .engagement-document-content h1,
        .dark .engagement-document-content h2,
        .dark .engagement-document-content h3,
        .dark .engagement-document-content strong {
          color: var(--color-content-primary, #f1f5f9);
        }

        .dark .engagement-document-content a {
          color: var(--color-main-400, #60a5fa);
        }
      `}</style>
    </div>
  );
}

// Loading skeleton for cards — mirrors actual card grid layout faithfully
function CardsSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6">
        <AxisSkeleton variant="custom" width="200px" height="22px" rounded="md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Upload card placeholder — dashed outline */}
        <div
          className="border-2 border-dashed border-stroke rounded-2xl"
          style={{ minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <AxisSkeleton variant="custom" width="56px" height="56px" rounded="full" />
          <AxisSkeleton variant="custom" width="120px" height="14px" rounded="md" />
          <AxisSkeleton variant="custom" width="180px" height="12px" rounded="md" />
        </div>

        {/* Document card skeletons — 5 cards mimicking: badge + title (2 lines) + preview (6 lines) + footer */}
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

            {/* Preview text — 5 lines, last one shorter */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['100%', '100%', '95%', '100%', '60%'].map((w, j) => (
                <AxisSkeleton key={j} variant="custom" width={w} height="13px" rounded="md" />
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

// Loading skeleton for document reader
function ReaderSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6"><AxisSkeleton variant="custom" width="120px" height="20px" rounded="md" /></div>
      <div className="mb-4"><AxisSkeleton variant="custom" width="80px" height="24px" rounded="md" /></div>
      <div className="mb-4"><AxisSkeleton variant="custom" width="100%" height="40px" rounded="md" /></div>
      <div className="mb-8"><AxisSkeleton variant="custom" width="200px" height="20px" rounded="md" /></div>
      <div className="space-y-4">
        <AxisSkeleton variant="custom" width="100%" height="20px" rounded="md" />
        <AxisSkeleton variant="custom" width="100%" height="20px" rounded="md" />
        <AxisSkeleton variant="custom" width="80%" height="20px" rounded="md" />
        <AxisSkeleton variant="custom" width="100%" height="20px" rounded="md" />
        <AxisSkeleton variant="custom" width="90%" height="20px" rounded="md" />
      </div>
    </div>
  );
}

// Main component
export const EngagementCallsTab = forwardRef<TabHandle>(function EngagementCallsTab(_, ref) {
  useImperativeHandle(ref, () => ({
    resetLayout: () => {}, // no-op: this tab is a document viewer, not a widget grid
    openWidgetCatalog: () => {}, // no-op: no widget catalog for this tab
  }), []);
  const [documents, setDocuments] = useState<EngagementDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/engagement-calls?includePreview=true');
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

  // Fetch single document content
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

  // Fetch documents list on mount
  useEffect(() => {
    void fetchDocuments(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Handle card click
  function handleCardClick(document: EngagementDocument) {
    fetchDocument(document.id);
  }

  // Handle back button
  function handleBack() {
    setSelectedDocument(null);
  }

  // Handle file upload
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
        // Refresh the documents list to show the new document
        await fetchDocuments();
        // Clear success message after 5 seconds
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
            <AxisButton onClick={fetchDocuments} variant="filled">
              Retry
            </AxisButton>
          </AxisCallout>
        </div>
      </div>
    );
  }

  // Document reader view
  if (selectedDocument) {
    return <DocumentReader document={selectedDocument} onBack={handleBack} />;
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-content-primary" style={{ margin: 0 }}>
          Engagement call reports
        </h2>
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

      {/* Cards grid - 2 columns for taller cards */}
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
})
