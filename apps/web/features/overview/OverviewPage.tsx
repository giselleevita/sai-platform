'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { hasAuthSession, syncCsrfFromCookieToStorage } from '@/lib/auth';
import type { RiskSummary, Tool } from '@/types';
import { DataTable, EmptyState, LoadingSpinner, MetricCard, PageHeader, StatusBadge } from '@/components/shared';

type Paginated<T> = { data: T[]; pagination?: unknown };

type Risk = {
  id: string;
  title: string;
  likelihood: number;
  impact: number;
  updatedAt: string;
  decisions?: Array<{ id: string; decision: string }>;
};

type Evidence = {
  id: string;
  status: string;
  validTo?: string;
  control?: { name?: string };
  controlId: string;
};

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  updatedAt: string;
};

type ExceptionRecord = {
  id: string;
  status: string;
};

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId?: string;
  createdAt: string;
};

function rows<T>(payload?: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function isExpired(date?: string) {
  return Boolean(date && new Date(date) < new Date());
}

function riskScore(risk: Risk) {
  return risk.likelihood * risk.impact;
}

export default function OverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!hasAuthSession()) {
        router.push('/auth/login');
        return;
      }

      syncCsrfFromCookieToStorage();
      setLoading(true);
      setError('');

      try {
        const [toolsResult, summaryResult, risksResult, evidenceResult, incidentsResult, exceptionsResult, auditResult] =
          await Promise.all([
            api.get<Paginated<Tool>>('/api/inventory?limit=10'),
            api.get<RiskSummary>('/api/inventory/summary'),
            api.get<Paginated<Risk> | Risk[]>('/api/risks?limit=10'),
            api.get<Paginated<Evidence> | Evidence[]>('/api/evidence?limit=100'),
            api.get<Paginated<Incident> | Incident[]>('/api/incidents?limit=10'),
            api.get<Paginated<ExceptionRecord> | ExceptionRecord[]>('/api/exceptions?limit=100'),
            api.get<Paginated<AuditLog> | AuditLog[]>('/api/audit?limit=8'),
          ]);

        if (!toolsResult.success) throw new Error(toolsResult.error || 'Failed to load dashboard');

        setTools(rows(toolsResult.data));
        if (summaryResult.success) setSummary(summaryResult.data || null);
        if (risksResult.success) setRisks(rows(risksResult.data));
        if (evidenceResult.success) setEvidence(rows(evidenceResult.data));
        if (incidentsResult.success) setIncidents(rows(incidentsResult.data));
        if (exceptionsResult.success) setExceptions(rows(exceptionsResult.data));
        if (auditResult.success) setAuditLogs(rows(auditResult.data));
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [router, reloadKey]);

  const metrics = useMemo(() => {
    const highRiskTools = (summary?.riskCounts?.critical || 0) + (summary?.riskCounts?.high || 0);
    const highRisks = risks.filter((risk) => riskScore(risk) >= 12).length;
    const evidenceIssues = evidence.filter(
      (item) => item.status === 'MISSING' || item.status === 'EXPIRED' || isExpired(item.validTo)
    ).length;
    const openIncidents = incidents.filter((incident) => !['RESOLVED', 'REVIEWED'].includes(incident.status)).length;
    const pendingDecisions =
      risks.filter((risk) => !risk.decisions || risk.decisions.length === 0).length +
      exceptions.filter((item) => item.status === 'Pending' || item.status === 'PENDING').length;
    const totalObligations = Math.max(evidence.length + risks.length + incidents.length + exceptions.length, 1);
    const openGaps = evidenceIssues + highRisks + openIncidents + pendingDecisions;
    const readiness = Math.max(0, Math.round(((totalObligations - openGaps) / totalObligations) * 100));

    return { highRiskTools, highRisks, evidenceIssues, openIncidents, pendingDecisions, readiness };
  }, [evidence, exceptions, incidents, risks, summary]);

  const attentionItems = useMemo(() => {
    const toolItems = tools
      .filter((tool) => tool.riskLevel === 'Critical' || tool.riskLevel === 'High')
      .map((tool) => ({
        id: `tool-${tool.id}`,
        area: 'Inventory',
        item: tool.name,
        status: tool.riskLevel,
        href: `/inventory/${tool.id}`,
      }));
    const riskItems = risks
      .filter((risk) => riskScore(risk) >= 12)
      .map((risk) => ({
        id: `risk-${risk.id}`,
        area: 'Risk',
        item: risk.title,
        status: riskScore(risk) >= 20 ? 'Critical' : 'High',
        href: `/risks/${risk.id}`,
      }));
    const incidentItems = incidents
      .filter((incident) => !['RESOLVED', 'REVIEWED'].includes(incident.status))
      .map((incident) => ({
        id: `incident-${incident.id}`,
        area: 'Incident',
        item: incident.title,
        status: incident.status,
        href: '/incidents',
      }));
    return [...toolItems, ...riskItems, ...incidentItems].slice(0, 8);
  }, [incidents, risks, tools]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <PageHeader
        title="Management Dashboard"
        subtitle="Governance readiness, open gaps, accountability, and recent audit activity."
        right={
          <>
            <Link
              href="/reports"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Reports
            </Link>
            <Link
              href="/governance"
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white"
            >
              Governance registry
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard title="Audit readiness" value={`${metrics.readiness}%`} hint="Calculated from open gaps" />
          <MetricCard title="Evidence gaps" value={metrics.evidenceIssues} hint="Missing, expired, or overdue" />
          <MetricCard title="High risks" value={metrics.highRisks + metrics.highRiskTools} hint="Risks and AI tools" />
          <MetricCard title="Open incidents" value={metrics.openIncidents} hint="Not resolved or reviewed" />
          <MetricCard title="Pending decisions" value={metrics.pendingDecisions} hint="Risks and exceptions" />
          <MetricCard title="Total tools" value={summary?.totalTools ?? tools.length} hint="Registered inventory" />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Needs Management Attention</h2>
              <Link href="/risks" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Open risk register
              </Link>
            </div>
            <DataTable
              rows={attentionItems}
              columns={[
                { key: 'area', header: 'Area', render: (row) => row.area },
                {
                  key: 'item',
                  header: 'Item',
                  render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.item}</span>,
                },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
                {
                  key: 'action',
                  header: 'Action',
                  align: 'right',
                  render: (row) => (
                    <Link href={row.href} className="font-semibold text-blue-600 hover:text-blue-700">
                      Review
                    </Link>
                  ),
                },
              ]}
              empty={
                <EmptyState
                  title="No urgent gaps"
                  message="No high risks, unresolved incidents, or critical tool risks are currently in the first-page results."
                />
              }
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Audit Readiness Checklist</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { label: 'Controls linked to evidence', ok: metrics.evidenceIssues === 0 },
                { label: 'Critical risks have decisions', ok: metrics.pendingDecisions === 0 },
                { label: 'Incidents reviewed', ok: metrics.openIncidents === 0 },
                { label: 'High-risk tools visible', ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <span className="text-gray-700 dark:text-gray-200">{item.label}</span>
                  <StatusBadge value={item.ok ? 'Ready' : 'Gap'} tone={item.ok ? 'success' : 'danger'} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent Audit Events</h2>
              <Link href="/audit" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
            <DataTable
              rows={auditLogs}
              columns={[
                { key: 'action', header: 'Action', render: (row) => <span className="font-medium">{row.action}</span> },
                { key: 'targetType', header: 'Target', render: (row) => row.targetType },
                { key: 'createdAt', header: 'Time', render: (row) => new Date(row.createdAt).toLocaleString() },
              ]}
              empty={<EmptyState title="No audit activity" message="Governance changes and decisions will appear here once users take action." />}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Evidence Coverage</h2>
              <Link href="/evidence" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Open evidence
              </Link>
            </div>
            <DataTable
              rows={evidence.slice(0, 8)}
              columns={[
                { key: 'control', header: 'Control', render: (row) => row.control?.name || row.controlId },
                { key: 'status', header: 'Status', render: (row) => <StatusBadge value={isExpired(row.validTo) ? 'EXPIRED' : row.status} /> },
                {
                  key: 'validTo',
                  header: 'Valid Until',
                  render: (row) => (row.validTo ? new Date(row.validTo).toLocaleDateString() : 'Not set'),
                },
              ]}
              empty={<EmptyState title="No evidence records" message="Add evidence records to controls to start measuring audit coverage." />}
            />
          </div>
        </section>
      </div>
    </>
  );
}
