'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout, ErrorAlert, LoadingSpinner, PageHeader } from '@/components/shared';
import { api } from '@/lib/api';

type Vendor = {
  id: string;
  name: string;
  region?: string | null;
  securityReviewStatus?: string | null;
  subprocessors?: unknown;
  createdAt?: string;
};

const REVIEW_STATUSES = ['Not started', 'In review', 'Approved', 'Rejected'] as const;

const STATUS_STYLES: Record<string, string> = {
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  'In review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  'Not started': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const EMPTY = { name: '', region: '', securityReviewStatus: 'Not started' };

export default function VendorsPage() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await api.get<Vendor[]>('/api/vendors');
    if (!res.success) {
      setError(res.error || 'Failed to load vendors');
      setRows([]);
    } else {
      setRows(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const unreviewed = useMemo(
    () =>
      rows.filter(
        (row) => !row.securityReviewStatus || row.securityReviewStatus === 'Not started',
      ).length,
    [rows],
  );

  const create = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Vendor name is required');
      return;
    }
    setSaving(true);
    const res = await api.post<Vendor>('/api/vendors', {
      name: form.name.trim(),
      ...(form.region.trim() ? { region: form.region.trim() } : {}),
      securityReviewStatus: form.securityReviewStatus,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error || 'Failed to add the vendor');
      return;
    }
    setForm(EMPTY);
    setShowForm(false);
    await load();
  };

  const setStatus = async (vendor: Vendor, securityReviewStatus: string) => {
    setError('');
    // Optimistic: the row is the only thing that changes, and a failure puts
    // the old value back rather than leaving the table lying.
    const previous = rows;
    setRows((current) =>
      current.map((row) => (row.id === vendor.id ? { ...row, securityReviewStatus } : row)),
    );
    const res = await api.patch<Vendor>(`/api/vendors/${vendor.id}`, { securityReviewStatus });
    if (!res.success) {
      setRows(previous);
      setError(res.error || 'Failed to update the review status');
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Vendors"
        subtitle="Who processes data on your behalf, and how far their security review has got."
        right={
          <button
            onClick={() => setShowForm((open) => !open)}
            className="rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900"
          >
            {showForm ? 'Cancel' : 'Add vendor'}
          </button>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {showForm ? (
        <section className="mb-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Otter.ai"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Region
              <input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="EU"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Security review
              <select
                value={form.securityReviewStatus}
                onChange={(e) => setForm({ ...form, securityReviewStatus: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                {REVIEW_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={create}
            disabled={saving}
            className="mt-4 rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900 disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
        </section>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No vendors recorded yet.
        </p>
      ) : (
        <>
          {unreviewed > 0 ? (
            <p className="mb-4 rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              {unreviewed} of {rows.length} vendors have no security review recorded.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Vendor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Region</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Security review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {rows.map((vendor) => {
                  const status = vendor.securityReviewStatus || 'Not started';
                  return (
                    <tr key={vendor.id}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{vendor.name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{vendor.region || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
                            {status}
                          </span>
                          <select
                            value={status}
                            onChange={(e) => setStatus(vendor, e.target.value)}
                            aria-label={`Security review status for ${vendor.name}`}
                            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1 text-xs text-gray-900 dark:text-gray-100"
                          >
                            {REVIEW_STATUSES.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
