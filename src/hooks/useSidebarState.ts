'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  // Track if initial mount has happened
  const mounted = useRef(false);

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Auto-collapse on small screens
  useEffect(() => {
    mounted.current = true;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setCollapsed(() => {
          localStorage.setItem(STORAGE_KEY, 'true');
          return true;
        });
      }
    };
    mq.addEventListener('change', handler);
    if (mq.matches && !collapsed) {
      setCollapsed(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
        return true;
      });
    }
    return () => mq.removeEventListener('change', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { collapsed, toggle, setCollapsed };
}
