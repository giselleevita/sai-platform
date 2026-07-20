'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout, MetricCard, PageHeader } from '@/components/shared';

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
      <PageHeader title="Plan & usage" subtitle="Entitlements and usage limits for your tenant." />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {error && <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>}
        {!data && !error && <div className="text-sm text-gray-700 dark:text-gray-200">Loading…</div>}

        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="AI tools" value={data.usage.aiTools} hint="Current count" />
              <MetricCard title="Entitlements" value={data.entitlements.length} hint="Configured keys" />
            </section>

            <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Entitlements</h2>
              <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 space-y-2">
                {data.entitlements.length === 0 ? (
                  <div className="text-gray-600 dark:text-gray-300">No entitlements set.</div>
                ) : (
                  data.entitlements.map((e) => (
                    <div key={e.key} className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-100">{e.key}</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {e.valueBool !== null ? String(e.valueBool) : e.valueInt !== null ? e.valueInt : '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Subscription</h2>
              <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-950 p-3 rounded border border-gray-200 dark:border-gray-800 overflow-auto text-gray-800 dark:text-gray-200">
                {JSON.stringify(data.subscription, null, 2)}
              </pre>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

