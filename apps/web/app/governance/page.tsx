'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout, DataTable, EmptyState, LoadingSpinner, MetricCard, PageHeader, StatusBadge } from '@/components/shared';

type RegistryItem = {
  id: string;
  name: string;
  type: 'Policy' | 'Control' | 'Procedure' | 'Regulation';
  status?: string;
  ownerId?: string;
  updatedAt?: string;
  href: string;
};

function asRows<T>(payload?: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function GovernancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const load = async () => {
      if (redirectToLoginIfNoSession(router)) return;
      setLoading(true);
      setError('');

      try {
        const [policies, controls, procedures, regulations] = await Promise.all([
          api.get<any[]>('/api/governance/policies'),
          api.get<any[]>('/api/governance/controls'),
          api.get<any[]>('/api/governance/procedures'),
          api.get<any[]>('/api/governance/regulations'),
        ]);

        const registry: RegistryItem[] = [
          ...asRows(policies.data).map((item) => ({ ...item, type: 'Policy' as const, href: '/policies' })),
          ...asRows(controls.data).map((item) => ({ ...item, type: 'Control' as const, href: '/controls' })),
          ...asRows(procedures.data).map((item) => ({ ...item, type: 'Procedure' as const, status: 'ACTIVE', href: '/procedures' })),
          ...asRows(regulations.data).map((item) => ({
            ...item,
            type: 'Regulation' as const,
            status: item.framework,
            href: '/regulations',
          })),
        ];

        const failed = [policies, controls, procedures, regulations].find((result) => !result.success);
        if (failed) setError(failed.error || 'Some registry data could not be loaded');
        setItems(registry);
      } catch (err: any) {
        setError(err?.message || 'Failed to load governance registry');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const filteredItems = useMemo(
    () => (typeFilter === 'All' ? items : items.filter((item) => item.type === typeFilter)),
    [items, typeFilter]
  );

  const counts = useMemo(
    () => ({
      policies: items.filter((item) => item.type === 'Policy').length,
      controls: items.filter((item) => item.type === 'Control').length,
      procedures: items.filter((item) => item.type === 'Procedure').length,
      regulations: items.filter((item) => item.type === 'Regulation').length,
    }),
    [items]
  );

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Governance Registry"
        subtitle="Policies, controls, procedures, and obligations in one management view."
        right={
          <Link
            href="/controls"
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950"
          >
            Manage controls
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Policies" value={counts.policies} hint="Governance intent" />
          <MetricCard title="Controls" value={counts.controls} hint="Enforced safeguards" />
          <MetricCard title="Procedures" value={counts.procedures} hint="Operating steps" />
          <MetricCard title="Regulations" value={counts.regulations} hint="Mapped obligations" />
        </section>

        <div className="flex flex-wrap gap-2">
          {['All', 'Policy', 'Control', 'Procedure', 'Regulation'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={[
                'rounded-md border px-3 py-2 text-sm font-semibold',
                typeFilter === type
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {type}
            </button>
          ))}
        </div>

        <DataTable
          rows={filteredItems}
          columns={[
            { key: 'type', header: 'Type', render: (row) => row.type },
            {
              key: 'name',
              header: 'Name',
              render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>,
            },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status || 'Tracked'} /> },
            { key: 'owner', header: 'Owner', render: (row) => row.ownerId || 'Unassigned' },
            {
              key: 'updated',
              header: 'Updated',
              render: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : 'Not set'),
            },
            {
              key: 'action',
              header: 'Action',
              align: 'right',
              render: (row) => (
                <Link href={row.href} className="font-semibold text-blue-600 hover:text-blue-700">
                  Open
                </Link>
              ),
            },
          ]}
          empty={
            <EmptyState
              title="No governance records"
              message="Create policies, controls, procedures, and regulations to move compliance from documentation to enforceable ownership."
              action={
                <Link href="/controls" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                  Create first control
                </Link>
              }
            />
          }
        />
      </div>
    </AppLayout>
  );
}
