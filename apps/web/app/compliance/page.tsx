'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout, MetricCard, PageHeader } from '@/components/shared';
import { api } from '@/lib/api';

type ApiComplianceSnapshot = {
  id: string;
  createdAt: string;
  summary: {
    generatedAt: string;
    policies: number;
    controls: number;
    risks: number;
    evidenceTotal: number;
    evidenceByStatus: Record<string, number>;
  };
};

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<ApiComplianceSnapshot[]>([]);

  const latest = useMemo(() => rows[0] ?? null, [rows]);
  const evidenceByStatus = useMemo(() => latest?.summary?.evidenceByStatus || {}, [latest]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      const res = await api.get<ApiComplianceSnapshot[]>('/api/governance/compliance-snapshots');
      if (!res.success) {
        setError(res.error || 'Failed to load snapshots');
        setRows([]);
      } else {
        setRows(Array.isArray(res.data) ? res.data : []);
      }
      setLoading(false);
    };
    void run();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        title="Compliance"
        subtitle="Immutable snapshots of governance posture for auditors and regulators."
        right={
          <>
            <Link
              href="/integrations/evidentia"
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Capture snapshot
            </Link>
            <button
              type="button"
              onClick={async () => {
                const res = await api.get<any>('/api/governance/export-manifest?limit=1000');
                if (!res.success) {
                  setError(res.error || 'Failed to export manifest');
                  return;
                }
                const payload = JSON.stringify(res.data, null, 2);
                const blob = new Blob([payload], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `governance-manifest-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Download manifest
            </button>
            <button
              type="button"
              onClick={async () => {
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
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Export audit package
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Need reviews done? Visit your queue.
          </div>
          <Link
            href="/review-queue"
            className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            My review queue →
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Latest snapshot" value={latest ? new Date(latest.createdAt).toLocaleString() : '—'} />
          <MetricCard title="Policies" value={latest?.summary.policies ?? '—'} />
          <MetricCard title="Controls" value={latest?.summary.controls ?? '—'} />
          <MetricCard title="Risks" value={latest?.summary.risks ?? '—'} />
          <MetricCard title="Evidence total" value={latest?.summary.evidenceTotal ?? '—'} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Evidence by status</h2>
            <Link href="/evidence" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Open evidence →
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-2">
            {loading ? (
              <p className="text-sm text-gray-700 dark:text-gray-200">Loading…</p>
            ) : latest ? (
              Object.entries(evidenceByStatus).length === 0 ? (
                <p className="text-sm text-gray-700 dark:text-gray-200">No evidence recorded.</p>
              ) : (
                Object.entries(evidenceByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-medium">{status}</span>
                    <span className="text-gray-600 dark:text-gray-400">{count}</span>
                  </div>
                ))
              )
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-200">
                No snapshots yet. Capture one from the Evidentia integration.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Snapshot history</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-2">
            {loading ? (
              <p className="text-sm text-gray-700 dark:text-gray-200">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-gray-700 dark:text-gray-200">No snapshots captured yet.</p>
            ) : (
              rows.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{new Date(s.createdAt).toLocaleString()}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {s.summary.evidenceTotal} evidence · {s.summary.controls} controls
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Snapshots are immutable and exportable. Latest timestamp: {latest ? new Date(latest.createdAt).toLocaleString() : '—'}.
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
