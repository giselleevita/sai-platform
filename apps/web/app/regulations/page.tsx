'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import { AppLayout } from '@/components/shared';

interface Regulation {
  id: string;
  framework: string;
  article?: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function RegulationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
  const [frameworkFilter, setFrameworkFilter] = useState<string>('All');

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    try {
      setLoading(true);
      if (redirectToLoginIfNoSession(router)) return;

      const result = await api.get<Regulation[]>('/api/governance/regulations');
      if (result.success && result.data) {
        setRegulations(result.data);
      } else {
        setError(result.error || 'Failed to load regulations');
      }
    } catch (err) {
      setError((err as any).message || 'Failed to load regulations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this regulation?')) return;

    try {
      const result = await api.delete(`/api/governance/regulations/${id}`);
      if (result.success) {
        await loadRegulations();
      } else {
        alert(result.error || 'Failed to delete regulation');
      }
    } catch (err) {
      alert('Failed to delete regulation');
    }
  };

  const frameworks = ['All', ...new Set(regulations.map((r) => r.framework))];
  const filteredRegulations =
    frameworkFilter === 'All'
      ? regulations
      : regulations.filter((r) => r.framework === frameworkFilter);

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
              <h1 className="text-3xl font-bold text-gray-900">Regulations</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track regulatory obligations and map them to controls
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Regulation
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

        {/* Framework Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {frameworks.map((framework) => (
              <button
                key={framework}
                onClick={() => setFrameworkFilter(framework)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  frameworkFilter === framework
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {framework}
              </button>
            ))}
          </div>
        </div>

        {/* Regulations List */}
        {filteredRegulations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No regulations found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              Create your first regulation
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRegulations.map((regulation) => (
              <div
                key={regulation.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {regulation.framework}
                      </span>
                      {regulation.article && (
                        <span className="text-sm text-gray-500">Article {regulation.article}</span>
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">
                      {regulation.name}
                    </h3>
                    {regulation.description && (
                      <p className="mt-2 text-sm text-gray-600">{regulation.description}</p>
                    )}
                    <p className="mt-3 text-xs text-gray-500">
                      Updated: {new Date(regulation.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingRegulation(regulation)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(regulation.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRegulation) && (
        <RegulationModal
          regulation={editingRegulation}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRegulation(null);
          }}
          onSave={async () => {
            await loadRegulations();
            setShowCreateModal(false);
            setEditingRegulation(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function RegulationModal({
  regulation,
  onClose,
  onSave,
}: {
  regulation: Regulation | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    framework: regulation?.framework || '',
    article: regulation?.article || '',
    name: regulation?.name || '',
    description: regulation?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.framework.trim()) {
        setError('Framework is required');
        setLoading(false);
        return;
      }

      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      let result;
      if (regulation) {
        result = await api.patch(`/api/governance/regulations/${regulation.id}`, formData);
      } else {
        result = await api.post('/api/governance/regulations', formData);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save regulation');
      }
    } catch (err) {
      setError('Failed to save regulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {regulation ? 'Edit Regulation' : 'Create Regulation'}
          </h3>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Framework *</label>
              <input
                type="text"
                required
                value={formData.framework}
                onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                placeholder="e.g., NIS2, GDPR, ISO27001, SOC2"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Article</label>
              <input
                type="text"
                value={formData.article}
                onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                placeholder="e.g., Article 21"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

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
                {loading ? 'Saving...' : regulation ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
