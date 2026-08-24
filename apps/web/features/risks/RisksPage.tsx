'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { useCurrentUser } from '@/hooks';
import { AppLayout, DataTable, EmptyState, LoadingSpinner, MetricCard, PageHeader, StatusBadge } from '@/components/shared';

type Risk = {
  id: string;
  title: string;
  description?: string;
  likelihood: number;
  impact: number;
  ownerId?: string;
  controls?: Array<{ control: { id: string; name: string } }>;
  decisions?: Array<{
    id: string;
    decision: 'ACCEPTED' | 'DEFERRED' | 'REJECTED';
    rationale?: string;
    approvedBy?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type Control = {
  id: string;
  name: string;
};

function unpack<T>(payload?: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function calculateRiskScore(risk: Pick<Risk, 'likelihood' | 'impact'>): number {
  return risk.likelihood * risk.impact;
}

function getRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 20) return 'Critical';
  if (score >= 12) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

export default function RisksPage() {
  const router = useRouter();
  const { canCreate, canApprove, canDelete, isReadOnly } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [decisionRisk, setDecisionRisk] = useState<Risk | null>(null);

  const loadRisks = async () => {
    if (redirectToLoginIfNoSession(router)) return;
    setLoading(true);
    setError('');

    const result = await api.get<Risk[] | { data: Risk[] }>('/api/risks?limit=100');
    if (result.success) {
      setRisks(unpack(result.data));
    } else {
      setError(result.error || 'Failed to load risks');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadRisks();
  }, []);

  const filteredRisks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return risks
      .filter((risk) => {
        const level = getRiskLevel(calculateRiskScore(risk));
        const matchesLevel = levelFilter === 'All' || level === levelFilter;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          risk.title.toLowerCase().includes(normalizedQuery) ||
          (risk.description || '').toLowerCase().includes(normalizedQuery);
        return matchesLevel && matchesQuery;
      })
      .sort((a, b) => calculateRiskScore(b) - calculateRiskScore(a));
  }, [levelFilter, query, risks]);

  const metrics = useMemo(() => {
    const highOrCritical = risks.filter((risk) => calculateRiskScore(risk) >= 12).length;
    const noDecision = risks.filter((risk) => !risk.decisions || risk.decisions.length === 0).length;
    const accepted = risks.filter((risk) => risk.decisions?.at(-1)?.decision === 'ACCEPTED').length;
    return { total: risks.length, highOrCritical, noDecision, accepted };
  }, [risks]);

  const deleteRisk = async (id: string) => {
    if (!confirm('Delete this risk?')) return;
    const result = await api.delete(`/api/risks/${id}`);
    if (result.success) {
      await loadRisks();
      return;
    }
    setError(result.error || 'Failed to delete risk');
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
      <PageHeader
        title="Risk Register"
        subtitle="Likelihood, impact, ownership, mitigation controls, and decision traceability."
        right={
          canCreate ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950"
            >
              Create risk
            </button>
          ) : (
            <span className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              Read-only role
            </span>
          )
        }
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total risks" value={metrics.total} hint="Registered risks" />
          <MetricCard title="High or critical" value={metrics.highOrCritical} hint="Management attention" />
          <MetricCard title="No decision" value={metrics.noDecision} hint="Awaiting sign-off" />
          <MetricCard title="Accepted" value={metrics.accepted} hint="Accepted with trace" />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Search risks</label>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or description"
                className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Level</label>
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="mt-2 h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <DataTable
          rows={filteredRisks}
          columns={[
            {
              key: 'risk',
              header: 'Risk',
              render: (risk) => (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{risk.title}</div>
                  <div className="mt-1 max-w-xl truncate text-xs text-gray-500 dark:text-gray-400">
                    {risk.description || 'No description'}
                  </div>
                </div>
              ),
            },
            { key: 'likelihood', header: 'Likelihood', render: (risk) => `${risk.likelihood}/5` },
            { key: 'impact', header: 'Impact', render: (risk) => `${risk.impact}/5` },
            {
              key: 'level',
              header: 'Level',
              render: (risk) => <StatusBadge value={getRiskLevel(calculateRiskScore(risk))} />,
            },
            {
              key: 'controls',
              header: 'Controls',
              render: (risk) => `${risk.controls?.length || 0} mapped`,
            },
            {
              key: 'decision',
              header: 'Decision',
              render: (risk) => <StatusBadge value={risk.decisions?.at(-1)?.decision || 'No decision'} />,
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (risk) => (
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/risks/${risk.id}`} className="font-semibold text-blue-600 hover:text-blue-700">
                    View
                  </Link>
                  {!isReadOnly && (
                    <button type="button" onClick={() => setEditingRisk(risk)} className="font-semibold text-blue-600 hover:text-blue-700">
                      Edit
                    </button>
                  )}
                  {canApprove && (
                    <button type="button" onClick={() => setDecisionRisk(risk)} className="font-semibold text-green-700 hover:text-green-800">
                      Decide
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={() => void deleteRisk(risk.id)} className="font-semibold text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  )}
                  {isReadOnly && <span className="text-xs text-gray-500">Read only</span>}
                </div>
              ),
            },
          ]}
          empty={
            <EmptyState
              title={query || levelFilter !== 'All' ? 'No risks match this view' : 'No risks logged'}
              message={
                query || levelFilter !== 'All'
                  ? 'Adjust the search or level filter to review additional risks.'
                  : 'Create a risk to start tracking likelihood, impact, controls, and management decisions.'
              }
              action={
                canCreate ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Create first risk
                  </button>
                ) : null
              }
            />
          }
        />
      </div>

      {(showCreateModal || editingRisk) && (
        <RiskModal
          risk={editingRisk}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRisk(null);
          }}
          onSave={async () => {
            setShowCreateModal(false);
            setEditingRisk(null);
            await loadRisks();
          }}
        />
      )}

      {decisionRisk && (
        <DecisionModal
          risk={decisionRisk}
          onClose={() => setDecisionRisk(null)}
          onSave={async () => {
            setDecisionRisk(null);
            await loadRisks();
          }}
        />
      )}
    </AppLayout>
  );
}

function RiskModal({ risk, onClose, onSave }: { risk: Risk | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    title: risk?.title || '',
    description: risk?.description || '',
    likelihood: risk?.likelihood || 3,
    impact: risk?.impact || 3,
    ownerId: risk?.ownerId || '',
    controlIds: risk?.controls?.map((entry) => entry.control.id) || [],
  });
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api.get<Control[]>('/api/governance/controls').then((result) => {
      if (result.success && result.data) setControls(result.data);
    });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      likelihood: Number(formData.likelihood),
      impact: Number(formData.impact),
    };
    const result = risk ? await api.patch(`/api/risks/${risk.id}`, payload) : await api.post('/api/risks', payload);

    if (result.success) {
      onSave();
    } else {
      setError(result.error || 'Failed to save risk');
    }
    setLoading(false);
  };

  const score = calculateRiskScore(formData);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/40">
      <div className="mx-auto mt-16 w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{risk ? 'Edit Risk' : 'Create Risk'}</h3>
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Title</label>
            <input
              required
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-700">Likelihood</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.likelihood}
                onChange={(event) => setFormData({ ...formData, likelihood: Number(event.target.value) })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Impact</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.impact}
                onChange={(event) => setFormData({ ...formData, impact: Number(event.target.value) })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Calculated level</span>
              <StatusBadge value={getRiskLevel(score)} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.likelihood} x {formData.impact} = {score}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Mitigation Controls</label>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-gray-300 p-3">
              {controls.length === 0 ? (
                <p className="text-sm text-gray-500">No controls available</p>
              ) : (
                controls.map((control) => (
                  <label key={control.id} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.controlIds.includes(control.id)}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          controlIds: prev.controlIds.includes(control.id)
                            ? prev.controlIds.filter((id) => id !== control.id)
                            : [...prev.controlIds, control.id],
                        }))
                      }
                    />
                    {control.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Saving...' : risk ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DecisionModal({ risk, onClose, onSave }: { risk: Risk; onClose: () => void; onSave: () => void }) {
  const [decision, setDecision] = useState<'ACCEPTED' | 'DEFERRED' | 'REJECTED'>('ACCEPTED');
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await api.post(`/api/risks/${risk.id}/decisions`, { decision, rationale });
    if (result.success) {
      onSave();
    } else {
      setError(result.error || 'Failed to save decision');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/40">
      <div className="mx-auto mt-16 w-full max-w-xl rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Management Decision</h3>
        <p className="mt-1 text-sm text-gray-600">{risk.title}</p>
        {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Decision</label>
            <select
              value={decision}
              onChange={(event) => setDecision(event.target.value as any)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ACCEPTED">Accepted</option>
              <option value="DEFERRED">Deferred</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Rationale</label>
            <textarea
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Why was this decision made?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Saving...' : 'Save decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
