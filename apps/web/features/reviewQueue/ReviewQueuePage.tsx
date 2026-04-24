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
        subtitle="Evidence submitted and waiting for your review."
        right={
          <Link
            href="/evidence"
            className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go to evidence
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error ? <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div> : null}

        {loading ? (
          <div className="text-sm text-gray-600 dark:text-gray-300">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">Nothing to review</div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              When evidence is submitted, it’ll show up here for approval.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {controlsById.get(i.controlId) || i.controlId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{i.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{i.reference || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => void approve(i.id)}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void reject(i.id)}
                          className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Reject
                        </button>
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

