'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import type { Tool, RiskSummary } from '@/types';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [error, setError] = useState('');

  // Keyboard shortcuts
  useKeyboardShortcuts(commonShortcuts(router));

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check for CSRF token (cookies are checked by server)
        const csrfToken = localStorage.getItem('csrf-token');
        if (!csrfToken) {
          // Fallback: check for legacy token
          const legacyToken = localStorage.getItem('token');
          if (!legacyToken) {
            router.push('/auth/login');
            return;
          }
        }

        // Check if onboarding is needed
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted && tools.length === 0) {
          // Don't redirect immediately, let user see dashboard first
        }

        // Fetch tools (limited for dashboard)
        const toolsResult = await api.get<{ data: Tool[]; pagination: any }>('/api/inventory?limit=10');
        
        if (!toolsResult.success) {
          if (toolsResult.error?.includes('401') || toolsResult.error?.includes('unauthorized')) {
            router.push('/auth/login');
            return;
          }
          throw new Error(toolsResult.error || 'Failed to load tools. Please check your connection.');
        }

        setTools(toolsResult.data?.data || []);

        // Fetch summary
        const summaryResult = await api.get<RiskSummary>('/api/inventory/summary');
        
        if (summaryResult.success) {
          setSummary(summaryResult.data || null);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check for onboarding
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (!onboardingCompleted && !loading && tools.length === 0) {
      // Show onboarding prompt
      const shouldShow = confirm('Welcome! Would you like to take a quick tour of the platform?');
      if (shouldShow) {
        router.push('/onboarding');
      } else {
        localStorage.setItem('onboarding_completed', 'true');
      }
    }
  }, [loading, tools.length, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">SAI Dashboard</h1>
            {!localStorage.getItem('onboarding_completed') && (
              <Link
                href="/onboarding"
                className="text-sm text-blue-600 hover:text-blue-900 font-medium"
              >
                Take Tour →
              </Link>
            )}
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

        {/* Risk Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Tools</dt>
                <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                  {summary.totalTools}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-red-500 truncate">Critical Risk</dt>
                <dd className="mt-1 text-3xl font-extrabold text-red-600">
                  {summary.riskCounts.critical}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-orange-500 truncate">High Risk</dt>
                <dd className="mt-1 text-3xl font-extrabold text-orange-600">
                  {summary.riskCounts.high}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-yellow-500 truncate">Medium Risk</dt>
                <dd className="mt-1 text-3xl font-extrabold text-yellow-600">
                  {summary.riskCounts.medium}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Risk Score</dt>
                <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                  {summary.averageRiskScore}
                </dd>
              </div>
            </div>
          </div>
        )}

        {/* Tools Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">AI Tools Inventory</h2>
            <Link
              href="/inventory/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Tool
            </Link>
          </div>

          {tools.length === 0 ? (
            <div className="px-4 py-12 sm:px-6 text-center">
              <p className="text-gray-500">No AI tools added yet.</p>
              <Link
                href="/inventory/add"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:text-blue-700"
              >
                Add your first tool
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Types
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tools.map((tool) => (
                    <tr key={tool.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tool.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tool.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tool.users}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(
                            tool.riskLevel
                          )}`}
                        >
                          {tool.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tool.riskScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tool.dataTypes.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/inventory/${tool.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <Link
                href="/activity"
                className="text-sm text-blue-600 hover:text-blue-900 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">
                View all recent changes and updates in the{' '}
                <Link href="/activity" className="text-blue-600 hover:text-blue-900 font-medium">
                  Activity Feed
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
