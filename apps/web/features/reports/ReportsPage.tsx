'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppLayout, DataTable, EmptyState, MetricCard, PageHeader, StatusBadge } from '@/components/shared';
import { api } from '@/lib/api';
import { getCsrfToken, redirectToLoginIfNoSession } from '@/lib/auth';
import { useCurrentUser } from '@/hooks';

type ReportItem = {
  id: string;
  name: string;
  audience: string;
  format: string;
  endpoint: string;
  filename: string;
  method: 'api-json' | 'download';
  status: string;
};

const reportCatalog: ReportItem[] = [
  {
    id: 'audit-package',
    name: 'Audit Package',
    audience: 'Auditors',
    format: 'JSON',
    endpoint: '/api/reports/audit-package',
    filename: 'audit-package',
    method: 'api-json',
    status: 'Ready',
  },
  {
    id: 'auditor-zip',
    name: 'Auditor ZIP',
    audience: 'Auditors',
    format: 'ZIP',
    endpoint: '/api/reports/auditor-zip?includeAttachments=1&maxAttachmentBytes=20000000',
    filename: 'sai-auditor-export',
    method: 'download',
    status: 'Ready',
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    audience: 'Management',
    format: 'PDF',
    endpoint: '/api/reports/executive-summary?format=pdf&charts=true',
    filename: 'executive-summary',
    method: 'download',
    status: 'Ready',
  },
  {
    id: 'risk-assessment-pdf',
    name: 'Risk Assessment',
    audience: 'Risk owners',
    format: 'PDF',
    endpoint: '/api/reports/risk-assessment?format=pdf&charts=true',
    filename: 'risk-assessment',
    method: 'download',
    status: 'Ready',
  },
  {
    id: 'risk-assessment-json',
    name: 'Risk Assessment Data',
    audience: 'Risk owners',
    format: 'JSON',
    endpoint: '/api/reports/risk-assessment?format=json',
    filename: 'risk-assessment',
    method: 'api-json',
    status: 'Ready',
  },
  {
    id: 'compliance-pdf',
    name: 'Compliance Report',
    audience: 'Compliance',
    format: 'PDF',
    endpoint: '/api/reports/compliance?format=pdf&charts=true',
    filename: 'compliance-report',
    method: 'download',
    status: 'Ready',
  },
  {
    id: 'compliance-json',
    name: 'Compliance Data',
    audience: 'Compliance',
    format: 'JSON',
    endpoint: '/api/reports/compliance?format=json',
    filename: 'compliance-report',
    method: 'api-json',
    status: 'Ready',
  },
  {
    id: 'inventory-csv',
    name: 'Inventory Export',
    audience: 'Operators',
    format: 'CSV',
    endpoint: '/api/inventory/export/csv',
    filename: 'inventory-export',
    method: 'download',
    status: 'Ready',
  },
  {
    id: 'inventory-excel',
    name: 'Inventory Workbook',
    audience: 'Operators',
    format: 'XLSX',
    endpoint: '/api/import-export/tools/excel',
    filename: 'inventory-export',
    method: 'download',
    status: 'Ready',
  },
];

function datedFilename(base: string, format: string) {
  return `${base}-${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
}

export default function ReportsPage() {
  const router = useRouter();
  const { isReadOnly } = useCurrentUser();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');

  useEffect(() => {
    redirectToLoginIfNoSession(router);
  }, [router]);

  const audiences = useMemo(() => ['All', ...Array.from(new Set(reportCatalog.map((item) => item.audience)))], []);
  const filteredReports = useMemo(
    () => (audienceFilter === 'All' ? reportCatalog : reportCatalog.filter((item) => item.audience === audienceFilter)),
    [audienceFilter]
  );

  const downloadBlob = async (report: ReportItem) => {
    const csrf = getCsrfToken();
    const response = await fetch(report.endpoint, {
      credentials: 'include',
      headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || `Download failed (${response.status})`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = datedFilename(report.filename, report.format);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJson = async (report: ReportItem) => {
    const result = await api.get<unknown>(report.endpoint);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Report could not be generated');
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = datedFilename(report.filename, report.format);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runReport = async (report: ReportItem) => {
    setLoadingId(report.id);
    setError('');
    try {
      if (report.method === 'api-json') {
        await downloadJson(report);
      } else {
        await downloadBlob(report);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Reports"
        subtitle="Audit packages, management summaries, and exportable compliance evidence."
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Audit exports" value={2} hint="JSON and ZIP packages" />
          <MetricCard title="Management reports" value={1} hint="Executive summary" />
          <MetricCard title="Risk reports" value={2} hint="PDF and JSON" />
          <MetricCard title="Compliance exports" value={4} hint="Reports and inventory" />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-2">
            {audiences.map((audience) => (
              <button
                key={audience}
                type="button"
                onClick={() => setAudienceFilter(audience)}
                className={[
                  'rounded-md border px-3 py-2 text-sm font-semibold',
                  audienceFilter === audience
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {audience}
              </button>
            ))}
          </div>
        </section>

        <DataTable
          rows={filteredReports}
          columns={[
            {
              key: 'name',
              header: 'Report',
              render: (report) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{report.name}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{report.endpoint}</div>
                </div>
              ),
            },
            { key: 'audience', header: 'Audience', render: (report) => report.audience },
            { key: 'format', header: 'Format', render: (report) => <StatusBadge value={report.format} tone="info" /> },
            { key: 'status', header: 'Status', render: (report) => <StatusBadge value={report.status} /> },
            {
              key: 'action',
              header: 'Action',
              align: 'right',
              render: (report) => (
                <button
                  type="button"
                  onClick={() => void runReport(report)}
                  disabled={loadingId !== null}
                  className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-950"
                >
                  {loadingId === report.id ? 'Preparing...' : 'Download'}
                </button>
              ),
            },
          ]}
          empty={<EmptyState title="No reports" message="No report definitions are available for this audience." />}
        />

        {isReadOnly ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Auditor role is read-only. Exports are available, but source records cannot be changed from this view.
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
