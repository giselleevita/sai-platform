'use client';

import { useEffect, useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { syncCsrfFromCookieToStorage } from '@/lib/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    syncCsrfFromCookieToStorage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex min-h-screen">
        <SidebarNav
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
              >
                Menu
              </button>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">SAI Platform</div>
              <div className="w-[64px]" />
            </div>
          </div>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
