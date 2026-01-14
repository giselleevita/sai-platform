'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts
export const commonShortcuts = (router: ReturnType<typeof useRouter>) => [
  {
    key: 'd',
    ctrl: true,
    action: () => router.push('/dashboard'),
    description: 'Go to Dashboard',
  },
  {
    key: 'i',
    ctrl: true,
    action: () => router.push('/inventory'),
    description: 'Go to Inventory',
  },
  {
    key: 'r',
    ctrl: true,
    action: () => router.push('/risks'),
    description: 'Go to Risks',
  },
  {
    key: 'a',
    ctrl: true,
    action: () => router.push('/activity'),
    description: 'Go to Activity',
  },
  {
    key: '/',
    ctrl: true,
    action: () => {
      // Focus search if available
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Focus Search',
  },
];
