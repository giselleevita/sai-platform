'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/shared';
import { api } from '@/lib/api';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  isActive: boolean;
}

const AVAILABLE_EVENTS = [
  'tool.created',
  'tool.updated',
  'tool.deleted',
  'risk.created',
  'risk.updated',
  'incident.created',
  'incident.updated',
  'comment.created',
];

export default function WebhooksPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    secret: '',
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const result = await api.get<{ data: Webhook[] }>('/api/webhooks');
      if (result.success && result.data) {
        setWebhooks(result.data.data || []);
      } else {
        setError(result.error || 'Failed to load webhooks');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    if (!formData.url || formData.events.length === 0 || !formData.secret) {
      setError('URL, events, and secret are required');
      setCreating(false);
      return;
    }

    if (formData.secret.length < 16) {
      setError('Secret must be at least 16 characters');
      setCreating(false);
      return;
    }

    try {
      const result = await api.post('/api/webhooks', formData);
      if (result.success) {
        setShowCreateForm(false);
        setFormData({ url: '', events: [], secret: '' });
        loadWebhooks();
      } else {
        setError(result.error || 'Failed to create webhook');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    setDeleting(id);
    try {
      const result = await api.delete(`/api/webhooks/${id}`);
      if (result.success) {
        loadWebhooks();
      } else {
        setError(result.error || 'Failed to delete webhook');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete webhook');
    } finally {
      setDeleting(null);
    }
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, secret }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading webhooks...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage webhooks to receive real-time notifications about platform events
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? 'Cancel' : '+ Create Webhook'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Create New Webhook</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events * (Select at least one)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event}
                      className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret * (Minimum 16 characters)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.secret}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secret: e.target.value }))}
                    placeholder="Enter secret or generate one"
                    minLength={16}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSecret}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Generate
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This secret will be used to verify webhook authenticity via HMAC signature
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ url: '', events: [], secret: '' });
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {webhooks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No webhooks configured</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Webhook
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {webhooks.map((webhook) => (
                    <tr key={webhook.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{webhook.url}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(webhook.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            webhook.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          disabled={deleting === webhook.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === webhook.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How Webhooks Work</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Webhooks send HTTP POST requests to your URL when events occur</li>
            <li>Each request includes an HMAC signature in the X-Webhook-Signature header</li>
            <li>Verify the signature using your secret to ensure authenticity</li>
            <li>Webhooks are retried up to 3 times if your endpoint returns an error</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
