'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout, DataTable, EmptyState, LoadingSpinner, MetricCard, PageHeader, StatusBadge } from '@/components/shared';
import { useCurrentUser } from '@/hooks';
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
  const { canApprove } = useCurrentUser();

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

  const captureSnapshot = async () => {
    setError('');
    setLoading(true);
    const res = await api.post('/api/governance/compliance-snapshots', {});
    if (!res.success) setError(res.error || 'Failed to capture snapshot');
    const next = await api.get<ApiComplianceSnapshot[]>('/api/governance/compliance-snapshots');
    if (next.success) setRows(Array.isArray(next.data) ? next.data : []);
    setLoading(false);
  };

  const exportAuditPackage = async () => {
    setError('');
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

  const downloadManifest = async () => {
    setError('');
    const res = await api.get<any>('/api/governance/export-manifest?limit=500');
    if (!res.success) {
      setError(res.error || 'Failed to download manifest');
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
  };

  const downloadAuditorZip = async () => {
    setError('');
    const res = await fetch('/api/reports/auditor-zip?includeAttachments=1&maxAttachmentBytes=20000000', {
      credentials: 'include',
    });
    if (!res.ok) {
      setError('Failed to download auditor ZIP');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditor-zip-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Compliance"
        subtitle="Snapshots + exports for audit-ready posture."
        right={
          <>
            <Link
              href="/review-queue"
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              My review queue
            </Link>
            <button
              type="button"
              onClick={() => void captureSnapshot()}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              disabled={loading || !canApprove}
              title={canApprove ? 'Capture snapshot' : 'Management or Admin required'}
            >
              Capture snapshot
            </button>
            <button
              type="button"
              onClick={() => void downloadManifest()}
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Download manifest
            </button>
            <button
              type="button"
              onClick={() => void exportAuditPackage()}
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Export audit package
            </button>
            <button
              type="button"
              onClick={() => void downloadAuditorZip()}
              className="rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Download auditor ZIP
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {error ? (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>
        ) : null}

        {loading ? <LoadingSpinner /> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Policies" value={latest?.summary?.policies ?? '—'} />
          <MetricCard title="Controls" value={latest?.summary?.controls ?? '—'} />
          <MetricCard title="Risks" value={latest?.summary?.risks ?? '—'} />
          <MetricCard title="Evidence total" value={latest?.summary?.evidenceTotal ?? '—'} />
          <MetricCard title="Last snapshot" value={latest ? new Date(latest.createdAt).toLocaleString() : '—'} />
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Evidence coverage</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(evidenceByStatus).map(([status, count]) => (
              <MetricCard key={status} title={status} value={count} />
            ))}
          </div>
          {Object.keys(evidenceByStatus).length === 0 ? (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">No evidence status breakdown yet.</div>
          ) : null}
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Snapshots</h2>
            <Link href="/evidence" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Go to evidence →
            </Link>
          </div>
          <div className="mt-3">
            <DataTable
              rows={rows}
              columns={[
                { key: 'created', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() },
                { key: 'evidence', header: 'Evidence', render: (row) => row.summary?.evidenceTotal ?? '-' },
                { key: 'risks', header: 'Risks', render: (row) => row.summary?.risks ?? '-' },
                { key: 'controls', header: 'Controls', render: (row) => row.summary?.controls ?? '-' },
                {
                  key: 'coverage',
                  header: 'Evidence Status',
                  render: (row) => (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(row.summary?.evidenceByStatus || {}).map(([status, count]) => (
                        <StatusBadge key={status} value={`${status}: ${count}`} />
                      ))}
                    </div>
                  ),
                },
              ]}
              empty={<EmptyState title="No snapshots yet" message="Capture a snapshot to create a point-in-time audit trail." />}
            />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
