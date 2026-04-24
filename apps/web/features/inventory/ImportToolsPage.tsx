'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/shared';
import { api } from '@/lib/api';
import { getCsrfToken, redirectToLoginIfNoSession } from '@/lib/auth';

export default function ImportToolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (redirectToLoginIfNoSession(router)) return;
      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/import-export/tools`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import tools');
        setLoading(false);
        return;
      }

      setResult(data.data);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to import tools');
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Import Tools</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Excel or CSV File</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">File Format</h3>
            <p className="text-sm text-blue-800 mb-2">
              Your Excel/CSV file should include the following columns:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Name</strong> (required) - Tool name</li>
              <li><strong>Category</strong> (required) - LLM, CodeGen, RPA, etc.</li>
              <li><strong>Vendor</strong> (optional) - Vendor name</li>
              <li><strong>Description</strong> (optional)</li>
              <li><strong>Data Types</strong> - Comma-separated: PII, Financial, IP, etc.</li>
              <li><strong>Users</strong> - Number of users</li>
              <li><strong>Frequency</strong> - Daily, Weekly, or Rarely</li>
              <li><strong>Has DPA</strong> - Yes or No</li>
              <li><strong>Data Residency</strong> (optional)</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Importing tools...</p>
            </div>
          )}

          {result && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-2">Import Complete</h3>
              <p className="text-sm text-green-800">
                <strong>{result.imported}</strong> tools imported successfully
                {result.failed > 0 && (
                  <span className="ml-2">
                    • <strong>{result.failed}</strong> failed
                  </span>
                )}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-900 mb-1">Errors:</p>
                  <ul className="text-xs text-green-800 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => router.push('/inventory')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                View Inventory
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

