'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/shared';
import { api } from '@/lib/api';
import { hasAuthSession } from '@/lib/auth';

const CATEGORIES = [
  'LLM',
  'CodeGen',
  'RPA',
  'Analytics',
  'ImageGen',
  'VoiceGen',
  'Other',
];

const DATA_TYPES = ['PII', 'Financial', 'IP', 'Proprietary', 'Public'];

const FREQUENCIES = ['Daily', 'Weekly', 'Rarely'];

const CONTROLS = [
  'MFA',
  'Encryption',
  'DLP',
  'AuditLog',
  'DataResidency',
  'ContractReview',
];

export default function AddToolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'LLM',
    vendor: '',
    description: '',
    url: '',
    dataTypes: [] as string[],
    users: 1,
    frequency: 'Weekly',
    controls: [] as string[],
    hasDPA: false,
    dataResidency: '',
    notes: '',
    customFields: {} as Record<string, any>,
  });
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDataTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(type)
        ? prev.dataTypes.filter((t) => t !== type)
        : [...prev.dataTypes, type],
    }));
  };

  const handleControlToggle = (control: string) => {
    setFormData((prev) => ({
      ...prev,
      controls: prev.controls.includes(control)
        ? prev.controls.filter((c) => c !== control)
        : [...prev.controls, control],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!hasAuthSession()) {
        router.push('/auth/login');
        return;
      }

      if (!formData.name || !formData.category) {
        setError('Name and category are required');
        setLoading(false);
        return;
      }

      if (formData.dataTypes.length === 0) {
        setError('Please select at least one data type');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        customFields: Object.keys(formData.customFields).length > 0 ? formData.customFields : undefined,
      };

      const result = await api.post('/api/inventory', payload);

      if (!result.success) {
        setError(result.error || 'Failed to add tool');
        setLoading(false);
        return;
      }

      router.push('/inventory');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/inventory" className="text-blue-600 hover:text-blue-900">
            ← Back to Inventory
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Add AI Tool</h1>
          <p className="mt-2 text-gray-600">
            Add a new AI tool to track its security and compliance posture
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Tool Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., ChatGPT, Claude, Copilot"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
                    Vendor
                  </label>
                  <input
                    id="vendor"
                    name="vendor"
                    type="text"
                    value={formData.vendor}
                    onChange={handleInputChange}
                    placeholder="e.g., OpenAI, Anthropic"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What is this tool used for?"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data & Usage</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Data Types Processed *
                </label>
                <div className="space-y-2">
                  {DATA_TYPES.map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        id={`dataType-${type}`}
                        type="checkbox"
                        checked={formData.dataTypes.includes(type)}
                        onChange={() => handleDataTypeToggle(type)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`dataType-${type}`} className="ml-2 text-sm text-gray-700">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="users" className="block text-sm font-medium text-gray-700">
                    Number of Users
                  </label>
                  <input
                    id="users"
                    name="users"
                    type="number"
                    min="1"
                    value={formData.users}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                    Usage Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    {FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Controls</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Controls in Place
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CONTROLS.map((control) => (
                    <div key={control} className="flex items-center">
                      <input
                        id={`control-${control}`}
                        type="checkbox"
                        checked={formData.controls.includes(control)}
                        onChange={() => handleControlToggle(control)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`control-${control}`} className="ml-2 text-sm text-gray-700">
                        {control}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="dataResidency" className="block text-sm font-medium text-gray-700">
                    Data Residency
                  </label>
                  <input
                    id="dataResidency"
                    name="dataResidency"
                    type="text"
                    value={formData.dataResidency}
                    onChange={handleInputChange}
                    placeholder="e.g., EU, US, Multi-region"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center h-10">
                    <input
                      id="hasDPA"
                      name="hasDPA"
                      type="checkbox"
                      checked={formData.hasDPA}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="hasDPA" className="ml-2 text-sm text-gray-700">
                      Data Processing Agreement (DPA) signed
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional context or concerns?"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add custom key-value pairs to store additional metadata for this tool.
              </p>

              {Object.keys(formData.customFields).length > 0 && (
                <div className="mb-4 space-y-2">
                  {Object.entries(formData.customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="ml-2 text-gray-600">{String(value)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newFields = { ...formData.customFields };
                          delete newFields[key];
                          setFormData((prev) => ({ ...prev, customFields: newFields }));
                        }}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFieldKey}
                  onChange={(e) => setCustomFieldKey(e.target.value)}
                  placeholder="Field name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  placeholder="Field value"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customFieldKey && customFieldValue) {
                      setFormData((prev) => ({
                        ...prev,
                        customFields: {
                          ...prev.customFields,
                          [customFieldKey]: customFieldValue,
                        },
                      }));
                      setCustomFieldKey('');
                      setCustomFieldValue('');
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-4 justify-end border-t pt-6">
              <Link
                href="/inventory"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding Tool...' : 'Add Tool'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

