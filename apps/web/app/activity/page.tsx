'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppLayout, DataTable, EmptyState, LoadingSpinner, MetricCard, PageHeader, StatusBadge } from '@/components/shared';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';

type ActivityItem = {
  id: string;
  type: 'tool' | 'risk' | 'incident' | 'policy' | 'control' | 'evidence';
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'approved' | 'rejected';
  targetId: string;
  targetName: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
};

function unpack<T>(payload?: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

export default function ActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const loadActivities = async () => {
    if (redirectToLoginIfNoSession(router)) return;
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (filter !== 'all') params.append('type', filter);

    const result = await api.get<ActivityItem[] | { data: ActivityItem[] }>(`/api/activity?${params}`);
    if (result.success) {
      setActivities(unpack(result.data));
    } else {
      setError(result.error || 'Failed to load activity feed');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadActivities();
  }, [filter]);

  const metrics = useMemo(
    () => ({
      total: activities.length,
      approvals: activities.filter((item) => item.action === 'approved').length,
      rejections: activities.filter((item) => item.action === 'rejected').length,
      changes: activities.filter((item) => item.action === 'created' || item.action === 'updated').length,
    }),
    [activities]
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
      <PageHeader title="Activity" subtitle="Recent changes across governance, risk, evidence, and incidents." />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Events" value={metrics.total} hint="Current filtered view" />
          <MetricCard title="Approvals" value={metrics.approvals} hint="Approved actions" />
          <MetricCard title="Rejections" value={metrics.rejections} hint="Rejected actions" />
          <MetricCard title="Changes" value={metrics.changes} hint="Created or updated" />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap gap-2">
            {['all', 'tool', 'risk', 'incident', 'policy', 'control', 'evidence'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={[
                  'rounded-md border px-3 py-2 text-sm font-semibold',
                  filter === type
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <DataTable
          rows={activities}
          columns={[
            { key: 'type', header: 'Type', render: (item) => <StatusBadge value={item.type} tone="info" /> },
            { key: 'action', header: 'Action', render: (item) => <StatusBadge value={item.action} /> },
            {
              key: 'target',
              header: 'Target',
              render: (item) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.targetName}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.targetId}</div>
                </div>
              ),
            },
            {
              key: 'actor',
              header: 'Actor',
              render: (item) => (
                <div>
                  <div className="font-medium">{item.actor.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.actor.email}</div>
                </div>
              ),
            },
            { key: 'time', header: 'Time', render: (item) => formatTime(item.timestamp) },
          ]}
          empty={<EmptyState title="No activity" message="Governance actions will appear here as the team works." />}
        />
      </div>
    </AppLayout>
  );
}
