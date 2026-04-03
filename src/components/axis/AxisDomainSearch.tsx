/**
 * AxisDomainSearch Component
 *
 * Search input with typeahead suggestions for filtering by domain.
 * Uses AxisInput (type="search") for the input and a dropdown list
 * for suggestions. Follows Axis design system tokens and patterns.
 *
 * USAGE:
 * <AxisDomainSearch
 *   domains={['domain_a', 'domain_b']}
 *   selectedDomain={selectedDomain}
 *   onDomainChange={setSelectedDomain}
 * />
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { AxisInput } from './AxisInput';

export interface AxisDomainSearchProps {
  /** List of available domains */
  domains: string[];
  /** Currently selected domain (empty string = all domains) */
  selectedDomain: string;
  /** Callback when domain selection changes */
  onDomainChange: (domain: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Loading state while domains are being fetched */
  loading?: boolean;
}

/** Clean up raw domain string into a readable label */
function formatDomain(domain: string): string {
  return domain
    .replace(/_8020rei_com$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function AxisDomainSearch({
  domains,
  selectedDomain,
  onDomainChange,
  placeholder = 'Filter by client domain...',
  loading = false,
}: AxisDomainSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // When a domain is selected externally, show its formatted name
  useEffect(() => {
    if (selectedDomain) {
      setQuery(formatDomain(selectedDomain));
    }
  }, [selectedDomain]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter domains based on query
  const suggestions = useMemo(() => {
    if (!query.trim()) return domains.slice(0, 10); // Show first 10 when empty
    const q = query.toLowerCase().replace(/\s+/g, '');
    return domains
      .filter(d => {
        const clean = d.replace(/_8020rei_com$/i, '').replace(/_/g, '');
        return clean.toLowerCase().includes(q) || d.toLowerCase().includes(q);
      })
      .slice(0, 15);
  }, [query, domains]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    // If user clears the input, reset the filter
    if (!val.trim()) {
      onDomainChange('');
    }
  };

  const handleSelect = (domain: string) => {
    setQuery(formatDomain(domain));
    onDomainChange(domain);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onDomainChange('');
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Select all text on focus for easy re-searching
    if (selectedDomain) {
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative" style={{ width: 280 }}>
      <AxisInput
        type="search"
        size="sm"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={loading ? 'Loading domains...' : placeholder}
        disabled={loading}
        fullWidth
        autoComplete="off"
        title=""
        name="domain-filter-search"
      />

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-overlay)',
            border: '1px solid var(--border-default)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {/* "All domains" option */}
          {selectedDomain && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-left px-3 py-2 text-label transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.backgroundColor = 'var(--surface-raised)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              Show all domains
            </button>
          )}

          {suggestions.map(domain => {
            const isSelected = domain === selectedDomain;
            return (
              <button
                key={domain}
                type="button"
                onClick={() => handleSelect(domain)}
                className="w-full text-left px-3 py-2 text-label transition-colors"
                style={{
                  color: isSelected ? 'var(--color-main-500)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.backgroundColor = 'var(--surface-raised)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {formatDomain(domain)}
                <span className="text-label ml-1" style={{ color: 'var(--text-tertiary)' }}>
                  {domain.replace(/_8020rei_com$/i, '')}
                </span>
              </button>
            );
          })}

          {suggestions.length === 0 && query.trim() && (
            <div className="px-3 py-3 text-label text-center" style={{ color: 'var(--text-tertiary)' }}>
              No domains match &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
