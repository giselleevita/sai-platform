'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppLayout } from '@/components/shared';

interface Procedure {
  id: string;
  name: string;
  controlId: string;
  steps?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface Control {
  id: string;
  name: string;
}

export default function ProceduresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

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

      const [proceduresResult, controlsResult] = await Promise.all([
        api.get<Procedure[]>('/api/governance/procedures'),
        api.get<Control[]>('/api/governance/controls'),
      ]);

      if (proceduresResult.success && proceduresResult.data) {
        setProcedures(proceduresResult.data);
      } else {
        setError(proceduresResult.error || 'Failed to load procedures');
      }

      if (controlsResult.success && controlsResult.data) {
        setControls(controlsResult.data);
      }
    } catch (err) {
      setError((err as any).message || 'Failed to load procedures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this procedure?')) return;

    try {
      const result = await api.delete(`/api/governance/procedures/${id}`);
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || 'Failed to delete procedure');
      }
    } catch (err) {
      alert('Failed to delete procedure');
    }
  };

  const getControlName = (controlId: string) => {
    const control = controls.find((c) => c.id === controlId);
    return control?.name || controlId;
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Procedures</h1>
              <p className="mt-1 text-sm text-gray-600">
                Document how controls are executed and reviewed
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Procedure
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

        {/* Procedures List */}
        {procedures.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No procedures found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              Create your first procedure
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {procedures.map((procedure) => (
              <div
                key={procedure.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{procedure.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Control: {getControlName(procedure.controlId)}
                    </p>
                    {procedure.steps && (
                      <div className="mt-3 text-sm text-gray-700">
                        <p className="font-medium mb-1">Steps:</p>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(procedure.steps, null, 2)}
                        </pre>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Updated: {new Date(procedure.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingProcedure(procedure)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(procedure.id)}
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
      {(showCreateModal || editingProcedure) && (
        <ProcedureModal
          procedure={editingProcedure}
          controls={controls}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProcedure(null);
          }}
          onSave={async () => {
            await loadData();
            setShowCreateModal(false);
            setEditingProcedure(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function ProcedureModal({
  procedure,
  controls,
  onClose,
  onSave,
}: {
  procedure: Procedure | null;
  controls: Control[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: procedure?.name || '',
    controlId: procedure?.controlId || '',
    steps: procedure?.steps ? JSON.stringify(procedure.steps, null, 2) : '',
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

      if (!formData.controlId) {
        setError('Control is required');
        setLoading(false);
        return;
      }

      let stepsObj: Record<string, unknown> | undefined;
      if (formData.steps.trim()) {
        try {
          stepsObj = JSON.parse(formData.steps);
        } catch {
          setError('Steps must be valid JSON');
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        controlId: formData.controlId,
        steps: stepsObj,
      };

      let result;
      if (procedure) {
        result = await api.patch(`/api/governance/procedures/${procedure.id}`, payload);
      } else {
        result = await api.post('/api/governance/procedures', payload);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Failed to save procedure');
      }
    } catch (err) {
      setError('Failed to save procedure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {procedure ? 'Edit Procedure' : 'Create Procedure'}
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
              <label className="block text-sm font-medium text-gray-700">Steps (JSON)</label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                rows={6}
                placeholder='{"step1": "Description", "step2": "Description"}'
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 font-mono text-xs"
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
                {loading ? 'Saving...' : procedure ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
