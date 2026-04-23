'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { clearAuth } from '@/lib/auth';
import { api } from '@/lib/api';

type CompanyOption = {
  companyId: string;
  companyName: string;
  companyEmail: string;
  role: string;
};

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    // Special handling for governance sub-pages
    if (path === '/governance') {
      return pathname === '/governance' || 
             pathname === '/policies' || 
             pathname === '/controls' || 
             pathname === '/procedures' || 
             pathname === '/regulations';
    }
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { api } = await import('@/lib/api');
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens anyway
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

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Systems', href: '/systems', icon: 'S' },
    { name: 'Assess', href: '/assess', icon: 'A' },
    { name: 'Timeline', href: '/timeline', icon: 'T' },
    {
      name: 'Governance',
      href: '/governance',
      icon: '⚖️',
      children: [
        { name: 'Policies', href: '/policies' },
        { name: 'Controls', href: '/controls' },
        { name: 'Procedures', href: '/procedures' },
        { name: 'Regulations', href: '/regulations' },
      ],
    },
    { name: 'Risks', href: '/risks', icon: '⚠️' },
    { name: 'Evidence', href: '/evidence', icon: '📋' },
    { name: 'Incidents', href: '/incidents', icon: '🚨' },
    { name: 'Audit Logs', href: '/audit', icon: '📝' },
    { name: 'Activity', href: '/activity', icon: '🔄' },
    { name: 'Compliance', href: '/compliance', icon: '✅' },
    { name: 'Reports', href: '/reports', icon: '📊' },
    { name: 'Evidentia', href: '/integrations/evidentia', icon: '🧾' },
    { name: 'Webhooks', href: '/webhooks', icon: '🔗' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">SAI Platform</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigationItems.map((item) => {
              const active = isActive(item.href);
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.name}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {companies.length > 1 && (
              <select
                value={activeCompanyId}
                onChange={(e) => switchCompany(e.target.value)}
                disabled={switching}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white disabled:opacity-60"
              >
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            )}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {switchError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {switchError}
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
