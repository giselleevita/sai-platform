'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout, DataTable, EmptyState, LoadingSpinner, PageHeader } from '@/components/shared';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId?: string;
  actorId?: string;
  createdAt: string;
}

export default function AuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      if (redirectToLoginIfNoSession(router)) return;

      const result = await api.get<AuditLog[] | { data: AuditLog[] }>('/api/audit');
      if (result.success && result.data) {
        setLogs(Array.isArray(result.data) ? result.data : result.data.data || []);
      } else {
        setError(result.error || 'Failed to load audit logs');
      }
    } catch (err) {
      setError((err as any).message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Audit Log" subtitle="Append-only trail of governance actions, risk decisions, and evidence changes." />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        <DataTable
          rows={logs}
          columns={[
            { key: 'action', header: 'Action', render: (log) => <span className="font-medium">{log.action}</span> },
            { key: 'targetType', header: 'Target Type', render: (log) => log.targetType },
            { key: 'targetId', header: 'Target ID', render: (log) => log.targetId || '-' },
            { key: 'createdAt', header: 'Time', render: (log) => new Date(log.createdAt).toLocaleString() },
          ]}
          empty={<EmptyState title="No audit logs" message="Governance actions and risk decisions will appear here." />}
        />
      </div>
    </AppLayout>
  );
}
