'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout } from '@/components/shared';

interface Control {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED';
  policyId?: string;
  ownerId?: string;
  approverId?: string;
  reviewerId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ControlsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<Control[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingControl, setEditingControl] = useState<Control | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    loadControls();
  }, []);

  const loadControls = async () => {
    try {
      setLoading(true);
      if (redirectToLoginIfNoSession(router)) return;

      const result = await api.get<Control[]>('/api/governance/controls');
      if (result.success && result.data) {
        setControls(result.data);
      } else {
        setError(result.error || 'Failed to load controls');
      }
    } catch (err) {
      setError((err as any).message || 'Failed to load controls');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this control?')) return;

    try {
      const result = await api.delete(`/api/governance/controls/${id}`);
      if (result.success) {
        await loadControls();
      } else {
        alert(result.error || 'Failed to delete control');
      }
    } catch (err) {
      alert('Failed to delete control');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Control['status']) => {
    try {
      const result = await api.patch(`/api/governance/controls/${id}`, { status: newStatus });
      if (result.success) {
        await loadControls();
      } else {
        alert(result.error || 'Failed to update control status');
      }
    } catch (err) {
      alert('Failed to update control status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'RETIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredControls =
    statusFilter === 'All'
      ? controls
      : controls.filter((c) => c.status === statusFilter);

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
              <h1 className="text-3xl font-bold text-gray-900">Controls</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage security controls with lifecycle states and ownership
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Control
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
            {['All', 'DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'RETIRED'].map((status) => (
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

        {/* Controls Table */}
        {filteredControls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No controls found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              Create your first control
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredControls.map((control) => (
                  <tr key={control.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{control.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          control.status
                        )}`}
                      >
                        {control.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {control.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(control.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Lifecycle Actions */}
                        {control.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(control.id, 'UNDER_REVIEW')}
                            className="text-yellow-600 hover:text-yellow-900 text-xs"
                            title="Submit for Review"
                          >
                            Submit
                          </button>
                        )}
                        {control.status === 'UNDER_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(control.id, 'ACTIVE')}
                              className="text-green-600 hover:text-green-900 text-xs"
                              title="Approve"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(control.id, 'DRAFT')}
                              className="text-gray-600 hover:text-gray-900 text-xs"
                              title="Reject"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {control.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(control.id, 'RETIRED')}
                            className="text-red-600 hover:text-red-900 text-xs"
                            title="Retire"
                          >
                            Retire
                          </button>
                        )}
                        <button
                          onClick={() => setEditingControl(control)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(control.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingControl) && (
        <ControlModal
          control={editingControl}
          onClose={() => {
            setShowCreateModal(false);
            setEditingControl(null);
          }}
          onSave={async () => {
            await loadControls();
            setShowCreateModal(false);
            setEditingControl(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function ControlModal({
  control,
  onClose,
  onSave,
}: {
  control: Control | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: control?.name || '',
    description: control?.description || '',
    status: control?.status || 'DRAFT',
    policyId: control?.policyId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      let result;
      if (control) {
        result = await api.patch(`/api/governance/controls/${control.id}`, formData);
      } else {
        result = await api.post('/api/governance/controls', formData);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save control');
      }
    } catch (err) {
      setError('Failed to save control');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {control ? 'Edit Control' : 'Create Control'}
          </h3>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Control['status'] })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTIVE">Active</option>
                <option value="RETIRED">Retired</option>
              </select>
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
                {loading ? 'Saving...' : control ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

