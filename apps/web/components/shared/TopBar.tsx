'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type CurrentUser = {
  name?: string;
  email?: string;
  role?: string;
  company?: {
    name?: string;
  };
};

export function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    void api.get<CurrentUser>('/api/auth/me').then((res) => {
      if (mounted && res.success) setUser(res.data || null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
        >
          Menu
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="search"
            placeholder="Search controls, risks, evidence, incidents..."
            className="h-9 w-full max-w-xl rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </div>

        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <div className="min-w-0 text-right">
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {user?.company?.name || 'SAI Platform'}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || 'No active user'}</div>
          </div>
          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {(user?.role || 'UNKNOWN').replaceAll('_', ' ')}
          </span>
        </div>
      </div>
    </header>
  );
}
