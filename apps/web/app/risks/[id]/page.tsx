'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { RiskBadge, AppLayout, CommentsSection } from '@/components/shared';

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

export default function RiskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const riskId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [error, setError] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (riskId) {
      loadRisk();
    }
  }, [riskId]);

  const loadRisk = async () => {
    try {
      setLoading(true);
      if (redirectToLoginIfNoSession(router)) return;

      const result = await api.get<Risk[]>(`/api/risks`);
      if (result.success && result.data) {
        const foundRisk = result.data.find((r) => r.id === riskId);
        if (foundRisk) {
          setRisk(foundRisk);
        } else {
          setError('Risk not found');
        }
      } else {
        setError(result.error || 'Failed to load risk');
      }
    } catch (err) {
      setError((err as any).message || 'Failed to load risk');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this risk?')) return;

    try {
      const result = await api.delete(`/api/risks/${riskId}`);
      if (result.success) {
        router.push('/risks');
      } else {
        alert(result.error || 'Failed to delete risk');
      }
    } catch (err) {
      alert('Failed to delete risk');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !risk) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Risk not found'}</p>
          <Link href="/risks" className="text-blue-600 hover:text-blue-900">
            Back to Risk Register
          </Link>
        </div>
      </div>
    );
  }

  const score = calculateRiskScore(risk.likelihood, risk.impact);
  const level = getRiskLevel(score);

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/risks" className="text-blue-600 hover:text-blue-900 text-sm mb-2 block">
                ← Back to Risk Register
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{risk.title}</h1>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDecisionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Add Decision
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Details</h2>
              <div className="space-y-4">
                {risk.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{risk.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Likelihood</label>
                    <p className="mt-1 text-sm text-gray-900">{risk.likelihood}/5</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Impact</label>
                    <p className="mt-1 text-sm text-gray-900">{risk.impact}/5</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Risk Score</label>
                  <div className="mt-2">
                    <RiskBadge level={level} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Calculated as: Likelihood ({risk.likelihood}) × Impact ({risk.impact}) = {score}
                  </p>
                </div>
              </div>
            </div>

            {/* Decisions Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Decision Timeline</h2>
              {risk.decisions && risk.decisions.length > 0 ? (
                <div className="space-y-4">
                  {risk.decisions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((decision) => (
                      <div key={decision.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              decision.decision === 'ACCEPTED'
                                ? 'bg-green-100 text-green-800'
                                : decision.decision === 'DEFERRED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {decision.decision}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(decision.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {decision.rationale && (
                          <p className="mt-2 text-sm text-gray-700">{decision.rationale}</p>
                        )}
                        {decision.approvedBy && (
                          <p className="mt-1 text-xs text-gray-500">
                            Approved by: {decision.approvedBy}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No decisions recorded yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Summary</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(risk.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(risk.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Decisions</dt>
                  <dd className="text-sm text-gray-900">{risk.decisions?.length || 0}</dd>
                </div>
              </dl>
            </div>

            {/* Linked Controls */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Mitigation Controls</h3>
              {risk.controls && risk.controls.length > 0 ? (
                <ul className="space-y-2">
                  {risk.controls.map((rc) => (
                    <li key={rc.control.id} className="text-sm text-gray-700">
                      • {rc.control.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No controls linked</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <DecisionModal
          riskId={riskId}
          onClose={() => setShowDecisionModal(false)}
          onSave={async () => {
            await loadRisk();
            setShowDecisionModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditRiskModal
          risk={risk}
          onClose={() => setShowEditModal(false)}
          onSave={async () => {
            await loadRisk();
            setShowEditModal(false);
          }}
        />
      )}

      {/* Comments Section */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <CommentsSection
          targetType="risk"
          targetId={riskId}
        />
      </div>
    </AppLayout>
  );
}

function DecisionModal({
  riskId,
  onClose,
  onSave,
}: {
  riskId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    decision: 'ACCEPTED' as 'ACCEPTED' | 'DEFERRED' | 'REJECTED',
    rationale: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.rationale.trim()) {
        setError('Rationale is required');
        setLoading(false);
        return;
      }

      const result = await api.post(`/api/risks/${riskId}/decisions`, formData);
      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to add decision');
      }
    } catch (err) {
      setError('Failed to add decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Decision</h3>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Decision *</label>
              <select
                required
                value={formData.decision}
                onChange={(e) =>
                  setFormData({ ...formData, decision: e.target.value as any })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="ACCEPTED">Accept</option>
                <option value="DEFERRED">Defer</option>
                <option value="REJECTED">Reject</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rationale *</label>
              <textarea
                required
                value={formData.rationale}
                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                rows={4}
                placeholder="Explain the decision and reasoning..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Decision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditRiskModal({
  risk,
  onClose,
  onSave,
}: {
  risk: Risk;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: risk.title,
    description: risk.description || '',
    likelihood: risk.likelihood,
    impact: risk.impact,
    controlIds: risk.controls?.map((c) => c.control.id) || [],
  });
  const [controls, setControls] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadControls();
  }, []);

  const loadControls = async () => {
    try {
      const result = await api.get<Array<{ id: string; name: string }>>('/api/governance/controls');
      if (result.success && result.data) {
        setControls(result.data);
      }
    } catch (err) {
      // Ignore errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        likelihood: Number(formData.likelihood),
        impact: Number(formData.impact),
      };

      const result = await api.patch(`/api/risks/${risk.id}`, payload);
      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to update risk');
      }
    } catch (err) {
      setError('Failed to update risk');
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Risk</h3>

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
                <label className="block text-sm font-medium text-gray-700">
                  Likelihood (1-5) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={formData.likelihood}
                  onChange={(e) =>
                    setFormData({ ...formData, likelihood: parseInt(e.target.value) || 1 })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, impact: parseInt(e.target.value) || 1 })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Control Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mitigation Controls
              </label>
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
                {loading ? 'Saving...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
