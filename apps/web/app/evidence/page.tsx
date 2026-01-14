'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppLayout } from '@/components/shared';

interface Evidence {
  id: string;
  controlId: string;
  control?: { id: string; name: string };
  source: string;
  status: 'MISSING' | 'SUBMITTED' | 'APPROVED' | 'EXPIRED';
  validFrom?: string;
  validTo?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

interface Control {
  id: string;
  name: string;
}

export default function EvidencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const [evidenceResult, controlsResult] = await Promise.all([
        api.get<Evidence[]>('/api/evidence'),
        api.get<Control[]>('/api/governance/controls'),
      ]);

      if (evidenceResult.success && evidenceResult.data) {
        setEvidence(evidenceResult.data);
      } else {
        setError(evidenceResult.error || 'Failed to load evidence');
      }

      if (controlsResult.success && controlsResult.data) {
        setControls(controlsResult.data);
      }
    } catch (err) {
      setError((err as any).message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this evidence?')) return;

    try {
      const result = await api.delete(`/api/evidence/${id}`);
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || 'Failed to delete evidence');
      }
    } catch (err) {
      alert('Failed to delete evidence');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Evidence['status']) => {
    try {
      const result = await api.patch(`/api/evidence/${id}`, { status: newStatus });
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || 'Failed to update evidence status');
      }
    } catch (err) {
      alert('Failed to update evidence status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'MISSING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getControlName = (controlId: string) => {
    const control = controls.find((c) => c.id === controlId);
    return control?.name || controlId;
  };

  const isExpired = (validTo?: string) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  const filteredEvidence =
    statusFilter === 'All'
      ? evidence
      : evidence.filter((e) => e.status === statusFilter || (statusFilter === 'EXPIRED' && isExpired(e.validTo)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Evidence</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track evidence coverage status and validity windows per control
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Evidence
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex gap-2">
            {['All', 'MISSING', 'SUBMITTED', 'APPROVED', 'EXPIRED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Table */}
        {filteredEvidence.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No evidence found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              Add your first evidence
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Control
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid To
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvidence.map((item) => {
                  const expired = isExpired(item.validTo);
                  const displayStatus = expired && item.status === 'APPROVED' ? 'EXPIRED' : item.status;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getControlName(item.controlId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.source}</div>
                        {item.reference && (
                          <div className="text-xs text-gray-500">{item.reference}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            displayStatus
                          )}`}
                        >
                          {displayStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.validFrom ? new Date(item.validFrom).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.validTo ? (
                          <span className={expired ? 'text-red-600 font-medium' : ''}>
                            {new Date(item.validTo).toLocaleDateString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Actions */}
                          {item.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(item.id, 'APPROVED')}
                                className="text-green-600 hover:text-green-900 text-xs"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(item.id, 'MISSING')}
                                className="text-red-600 hover:text-red-900 text-xs"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setEditingEvidence(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Coverage Summary */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Coverage Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {evidence.filter((e) => e.status === 'APPROVED' && !isExpired(e.validTo)).length}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {evidence.filter((e) => e.status === 'SUBMITTED').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {evidence.filter((e) => e.status === 'EXPIRED' || isExpired(e.validTo)).length}
              </div>
              <div className="text-sm text-gray-500">Expired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {evidence.filter((e) => e.status === 'MISSING').length}
              </div>
              <div className="text-sm text-gray-500">Missing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingEvidence) && (
        <EvidenceModal
          evidence={editingEvidence}
          controls={controls}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvidence(null);
          }}
          onSave={async () => {
            await loadData();
            setShowCreateModal(false);
            setEditingEvidence(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function EvidenceModal({
  evidence,
  controls,
  onClose,
  onSave,
}: {
  evidence: Evidence | null;
  controls: Control[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    controlId: evidence?.controlId || '',
    source: evidence?.source || '',
    status: evidence?.status || 'MISSING',
    validFrom: evidence?.validFrom ? evidence.validFrom.split('T')[0] : '',
    validTo: evidence?.validTo ? evidence.validTo.split('T')[0] : '',
    reference: evidence?.reference || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.controlId) {
        setError('Control is required');
        setLoading(false);
        return;
      }

      if (!formData.source.trim()) {
        setError('Source is required');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        validFrom: formData.validFrom || undefined,
        validTo: formData.validTo || undefined,
      };

      let result;
      if (evidence) {
        result = await api.patch(`/api/evidence/${evidence.id}`, payload);
      } else {
        result = await api.post('/api/evidence', payload);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save evidence');
      }
    } catch (err) {
      setError('Failed to save evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {evidence ? 'Edit Evidence' : 'Add Evidence'}
          </h3>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Control *</label>
              <select
                required
                value={formData.controlId}
                onChange={(e) => setFormData({ ...formData, controlId: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select a control</option>
                {controls.map((control) => (
                  <option key={control.id} value={control.id}>
                    {control.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Source *</label>
              <input
                type="text"
                required
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., Evidentia, Upload, Integration"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Evidence['status'] })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="MISSING">Missing</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valid From</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valid To</label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reference</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Optional reference or link"
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : evidence ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
