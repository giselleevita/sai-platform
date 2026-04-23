'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout, PageHeader } from '@/components/shared';

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

export default function ReviewQueuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<QueueEvidence[]>([]);
  const [controls, setControls] = useState<Control[]>([]);

  const controlsById = useMemo(() => new Map(controls.map((c) => [c.id, c.name])), [controls]);

  const load = async () => {
    setLoading(true);
    setError('');
    if (redirectToLoginIfNoSession(router)) return;

    const [q, cs] = await Promise.all([
      api.get<QueueEvidence[]>('/api/evidence/review/queue'),
      api.get<Control[]>('/api/governance/controls'),
    ]);
    if (!q.success) setError(q.error || 'Failed to load queue');
    setItems(q.success && Array.isArray(q.data) ? q.data : []);
    setControls(cs.success && Array.isArray(cs.data) ? cs.data : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    const res = await api.patch(`/api/evidence/${id}`, { status: 'APPROVED' });
    if (!res.success) {
      setError(res.error || 'Failed to approve');
      return;
    }
    await load();
  };

  const reject = async (id: string) => {
    const res = await api.patch(`/api/evidence/${id}`, { status: 'MISSING' });
    if (!res.success) {
      setError(res.error || 'Failed to reject');
      return;
    }
    await load();
  };

  return (
    <AppLayout>
      <PageHeader
        title="My review queue"
        subtitle="Evidence submitted to you for review."
        right={
          <Link
            href="/evidence"
            className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Open evidence →
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="text-sm text-gray-700 dark:text-gray-200">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="text-sm text-gray-700 dark:text-gray-200">No items in your queue.</div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Control
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-950/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {controlsById.get(i.controlId) || i.controlId}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Updated {new Date(i.updatedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{i.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                      {i.reference || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void approve(i.id)}
                          className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void reject(i.id)}
                          className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Reject
                        </button>
                        <Link
                          href="/evidence"
                          className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

