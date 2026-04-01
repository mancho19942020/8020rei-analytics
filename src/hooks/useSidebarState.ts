'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Auto-collapse on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setCollapsed(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    };
    mq.addEventListener('change', handler);
    if (mq.matches) {
      setCollapsed(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { collapsed, toggle, setCollapsed };
}
