'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout } from '@/components/shared';

interface Tool {
  id: string;
  name: string;
}

interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: string;
  status: 'DETECTED' | 'CLASSIFIED' | 'ESCALATED' | 'RESOLVED' | 'REVIEWED';
  detectedAt: string;
  resolvedAt?: string;
  reportedAt?: string;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function IncidentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const loadIncidents = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      if (redirectToLoginIfNoSession(router)) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter !== 'All' && { status: statusFilter }),
      });

      const result = await api.get<{ data: Incident[]; pagination: any }>(`/api/incidents?${params}`);
      if (result.success && result.data) {
        setIncidents(result.data.data || []);
        setPagination(result.data.pagination || pagination);
      } else {
        setError(result.error || 'Failed to load incidents. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load incidents. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents(1);
  }, [router, searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;

    try {
      const result = await api.delete(`/api/incidents/${id}`);
      if (result.success) {
        await loadIncidents();
      } else {
        alert(result.error || 'Failed to delete incident');
      }
    } catch (err) {
      alert('Failed to delete incident');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Incident['status']) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'RESOLVED') {
        updateData.resolvedAt = new Date().toISOString();
      }
      if (newStatus === 'CLASSIFIED') {
        updateData.reportedAt = new Date().toISOString();
      }

      const result = await api.patch(`/api/incidents/${id}`, updateData);
      if (result.success) {
        await loadIncidents();
      } else {
        alert(result.error || 'Failed to update incident status');
      }
    } catch (err) {
      alert('Failed to update incident status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REVIEWED':
        return 'bg-green-100 text-green-800';
      case 'RESOLVED':
        return 'bg-blue-100 text-blue-800';
      case 'ESCALATED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLASSIFIED':
        return 'bg-purple-100 text-purple-800';
      case 'DETECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'low':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getNextStatus = (currentStatus: Incident['status']): Incident['status'] | null => {
    const transitions: Record<string, Incident['status']> = {
      DETECTED: 'CLASSIFIED',
      CLASSIFIED: 'ESCALATED',
      ESCALATED: 'RESOLVED',
      RESOLVED: 'REVIEWED',
    };
    return transitions[currentStatus] || null;
  };

  // Incidents are already filtered by the API
  const filteredIncidents = incidents;

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
              <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track incident lifecycle, escalation, and post-incident reviews
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Incident
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

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); loadIncidents(1); }} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Incidents
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['All', 'DETECTED', 'CLASSIFIED', 'ESCALATED', 'RESOLVED', 'REVIEWED'].map(
                (status) => (
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
                )
              )}
            </div>
            <div className="text-sm text-gray-600">
              Showing {incidents.length} of {pagination.total} incidents
            </div>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
            <button
              onClick={() => loadIncidents(pagination.page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadIncidents(pagination.page + 1)}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Incidents List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading incidents...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">
              {searchQuery ? 'No incidents match your search' : 'No incidents found'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  loadIncidents(1);
                }}
                className="text-blue-600 hover:text-blue-900 font-medium mr-4"
              >
                Clear search
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              Create your first incident
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const nextStatus = getNextStatus(incident.status);

              return (
                <div
                  key={incident.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${getSeverityColor(
                            incident.severity
                          )}`}
                          title={incident.severity}
                        ></span>
                        <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            incident.status
                          )}`}
                        >
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                      {incident.description && (
                        <div className="text-sm text-gray-600 mb-3">
                          <p>{incident.description.split('\n\nRelated AI Tool:')[0]}</p>
                          {incident.description.includes('Related AI Tool:') && (
                            <p className="mt-2 text-xs text-blue-600 font-medium">
                              🔗 {incident.description.split('Related AI Tool:')[1]}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>Detected: {new Date(incident.detectedAt).toLocaleDateString()}</span>
                        {incident.resolvedAt && (
                          <span>Resolved: {new Date(incident.resolvedAt).toLocaleDateString()}</span>
                        )}
                        {incident.reportedAt && (
                          <span>Reported: {new Date(incident.reportedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {incident.owner && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Owner:</span> {incident.owner.name} ({incident.owner.email}) - {incident.owner.role}
                          </div>
                        )}
                        {!incident.owner && incident.ownerId && (
                          <div className="text-xs text-gray-500 italic">Owner assigned (ID: {incident.ownerId})</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusChange(incident.id, nextStatus)}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        >
                          {nextStatus === 'REVIEWED' ? 'Mark Reviewed' : `Move to ${nextStatus.replace('_', ' ')}`}
                        </button>
                      )}
                      {incident.status === 'RESOLVED' && (
                        <button
                          onClick={() => setSelectedIncident(incident)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => setEditingIncident(incident)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(incident.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingIncident) && (
        <IncidentModal
          incident={editingIncident}
          onClose={() => {
            setShowCreateModal(false);
            setEditingIncident(null);
          }}
          onSave={async () => {
            await loadIncidents();
            setShowCreateModal(false);
            setEditingIncident(null);
          }}
        />
      )}

      {/* Review Modal */}
      {selectedIncident && (
        <ReviewModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onSave={async () => {
            await loadIncidents();
            setSelectedIncident(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function IncidentModal({
  incident,
  onClose,
  onSave,
}: {
  incident: Incident | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: incident?.title || '',
    description: incident?.description || '',
    severity: incident?.severity || 'Medium',
    status: incident?.status || 'DETECTED',
    detectedAt: incident?.detectedAt
      ? new Date(incident.detectedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    toolId: '',
    toolName: '',
  });
  const [tools, setTools] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const result = await api.get<Array<{ id: string; name: string }>>('/api/inventory');
      if (result.success && result.data) {
        setTools(result.data.map((t: any) => ({ id: t.id, name: t.name })));
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
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      const payload: any = {
        ...formData,
        detectedAt: new Date(formData.detectedAt).toISOString(),
      };
      
      // Add tool information to description if tool is selected
      if (formData.toolId && formData.toolName) {
        payload.description = `${payload.description || ''}\n\nRelated AI Tool: ${formData.toolName}`.trim();
      }

      let result;
      if (incident) {
        result = await api.patch(`/api/incidents/${incident.id}`, payload);
      } else {
        result = await api.post('/api/incidents', payload);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save incident');
      }
    } catch (err) {
      setError('Failed to save incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {incident ? 'Edit Incident' : 'Create Incident'}
          </h3>

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
                <label className="block text-sm font-medium text-gray-700">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Incident['status'] })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="DETECTED">Detected</option>
                  <option value="CLASSIFIED">Classified</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REVIEWED">Reviewed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Detected At</label>
                <input
                  type="date"
                  value={formData.detectedAt}
                  onChange={(e) => setFormData({ ...formData, detectedAt: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Related AI Tool</label>
                <select
                  value={formData.toolId}
                  onChange={(e) => {
                    const tool = tools.find((t) => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      toolId: e.target.value,
                      toolName: tool?.name || '',
                    });
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Select a tool...</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
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
                {loading ? 'Saving...' : incident ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  incident,
  onClose,
  onSave,
}: {
  incident: Incident;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    rootCause: '',
    lessonsLearned: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Mark as reviewed and update with review data
      const result = await api.patch(`/api/incidents/${incident.id}`, {
        status: 'REVIEWED',
        // Note: rootCause and lessonsLearned would need to be added to the schema
        // For now, we'll just mark as reviewed
      });

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to complete review');
      }
    } catch (err) {
      setError('Failed to complete review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Post-Incident Review: {incident.title}
          </h3>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Root Cause</label>
              <textarea
                value={formData.rootCause}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                rows={4}
                placeholder="What was the root cause of this incident?"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lessons Learned</label>
              <textarea
                value={formData.lessonsLearned}
                onChange={(e) => setFormData({ ...formData, lessonsLearned: e.target.value })}
                rows={4}
                placeholder="What did we learn? What will we do differently?"
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
                {loading ? 'Saving...' : 'Complete Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
