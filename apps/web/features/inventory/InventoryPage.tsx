'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import { hasAuthSession } from '@/lib/auth';
import type { Tool } from '@/types';
import {
  AppLayout,
  DataTable,
  EmptyState,
  LoadingSpinner,
  MetricTile,
  PageHeader,
  PermissionGate,
  StatusBadge,
  type DataTableColumn,
} from '@/components/shared';
import { useCurrentUser } from '@/hooks';

type InventoryResponse = {
  data?: Tool[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export default function InventoryPage() {
  const router = useRouter();
  const { canCreate } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filterRisk, setFilterRisk] = useState('All');
  const [sortBy, setSortBy] = useState('riskScore');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const loadTools = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      if (!hasAuthSession()) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery.trim() && { q: searchQuery.trim() }),
        ...(sortBy && { sortBy }),
        ...(filterRisk !== 'All' && { riskLevel: filterRisk }),
      });

      const result = await api.get<InventoryResponse | Tool[]>(`/api/inventory?${params}`);
      if (!result.success) throw new Error(result.error || 'Failed to load tools');

      const payload = result.data;
      setTools(api.unwrapRows<Tool>(payload));
      setPagination(!Array.isArray(payload) && payload?.pagination ? payload.pagination : DEFAULT_PAGINATION);
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTools(1);
  }, [router, searchQuery, sortBy, filterRisk]);

  const metrics = useMemo(() => {
    const critical = tools.filter((tool) => tool.riskLevel === 'Critical').length;
    const high = tools.filter((tool) => tool.riskLevel === 'High').length;
    const missingDpa = tools.filter((tool) => !tool.hasDPA).length;
    const averageRisk = tools.length
      ? Math.round(tools.reduce((sum, tool) => sum + (tool.riskScore || 0), 0) / tools.length)
      : 0;
    return { critical, high, missingDpa, averageRisk };
  }, [tools]);

  const hasActiveFilters = searchQuery.trim().length > 0 || filterRisk !== 'All';

  const columns: DataTableColumn<Tool>[] = [
    {
      key: 'tool',
      header: 'Tool',
      render: (tool) => (
        <div>
          <Link href={`/inventory/${tool.id}`} className="font-semibold text-gray-900 hover:text-blue-700 dark:text-gray-100">
            {tool.name}
          </Link>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {[tool.vendor, tool.category].filter(Boolean).join(' • ') || 'Uncategorized'}
          </div>
        </div>
      ),
    },
    {
      key: 'risk',
      header: 'Risk',
      render: (tool) => (
        <div className="space-y-1">
          <StatusBadge value={tool.riskLevel} />
          <div className="text-xs text-gray-500 dark:text-gray-400">{tool.riskScore}/100</div>
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (tool) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{tool.users} users</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{tool.frequency}</div>
        </div>
      ),
    },
    {
      key: 'data',
      header: 'Data',
      render: (tool) => (
        <div className="flex max-w-sm flex-wrap gap-1">
          {tool.dataTypes.slice(0, 4).map((type) => (
            <StatusBadge key={type} value={type} tone="neutral" />
          ))}
          {tool.dataTypes.length > 4 ? <StatusBadge value={`+${tool.dataTypes.length - 4}`} tone="neutral" /> : null}
        </div>
      ),
    },
    {
      key: 'controls',
      header: 'Controls',
      render: (tool) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{tool.controls.length} mapped</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{tool.hasDPA ? 'DPA signed' : 'DPA missing'}</div>
        </div>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (tool) => new Date(tool.updatedAt).toLocaleDateString(),
    },
  ];

  if (loading && tools.length === 0) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Inventory"
        subtitle="AI systems, vendors, data exposure, controls, and risk posture."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/inventory/import"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              Import
            </Link>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const result = await api.download(
                  '/api/import-export/tools/excel',
                  `tools-export-${new Date().toISOString().split('T')[0]}.xlsx`,
                );
                if (!result.success) setError(result.error || 'Failed to export Excel');
                setLoading(false);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              Export Excel
            </button>
            <PermissionGate allowed={canCreate}>
              <Link
                href="/inventory/add"
                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900"
              >
                Add tool
              </Link>
            </PermissionGate>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => void loadTools(pagination.page)} className="font-semibold underline">
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile title="Tools Tracked" value={pagination.total || tools.length} hint="Current tenant inventory" />
          <MetricTile title="Critical / High" value={metrics.critical + metrics.high} hint={`${metrics.critical} critical, ${metrics.high} high`} />
          <MetricTile title="Missing DPA" value={metrics.missingDpa} hint="Requires vendor follow-up" />
          <MetricTile title="Average Risk" value={metrics.averageRisk} hint="Visible page average" />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_220px_auto]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tools, vendors, descriptions..."
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <select
              value={filterRisk}
              onChange={(event) => setFilterRisk(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((risk) => (
                <option key={risk}>{risk}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="riskScore">Risk score</option>
              <option value="name">Name</option>
              <option value="users">Users</option>
              <option value="createdAt">Created date</option>
            </select>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterRisk('All');
                  setSortBy('riskScore');
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={tools}
          empty={
            <EmptyState
              title={hasActiveFilters ? 'No tools match the current filters' : 'No tools in inventory yet'}
              message={
                hasActiveFilters
                  ? 'Adjust search or risk filters to broaden the inventory view.'
                  : 'Add or import AI tools to begin tracking risk, controls, and audit evidence.'
              }
              action={
                canCreate && !hasActiveFilters ? (
                  <Link href="/inventory/add" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                    Add first tool
                  </Link>
                ) : null
              }
            />
          }
        />

        {pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => void loadTools(pagination.page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="rounded-md border border-gray-300 px-3 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => void loadTools(pagination.page + 1)}
              disabled={!pagination.hasNext || loading}
              className="rounded-md border border-gray-300 px-3 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
