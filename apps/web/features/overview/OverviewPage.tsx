'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import type { Tool, RiskSummary } from '@/types';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { hasAuthSession, syncCsrfFromCookieToStorage } from '@/lib/auth';
import { LoadingSpinner, MetricCard, PageHeader } from '@/components/shared';

export default function OverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [showTourCta, setShowTourCta] = useState(false);

  useKeyboardShortcuts(commonShortcuts(router));

  /** After SSO, confirm session and strip `?oidc=1` from the URL bar. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('oidc') !== '1') return;

    syncCsrfFromCookieToStorage();

    void (async () => {
      const me = await api.get('/api/auth/me');
      if (!me.success) {
        router.push('/auth/login');
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('oidc');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    })();
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!hasAuthSession()) {
          router.push('/auth/login');
          return;
        }

        syncCsrfFromCookieToStorage();

        try {
          const onboardingCompleted = localStorage.getItem('onboarding_completed');
          setShowTourCta(!onboardingCompleted);
        } catch {
          // ignore
        }

        const toolsResult = await api.get<{ data: Tool[]; pagination: any }>('/api/inventory?limit=10');
        if (!toolsResult.success) {
          if (toolsResult.error?.includes('401') || toolsResult.error?.includes('unauthorized')) {
            router.push('/auth/login');
            return;
          }
          throw new Error(toolsResult.error || 'Failed to load tools. Please check your connection.');
        }
        // API returns either a flat array or a paginated envelope; support both.
        const toolsPayload: any = toolsResult.data;
        setTools(Array.isArray(toolsPayload) ? toolsPayload : (toolsPayload?.data ?? []));

        const summaryResult = await api.get<RiskSummary>('/api/inventory/summary');
        if (summaryResult.success) {
          setSummary(summaryResult.data || null);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [router, reloadKey]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const attentionTools = useMemo(() => {
    const ranked = [...tools].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    return ranked.filter((t) => t.riskLevel === 'Critical' || t.riskLevel === 'High').slice(0, 5);
  }, [tools]);

  const exportAuditPackage = async () => {
    const res = await api.get<any>('/api/reports/audit-package');
    if (!res.success) {
      setError(res.error || 'Failed to export audit package');
      return;
    }
    const payload = JSON.stringify(res.data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-package-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Executive posture across inventory, risk, and compliance."
        right={
          <>
            {showTourCta ? (
              <Link
                href="/onboarding"
                className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Take tour
              </Link>
            ) : null}
            <Link
              href="/inventory/add"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add tool
            </Link>
            <button
              type="button"
              onClick={() => void exportAuditPackage()}
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Export audit package
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-center justify-between gap-3">
            <span className="min-w-0">{error}</span>
            <button
              type="button"
              onClick={() => {
                setError('');
                setReloadKey((key) => key + 1);
              }}
              className="shrink-0 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Total tools" value={summary?.totalTools ?? '—'} />
          <MetricCard title="Critical" value={summary?.riskCounts?.critical ?? '—'} />
          <MetricCard title="High" value={summary?.riskCounts?.high ?? '—'} />
          <MetricCard title="Medium" value={summary?.riskCounts?.medium ?? '—'} />
          <MetricCard title="Avg risk score" value={summary?.averageRiskScore ?? '—'} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Needs attention</h2>
              <Link href="/risks" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Open risk register
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {attentionTools.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  No critical/high tools in the current top list.
                </div>
              ) : (
                attentionTools.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t.category} · score {t.riskScore}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={['px-2 py-1 text-xs font-semibold rounded-full', getRiskColor(t.riskLevel)].join(' ')}>
                        {t.riskLevel}
                      </span>
                      <Link href={`/inventory/${t.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Quick paths</h2>
            <div className="grid gap-2">
              <Link
                href="/inventory"
                className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Inventory
              </Link>
              <Link
                href="/compliance"
                className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Compliance snapshots
              </Link>
              <Link
                href="/review-queue"
                className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                My review queue
              </Link>
              <Link
                href="/integrations/evidentia"
                className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Integrations
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="px-4 py-4 sm:px-6 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Top tools (sample)</h2>
            <Link href="/inventory" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Open inventory →
            </Link>
          </div>

          {tools.length === 0 ? (
            <div className="px-4 py-12 sm:px-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No tools yet</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Add your first tool to unlock risk scoring, inventory tracking, and reporting.
              </p>
              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/inventory/add"
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Add your first tool
                </Link>
                <Link
                  href="/risks"
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Open risk register
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Types</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {tools.map((tool) => (
                    <tr key={tool.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tool.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tool.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tool.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(tool.riskLevel)}`}>
                          {tool.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tool.riskScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tool.dataTypes.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/inventory/${tool.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

