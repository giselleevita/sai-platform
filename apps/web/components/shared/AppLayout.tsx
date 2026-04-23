'use client';

import { useEffect } from 'react';
import { Navigation } from './Navigation';
import { syncCsrfFromCookieToStorage } from '@/lib/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useEffect(() => {
    syncCsrfFromCookieToStorage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
