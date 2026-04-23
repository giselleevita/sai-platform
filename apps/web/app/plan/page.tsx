'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout } from '@/components/shared/AppLayout';

type PlanAndUsage = {
  subscription: any;
  entitlements: { key: string; valueInt: number | null; valueBool: boolean | null }[];
  usage: { aiTools: number };
};

export default function PlanPage() {
  const [data, setData] = useState<PlanAndUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (redirectToLoginIfNoSession(router)) return;
      const res = await api.get<PlanAndUsage>('/api/v1/entitlements');
      if (!res.success) {
        setError(res.error || 'Failed to load');
        return;
      }
      setData(res.data ?? null);
    };
    void load();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Plan & Usage</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!data && !error && <p className="mt-4 text-gray-600">Loading…</p>}
      {data && (
        <div className="mt-6 space-y-6">
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900">Usage</h2>
            <div className="mt-2 text-sm text-gray-700">
              <div>AI tools: {data.usage.aiTools}</div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900">Entitlements</h2>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              {data.entitlements.length === 0 && <div>No entitlements set.</div>}
              {data.entitlements.map((e) => (
                <div key={e.key} className="flex items-center justify-between">
                  <div className="font-mono">{e.key}</div>
                  <div>
                    {e.valueBool !== null ? String(e.valueBool) : e.valueInt !== null ? e.valueInt : '—'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900">Subscription</h2>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto">
              {JSON.stringify(data.subscription, null, 2)}
            </pre>
          </section>
        </div>
      )}
      </div>
    </AppLayout>
  );
}

