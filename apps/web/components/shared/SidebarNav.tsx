'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { clearAuth } from '@/lib/auth';
import { ThemeToggle } from './ThemeToggle';

type CompanyOption = {
  companyId: string;
  companyName: string;
  companyEmail: string;
  role: string;
};

type NavItem = {
  name: string;
  href: string;
  icon?: string;
};

type NavGroup = {
  name: string;
  items: NavItem[];
};

export function SidebarNav(props: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        name: 'Overview',
        items: [{ name: 'Overview', href: '/dashboard', icon: '◻︎' }],
      },
      {
        name: 'Risk & controls',
        items: [
          { name: 'Inventory', href: '/inventory', icon: '◻︎' },
          { name: 'Risks', href: '/risks', icon: '◻︎' },
          { name: 'Compliance', href: '/compliance', icon: '◻︎' },
        ],
      },
      {
        name: 'Integrations',
        items: [
          { name: 'Evidentia', href: '/integrations/evidentia', icon: '◻︎' },
          { name: 'Webhooks', href: '/webhooks', icon: '◻︎' },
        ],
      },
      {
        name: 'Settings',
        items: [{ name: 'Plan & usage', href: '/plan', icon: '◻︎' }],
      },
    ],
    [],
  );

  const handleLogout = async () => {
    try {
      const { api } = await import('@/lib/api');
      await api.post('/api/auth/logout', {});
    } catch {
      // ignore (we clear session anyway)
    } finally {
      clearAuth();
      router.push('/auth/login');
    }
  };

  useEffect(() => {
    const load = async () => {
      const res = await api.get<CompanyOption[]>('/api/auth/companies');
      if (res.success && Array.isArray(res.data)) {
        setCompanies(res.data);
      }
      const me = await api.get<{ companyId?: string }>('/api/auth/me');
      if (me.success && me.data?.companyId) setActiveCompanyId(me.data.companyId);
    };
    void load();
  }, []);

  const switchCompany = async (companyId: string) => {
    const prev = activeCompanyId;
    setSwitchError(null);
    setSwitching(true);
    setActiveCompanyId(companyId);
    const res = await api.post('/api/auth/switch-company', { companyId });
    if (!res.success) {
      setActiveCompanyId(prev);
      setSwitchError(res.error || 'Failed to switch company');
      setSwitching(false);
      return;
    }
    setSwitching(false);
    router.refresh();
  };

  const sidebarInner = (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 px-3 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            SAI
          </span>
          {!props.collapsed && (
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">SAI Platform</span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onToggleCollapsed}
            className="hidden md:inline-flex rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={props.collapsed ? 'Expand' : 'Collapse'}
          >
            {props.collapsed ? '»' : '«'}
          </button>
          <button
            type="button"
            onClick={props.onClose}
            className="md:hidden rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-3">
          {navGroups.map((g) => (
            <div key={g.name} className="space-y-1">
              {!props.collapsed && (
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {g.name}
                </div>
              )}
              {g.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => props.onClose()}
                    className={[
                      'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800',
                    ].join(' ')}
                  >
                    <span className="w-5 text-center text-xs text-gray-500 dark:text-gray-400">{item.icon}</span>
                    {!props.collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
        {switchError && !props.collapsed && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1">
            {switchError}
          </div>
        )}

        {companies.length > 1 && (
          <div className="space-y-1">
            {!props.collapsed && <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Company</div>}
            <select
              value={activeCompanyId}
              onChange={(e) => switchCompany(e.target.value)}
              disabled={switching}
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-2 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60"
              aria-label="Switch company"
            >
              {companies.map((c) => (
                <option key={c.companyId} value={c.companyId}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {props.collapsed ? '⎋' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {props.open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={props.onClose}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed z-50 h-full w-72 md:static md:z-auto md:h-auto md:w-auto',
          'transition-transform md:transition-none',
          props.open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div
          className={[
            'h-full md:h-[calc(100vh-0px)]',
            props.collapsed ? 'md:w-16' : 'md:w-72',
            'border-r border-gray-200 dark:border-gray-800',
          ].join(' ')}
        >
          {sidebarInner}
        </div>
      </aside>
    </>
  );
}

