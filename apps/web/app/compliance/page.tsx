'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/shared';
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Snapshot</h1>
          <p className="text-gray-600">Immutable, time-based snapshot of AI governance status.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-100">{error}</div>
        )}

        {/* Snapshot metrics */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { title: 'Policies', value: latest?.summary.policies ?? '—' },
            { title: 'Controls', value: latest?.summary.controls ?? '—' },
            { title: 'Risks', value: latest?.summary.risks ?? '—' },
            { title: 'Evidence total', value: latest?.summary.evidenceTotal ?? '—' },
          ].map((card) => (
            <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-700">{card.title}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{card.value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Evidence by status</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            {loading ? (
              <p className="text-sm text-gray-700">Loading…</p>
            ) : latest ? (
              Object.entries(latest.summary.evidenceByStatus || {}).length === 0 ? (
                <p className="text-sm text-gray-700">No evidence recorded.</p>
              ) : (
                Object.entries(latest.summary.evidenceByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm text-gray-800">
                    <span>{status}</span>
                    <span className="text-gray-600">{count}</span>
                  </div>
                ))
              )
            ) : (
              <p className="text-sm text-gray-700">No snapshots yet. Capture one from the Evidentia integration page.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Snapshot history</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2">
            {loading ? (
              <p className="text-sm text-gray-700">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-gray-700">No snapshots captured yet.</p>
            ) : (
              rows.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm text-gray-800">
                  <span className="font-medium">{new Date(s.createdAt).toLocaleString()}</span>
                  <span className="text-gray-600">
                    {s.summary.evidenceTotal} evidence · {s.summary.controls} controls
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Export note */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-700">
            Snapshots are immutable, time-based, and exportable for auditors. Timestamp:{' '}
            {latest ? new Date(latest.createdAt).toLocaleString() : '—'}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
