'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/shared';
import { api } from '@/lib/api';
import { getCsrfToken, redirectToLoginIfNoSession } from '@/lib/auth';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customSections, setCustomSections] = useState<string[]>([]);

  useEffect(() => {
    redirectToLoginIfNoSession(router);
  }, [router]);

  const handleGenerateRiskReport = async (format: 'pdf' | 'json' = 'pdf') => {
    setLoading(true);
    setError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      if (format === 'pdf') {
        const response = await fetch(`${API_URL}/api/reports/risk-assessment?format=pdf&charts=true`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
          setError(errorData.error || 'Failed to generate PDF report');
          setLoading(false);
          return;
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `risk-assessment-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await api.get('/api/reports/risk-assessment?format=json');
        if (result.success && result.data) {
          const dataStr = JSON.stringify(result.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `risk-assessment-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          setError(result.error || 'Failed to generate report');
        }
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err?.message || 'Failed to generate report. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComplianceReport = async (format: 'pdf' | 'json' = 'pdf') => {
    setLoading(true);
    setError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      if (format === 'pdf') {
        const response = await fetch(`${API_URL}/api/reports/compliance?format=pdf&charts=true`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
          setError(errorData.error || 'Failed to generate PDF report');
          setLoading(false);
          return;
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await api.get('/api/reports/compliance?format=json');
        if (result.success && result.data) {
          const dataStr = JSON.stringify(result.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          setError(result.error || 'Failed to generate report');
        }
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err?.message || 'Failed to generate report. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExecutiveSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/api/reports/executive-summary?format=pdf&charts=true`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
        setError(errorData.error || 'Failed to generate executive summary');
        setLoading(false);
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `executive-summary-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err?.message || 'Failed to generate executive summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventory = async (format: 'csv' | 'excel' = 'csv') => {
    setLoading(true);
    setError('');
    try {
      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        router.push('/auth/login');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      if (format === 'excel') {
        const response = await fetch(`${API_URL}/api/import-export/tools/excel`, {
          credentials: 'include',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to export' }));
          setError(errorData.error || 'Failed to export inventory');
          setLoading(false);
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // CSV export
        const response = await fetch(`${API_URL}/api/inventory/export/csv`, {
          credentials: 'include',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to export' }));
          setError(errorData.error || 'Failed to export inventory');
          setLoading(false);
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to export inventory');
      setLoading(false);
    }
  };

  const handleDownloadAuditPackage = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get<unknown>('/api/reports/audit-package');
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to build audit package');
        return;
      }
      const dataStr = JSON.stringify(result.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-package-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to download audit package');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAuditorZip = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports/auditor-zip', { credentials: 'include' });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || `Failed to download ZIP (${response.status})`);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sai-auditor-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to download ZIP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Reports</h2>
          <p className="text-gray-600 mb-6">
            Create and export reports on your AI tool inventory, risk assessments, and compliance status.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Risk Assessment Report */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Assessment Report</h3>
              <p className="text-gray-600 text-sm mb-4">
                Comprehensive risk analysis with trend analysis and gap identification.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateRiskReport('pdf')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'PDF'}
                </button>
                <button
                  onClick={() => handleGenerateRiskReport('json')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Compliance Report */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Report</h3>
              <p className="text-gray-600 text-sm mb-4">
                Compliance status with gap analysis across GDPR, NIS2, and other frameworks.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateComplianceReport('pdf')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'PDF'}
                </button>
                <button
                  onClick={() => handleGenerateComplianceReport('json')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h3>
              <p className="text-gray-600 text-sm mb-4">
                High-level overview with key metrics, trends, and recommendations.
              </p>
              <button
                onClick={handleGenerateExecutiveSummary}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            {/* Audit package (JSON manifest) */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit package</h3>
              <p className="text-gray-600 text-sm mb-4">
                Evidence, controls, snapshots, and recent audit log as one JSON bundle for auditors.
              </p>
              <button
                onClick={handleDownloadAuditPackage}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Preparing...' : 'Download JSON'}
              </button>
            </div>

            {/* Auditor ZIP */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auditor ZIP</h3>
              <p className="text-gray-600 text-sm mb-4">
                Unified export containing the audit package, governance manifest, and optional attachments.
              </p>
              <button
                onClick={handleDownloadAuditorZip}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Preparing...' : 'Download ZIP'}
              </button>
            </div>

            {/* Custom Report Builder */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Report Builder</h3>
              <p className="text-gray-600 text-sm mb-4">
                Build a custom report with selected sections and filters.
              </p>
              <button
                onClick={() => setShowCustomBuilder(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Open Builder
              </button>
            </div>

            {/* Inventory Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Export</h3>
              <p className="text-gray-600 text-sm mb-4">
                Export your complete AI tool inventory as CSV or Excel.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportInventory('csv')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportInventory('excel')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {/* Custom Report Builder Modal */}
          {showCustomBuilder && (
            <CustomReportBuilder
              onClose={() => setShowCustomBuilder(false)}
              onGenerate={async (options) => {
                setLoading(true);
                setError('');
                try {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                  const csrf = getCsrfToken();
                  const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                  };
                  if (csrf) headers['X-CSRF-Token'] = csrf;
                  const response = await fetch(`${API_URL}/api/reports/custom?format=pdf`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify(options),
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
                    setError(errorData.error || 'Failed to generate custom report');
                    setLoading(false);
                    return;
                  }
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `custom-report-${new Date().toISOString().split('T')[0]}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  setShowCustomBuilder(false);
                } catch (err: any) {
                  setError(err?.message || 'Failed to generate custom report');
                } finally {
                  setLoading(false);
                }
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function CustomReportBuilder({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (options: any) => void;
}) {
  const [sections, setSections] = useState<string[]>(['risk-assessment', 'compliance']);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const availableSections = [
    { id: 'risk-assessment', label: 'Risk Assessment', description: 'AI tools risk analysis' },
    { id: 'compliance', label: 'Compliance', description: 'Compliance status and gaps' },
    { id: 'executive-summary', label: 'Executive Summary', description: 'Key metrics and recommendations' },
  ];

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Report Builder</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Sections</label>
            <div className="space-y-2">
              {availableSections.map((section) => (
                <label key={section.id} className="flex items-start p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sections.includes(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{section.label}</div>
                    <div className="text-xs text-gray-500">{section.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include charts and graphs</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onGenerate({ sections, includeCharts, dateRange: dateRange.start && dateRange.end ? dateRange : undefined })}
              disabled={sections.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
