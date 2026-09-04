'use client';

import { useEffect, useState } from 'react';
import { AppLayout, ErrorAlert, LoadingSpinner, PageHeader } from '@/components/shared';
import { api } from '@/lib/api';

type Provider = 'MLFLOW' | 'SAGEMAKER' | 'VERTEX_AI' | 'OTHER';
type Status = 'ACTIVE' | 'DISABLED' | 'ERROR';

type GpaiModel = {
  id: string;
  provider: Provider;
  displayName: string;
  modelFamily: string;
  transparencySummary?: string | null;
  euDeclarationRef?: string | null;
  status: Status;
  createdAt?: string;
};

const PROVIDERS: Provider[] = ['MLFLOW', 'SAGEMAKER', 'VERTEX_AI', 'OTHER'];
const PROVIDER_LABEL: Record<Provider, string> = {
  MLFLOW: 'MLflow',
  SAGEMAKER: 'SageMaker',
  VERTEX_AI: 'Vertex AI',
  OTHER: 'Other',
};

const STATUS_STYLES: Record<Status, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  DISABLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

const EMPTY_FORM = {
  provider: 'MLFLOW' as Provider,
  displayName: '',
  modelFamily: '',
  transparencySummary: '',
  euDeclarationRef: '',
};

export default function GpaiPage() {
  const [rows, setRows] = useState<GpaiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await api.get<GpaiModel[]>('/api/gpai');
    if (!res.success) {
      setError(res.error || 'Failed to load registered models');
      setRows([]);
    } else {
      setRows(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const register = async () => {
    setError('');
    if (!form.displayName.trim() || !form.modelFamily.trim()) {
      setError('Display name and model family are required');
      return;
    }
    setSaving(true);
    const res = await api.post<GpaiModel>('/api/gpai', {
      provider: form.provider,
      displayName: form.displayName.trim(),
      modelFamily: form.modelFamily.trim(),
      ...(form.transparencySummary.trim() ? { transparencySummary: form.transparencySummary.trim() } : {}),
      ...(form.euDeclarationRef.trim() ? { euDeclarationRef: form.euDeclarationRef.trim() } : {}),
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error || 'Failed to register the model');
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
  };

  const missingTransparency = rows.filter((row) => !row.transparencySummary).length;

  return (
    <AppLayout>
      <PageHeader
        title="General-purpose AI"
        subtitle="Models the organisation relies on, with the transparency information the Act expects."
        right={
          <button
            onClick={() => setShowForm((open) => !open)}
            className="rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900"
          >
            {showForm ? 'Cancel' : 'Register model'}
          </button>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {showForm ? (
        <section className="mb-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Provider
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value as Provider })}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                {PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {PROVIDER_LABEL[provider]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display name
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Support summariser"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model family
              <input
                value={form.modelFamily}
                onChange={(e) => setForm({ ...form, modelFamily: e.target.value })}
                placeholder="llama-3-8b-instruct"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              EU declaration reference
              <input
                value={form.euDeclarationRef}
                onChange={(e) => setForm({ ...form, euDeclarationRef: e.target.value })}
                placeholder="Optional"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-2">
              Transparency summary
              <textarea
                value={form.transparencySummary}
                onChange={(e) => setForm({ ...form, transparencySummary: e.target.value })}
                rows={3}
                placeholder="What the model is used for, what data it was trained on, and the known limits."
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
          </div>

          <button
            onClick={register}
            disabled={saving}
            className="mt-4 rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900 disabled:opacity-60"
          >
            {saving ? 'Registering…' : 'Register'}
          </button>
        </section>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No general-purpose models registered yet.
        </p>
      ) : (
        <>
          {missingTransparency > 0 ? (
            <p className="mb-4 rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              {missingTransparency} of {rows.length} registered models have no transparency summary recorded.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Model</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Provider</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Family</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Transparency</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.displayName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{PROVIDER_LABEL[row.provider]}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.modelFamily}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {row.transparencySummary ? (
                        <span className="line-clamp-2">{row.transparencySummary}</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                        {row.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
