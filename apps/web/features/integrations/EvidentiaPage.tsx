'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/shared';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';

type EvidentiaEvidence = {
  id: string;
  title: string;
  status: string;
  sourceSystem: string;
  type: string;
};

type StatusPayload = {
  configured: boolean;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
};

type TenantLink = {
  companyId: string;
  evidentiaTenantId: string;
  authMode: string;
  secretRef: string;
  updatedAt?: string;
} | null;

export default function EvidentiaGovernancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [external, setExternal] = useState<EvidentiaEvidence[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<TenantLink>(null);
  const [tenantId, setTenantId] = useState('');
  const [secretRef, setSecretRef] = useState('');

  const canAdmin = role === 'MANAGEMENT' || role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const me = await api.get<{ role?: string }>('/api/auth/me');
      if (!me.success || !me.data) {
        router.push('/auth/login');
        return;
      }
      setRole(me.data.role ?? null);

      const settings = await api.get<{ evidentiaSyncEnabled: boolean }>('/api/integrations/evidentia/settings');
      if (settings.success && settings.data) {
        setSyncEnabled(!!settings.data.evidentiaSyncEnabled);
      }

      const lk = await api.get<TenantLink>('/api/integrations/evidentia/link');
      if (lk.success) {
        setLink(lk.data ?? null);
        setTenantId(lk.data?.evidentiaTenantId ?? '');
        setSecretRef(lk.data?.secretRef ?? '');
      }

      const st = await api.get<StatusPayload>('/api/integrations/evidentia/status');
      if (st.success && st.data) setStatus(st.data);

      if (st.data?.configured && st.data?.reachable) {
        const ext = await api.get<EvidentiaEvidence[]>('/api/integrations/evidentia/external-evidence');
        if (ext.success && Array.isArray(ext.data)) setExternal(ext.data);
      } else {
        setExternal([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load Evidentia integration');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (redirectToLoginIfNoSession(router)) return;
    void load();
  }, [router, load]);

  const toggleSync = async () => {
    if (!canAdmin) return;
    setBusy(true);
    setError('');
    const res = await api.post('/api/integrations/evidentia/settings', {
      evidentiaSyncEnabled: !syncEnabled,
    });
    if (!res.success) {
      setError(res.error || 'Failed to update settings');
    } else {
      setSyncEnabled(!syncEnabled);
    }
    setBusy(false);
    await load();
  };

  const saveLink = async () => {
    if (!canAdmin) return;
    setBusy(true);
    setError('');
    const res = await api.post('/api/integrations/evidentia/link', {
      evidentiaTenantId: tenantId,
      secretRef,
    });
    if (!res.success) setError(res.error || 'Failed to save tenant link');
    setBusy(false);
    await load();
  };

  const pushAll = async () => {
    setBusy(true);
    setError('');
    const res = await api.post('/api/integrations/evidentia/push', {});
    if (!res.success) setError(res.error || 'Push failed');
    setBusy(false);
    await load();
  };

  const snapshot = async () => {
    setBusy(true);
    setError('');
    const res = await api.post('/api/governance/compliance-snapshots', {});
    if (!res.success) setError(res.error || 'Snapshot failed');
    setBusy(false);
  };

  return (
    <AppLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Evidentia (governed extension)</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            SAI remains the system of record for AI governance decisions. When configured, SAI pushes evidence lifecycle
            into Evidentia for audit-grade storage and review workflows.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-100">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Connection</h2>
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">API configured</dt>
                <dd className="font-medium">{status?.configured ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Reachable</dt>
                <dd className="font-medium">
                  {status?.reachable ? `Yes (${status.latencyMs} ms)` : 'No'}
                  {status?.error ? ` — ${status.error}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Push sync</dt>
                <dd className="font-medium">{syncEnabled ? 'Enabled' : 'Disabled'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tenant link</dt>
                <dd className="font-medium">{link ? 'Configured' : 'Not configured'}</dd>
              </div>
            </dl>
          )}

          {canAdmin && (
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Tenant-scoped credentials (Phase 1)</h3>
              <p className="mt-1 text-sm text-gray-600 max-w-3xl">
                Store only a <span className="font-medium">secret reference</span> (e.g. env var name). The API reads the
                bearer token at runtime; nothing sensitive is stored in the database.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evidentia tenant id</label>
                  <input
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. tenant-uuid-or-slug"
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secret ref (env var name)</label>
                  <input
                    value={secretRef}
                    onChange={(e) => setSecretRef(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. EVIDENTIA_BEARER_TOKEN_CO_123"
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveLink()}
                  className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  Save tenant link
                </button>
              </div>
            </div>
          )}

          {canAdmin && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={busy || !status?.configured}
                onClick={() => void toggleSync()}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {syncEnabled ? 'Disable Evidentia sync' : 'Enable Evidentia sync'}
              </button>
              <button
                type="button"
                disabled={busy || !syncEnabled || !status?.configured}
                onClick={() => void pushAll()}
                className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
              >
                Push all SAI evidence to Evidentia
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void snapshot()}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Capture compliance snapshot
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Evidentia evidence (read-through)</h2>
          {external.length === 0 ? (
            <p className="text-sm text-gray-600">
              No items loaded. Configure the API environment variables and ensure Evidentia is running.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 text-sm">
              {external.map((e) => (
                <li key={e.id} className="py-2 flex justify-between gap-4">
                  <span className="font-medium text-gray-900">{e.title}</span>
                  <span className="text-gray-500 shrink-0">
                    {e.status} · {e.sourceSystem}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

