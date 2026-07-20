// NOTE: This file is an exact move of the original `/app/risks/page.tsx` implementation
// to keep behavior equivalent while transitioning to a feature-first layout.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { hasAuthSession } from '@/lib/auth';
import { RiskBadge, AppLayout } from '@/components/shared';

interface Risk {
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
}

function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

function getRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 20) return 'Critical';
  if (score >= 12) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

export default function RisksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'title' | 'updated'>('score');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const loadRisks = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      if (!hasAuthSession()) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(sortBy && { sortBy: sortBy === 'score' ? 'likelihood' : sortBy }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const result = await api.get<{ data: Risk[]; pagination: any }>(`/api/risks?${params}`);
      if (result.success && result.data) {
        setRisks(result.data.data || []);
        setPagination(result.data.pagination || pagination);
      } else {
        setError(result.error || 'Failed to load risks. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load risks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRisks(1);
  }, [router, searchQuery, sortBy, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this risk?')) return;

    try {
      const result = await api.delete(`/api/risks/${id}`);
      if (result.success) {
        await loadRisks();
      } else {
        alert(result.error || 'Failed to delete risk');
      }
    } catch (err) {
      alert('Failed to delete risk');
    }
  };

  const sortedRisks = risks;
  const hasActiveFilters = searchQuery.trim().length > 0 || categoryFilter.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Risk Register</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track risks with likelihood, impact, ownership, and mitigation controls
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Risk
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                onClick={() => void loadRisks(pagination.page)}
                className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white rounded-lg shadow p-4 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadRisks(1);
            }}
            className="flex gap-4"
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Risks</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="ml-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="score">Risk Score</option>
                <option value="title">Title</option>
                <option value="updated">Last Updated</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="ml-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Data Security">Data Security</option>
                <option value="Vendor Risk">Vendor Risk</option>
                <option value="Compliance">Compliance</option>
                <option value="Operational">Operational</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {risks.length} of {pagination.total} risks
            </div>
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
            <button
              onClick={() => void loadRisks(pagination.page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => void loadRisks(pagination.page + 1)}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading risks...</p>
          </div>
        ) : risks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">
              {hasActiveFilters ? 'No risks match the current filters' : 'No risks logged yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {hasActiveFilters
                ? 'Try resetting search/category filters to review all recorded risks.'
                : 'Create your first risk to start likelihood-impact tracking and mitigation planning.'}
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('');
                    setSortBy('score');
                  }}
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reset filters
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create your first risk
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likelihood</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decisions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRisks.map((risk) => {
                  const score = calculateRiskScore(risk.likelihood, risk.impact);
                  const level = getRiskLevel(score);
                  const latestDecision = risk.decisions?.[risk.decisions.length - 1];

                  return (
                    <tr key={risk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                        {risk.description && <div className="text-xs text-gray-500 line-clamp-1 mt-1">{risk.description}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{risk.likelihood}/5</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{risk.impact}/5</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RiskBadge level={level} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {risk.controls?.length || 0} control{risk.controls?.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {latestDecision ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              latestDecision.decision === 'ACCEPTED'
                                ? 'bg-green-100 text-green-800'
                                : latestDecision.decision === 'DEFERRED'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {latestDecision.decision}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No decision</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/risks/${risk.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          View
                        </Link>
                        <button
                          onClick={() => setEditingRisk(risk)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(risk.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showCreateModal || editingRisk) && (
        <RiskModal
          risk={editingRisk}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRisk(null);
          }}
          onSave={async () => {
            await loadRisks();
            setShowCreateModal(false);
            setEditingRisk(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function RiskModal({
  risk,
  onClose,
  onSave,
}: {
  risk: Risk | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: risk?.title || '',
    description: risk?.description || '',
    likelihood: risk?.likelihood || 3,
    impact: risk?.impact || 3,
    ownerId: risk?.ownerId || '',
    controlIds: risk?.controls?.map((c) => c.control.id) || [],
  });
  const [controls, setControls] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadControls();
  }, []);

  const loadControls = async () => {
    try {
      const result = await api.get<Array<{ id: string; name: string }>>('/api/governance/controls');
      if (result.success && result.data) {
        setControls(result.data);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        likelihood: Number(formData.likelihood),
        impact: Number(formData.impact),
      };

      let result;
      if (risk) {
        result = await api.patch(`/api/risks/${risk.id}`, payload);
      } else {
        result = await api.post('/api/risks', payload);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save risk');
      }
    } catch {
      setError('Failed to save risk');
    } finally {
      setLoading(false);
    }
  };

  const toggleControl = (controlId: string) => {
    setFormData((prev) => ({
      ...prev,
      controlIds: prev.controlIds.includes(controlId)
        ? prev.controlIds.filter((id) => id !== controlId)
        : [...prev.controlIds, controlId],
    }));
  };

  const score = calculateRiskScore(formData.likelihood, formData.impact);
  const level = getRiskLevel(score);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{risk ? 'Edit Risk' : 'Create Risk'}</h3>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Likelihood (1-5) *</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={formData.likelihood}
                  onChange={(e) => setFormData({ ...formData, likelihood: parseInt(e.target.value) || 1 })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Impact (1-5) *</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) || 1 })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Risk Score:</span>
                <RiskBadge level={level} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Likelihood ({formData.likelihood}) × Impact ({formData.impact}) = {score}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mitigation Controls</label>
              <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
                {controls.length === 0 ? (
                  <p className="text-sm text-gray-500">No controls available</p>
                ) : (
                  <div className="space-y-2">
                    {controls.map((control) => (
                      <label key={control.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.controlIds.includes(control.id)}
                          onChange={() => toggleControl(control.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{control.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : risk ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

