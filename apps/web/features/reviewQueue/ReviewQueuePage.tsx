'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AppLayout, DataTable, EmptyState, LoadingSpinner, MetricCard, PageHeader, StatusBadge } from '@/components/shared';
import { useCurrentUser } from '@/hooks';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';

type QueueEvidence = {
  id: string;
  controlId: string;
  source: string;
  status: 'SUBMITTED';
  reference?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Control = { id: string; name: string };

function unpack<T>(payload?: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const { canApprove } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<QueueEvidence[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  const controlsById = useMemo(() => new Map(controls.map((control) => [control.id, control.name])), [controls]);

  const load = async () => {
    if (redirectToLoginIfNoSession(router)) return;
    setLoading(true);
    setError('');

    const [queueResult, controlsResult] = await Promise.all([
      api.get<QueueEvidence[] | { data: QueueEvidence[] }>('/api/evidence/review/queue'),
      api.get<Control[] | { data: Control[] }>('/api/governance/controls'),
    ]);

    if (!queueResult.success) setError(queueResult.error || 'Failed to load queue');
    setItems(queueResult.success ? unpack(queueResult.data) : []);
    setControls(controlsResult.success ? unpack(controlsResult.data) : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateEvidence = async (id: string, status: 'APPROVED' | 'MISSING') => {
    setActionId(id);
    setError('');
    const result = await api.patch(`/api/evidence/${id}`, { status });
    if (!result.success) {
      setError(result.error || 'Failed to update evidence');
      setActionId(null);
      return;
    }
    setActionId(null);
    await load();
  };

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
        title="Review Queue"
        subtitle="Submitted evidence waiting for management or admin review."
        right={
          <Link
            href="/evidence"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            Go to evidence
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Waiting review" value={items.length} hint="Submitted evidence" />
          <MetricCard title="Controls affected" value={new Set(items.map((item) => item.controlId)).size} hint="Distinct controls" />
          <MetricCard title="Review role" value={canApprove ? 'Enabled' : 'Read only'} hint="Based on RBAC" />
          <MetricCard title="Queue source" value="Evidence" hint="Control proof" />
        </section>

        <DataTable
          rows={items}
          columns={[
            {
              key: 'control',
              header: 'Control',
              render: (item) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {controlsById.get(item.controlId) || item.controlId}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.controlId}</div>
                </div>
              ),
            },
            { key: 'source', header: 'Source', render: (item) => item.source },
            { key: 'status', header: 'Status', render: (item) => <StatusBadge value={item.status} /> },
            { key: 'reference', header: 'Reference', render: (item) => item.reference || '-' },
            { key: 'updated', header: 'Updated', render: (item) => new Date(item.updatedAt).toLocaleString() },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (item) =>
                canApprove ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void updateEvidence(item.id, 'APPROVED')}
                      disabled={actionId === item.id}
                      className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateEvidence(item.id, 'MISSING')}
                      disabled={actionId === item.id}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Read only</span>
                ),
            },
          ]}
          empty={<EmptyState title="Nothing to review" message="Submitted evidence will appear here for approval." />}
        />
      </div>
    </AppLayout>
  );
}
