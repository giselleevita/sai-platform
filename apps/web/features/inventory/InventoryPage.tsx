'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import { hasAuthSession, getCsrfToken } from '@/lib/auth';
import type { Tool } from '@/types';
import { AppLayout } from '@/components/shared';

export default function InventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filterRisk, setFilterRisk] = useState('All');
  const [sortBy, setSortBy] = useState('riskScore');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const loadTools = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      if (!hasAuthSession()) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(sortBy && { sortBy }),
        ...(filterRisk !== 'All' && { riskLevel: filterRisk }),
      });

      const result = await api.get<{ data: Tool[]; pagination: any }>(`/api/inventory?${params}`);

      if (!result.success) {
        if (result.error?.includes('401') || result.error?.includes('unauthorized')) {
          router.push('/auth/login');
          return;
        }
        throw new Error(result.error || 'Failed to load tools');
      }

      // The API returns either a flat array (`data: Tool[]`) or a paginated
      // envelope (`data: { data: Tool[], pagination }`). Support both.
      const payload: any = result.data;
      const list: Tool[] = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setTools(list);
      setPagination((prev) => ({
        ...prev,
        total: payload?.pagination?.total ?? list.length,
        totalPages: payload?.pagination?.totalPages ?? 1,
      }));
    } catch (err: any) {
      setError(err?.message || 'Failed to load tools. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTools(1);
  }, [router, searchQuery, sortBy, filterRisk]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadTools(1);
  };

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

  const filteredAndSortedTools = tools;
  const hasActiveFilters = searchQuery.trim().length > 0 || filterRisk !== 'All';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">AI Tools Inventory</h1>
            <div className="flex gap-4">
              <Link
                href="/inventory/import"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Import
              </Link>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const csrfToken = getCsrfToken();
                    const response = await fetch(`/api/import-export/tools/excel`, {
                      credentials: 'include',
                      headers: {
                        'X-CSRF-Token': csrfToken || '',
                      },
                    });
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `tools-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      setError('Failed to export Excel');
                    }
                  } catch (err) {
                    setError('Failed to export Excel');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Export Excel
              </button>
              <Link
                href="/inventory/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Tool
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                onClick={() => void loadTools(pagination.page)}
                className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 bg-white rounded-lg shadow p-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Tools</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, vendor, or description..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Search
              </button>
            </div>
          </form>

          <div className="flex gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Risk</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option>All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2">
                <option value="riskScore">Risk Score (High to Low)</option>
                <option value="name">Name (A to Z)</option>
                <option value="users">Users (High to Low)</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {tools.length} of {pagination.total} tools
              {pagination.totalPages > 1 && ` (Page ${pagination.page} of ${pagination.totalPages})`}
            </div>
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
            <button
              onClick={() => void loadTools(pagination.page - 1)}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => void loadTools(pagination.page + 1)}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading tools...</p>
          </div>
        ) : filteredAndSortedTools.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">
              {hasActiveFilters ? 'No tools match the current filters' : 'No tools in inventory yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {hasActiveFilters
                ? `Try changing search or risk filter (current risk filter: ${filterRisk}).`
                : 'Add your first tool or import existing records to start risk tracking.'}
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {hasActiveFilters ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRisk('All');
                    setSortBy('riskScore');
                  }}
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reset filters
                </button>
              ) : (
                <>
                  <Link
                    href="/inventory/add"
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add your first tool
                  </Link>
                  <Link
                    href="/inventory/import"
                    className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Import tools
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/inventory/${tool.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 break-words">{tool.name}</h3>
                    <span
                      className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(
                        tool.riskLevel
                      )} whitespace-nowrap`}
                    >
                      {tool.riskLevel}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    {tool.vendor && <span>{tool.vendor} • </span>}
                    {tool.category}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">
                        Risk Score:
                        <span
                          className="ml-1 text-xs text-gray-400 cursor-help"
                          title="Risk Score Calculation: Data Type Risk (avg) + User Count Risk (up to 20) + Frequency Risk (Daily=10, Weekly=5, Rarely=2) - Control Mitigation (-2 per control). Levels: Critical (>75), High (50-75), Medium (25-50), Low (<25)"
                        >
                          ⓘ
                        </span>
                      </span>
                      <span className="font-semibold text-gray-900">{tool.riskScore}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Users:</span>
                      <span className="font-semibold text-gray-900">{tool.users}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-semibold text-gray-900">{tool.frequency}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Data Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {tool.dataTypes.slice(0, 3).map((type) => (
                        <span key={type} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {type}
                        </span>
                      ))}
                      {tool.dataTypes.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{tool.dataTypes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Controls:</p>
                    <div className="flex flex-wrap gap-1">
                      {tool.controls.slice(0, 2).map((control) => (
                        <span key={control} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {control}
                        </span>
                      ))}
                      {tool.controls.length > 2 && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          +{tool.controls.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {tool.hasDPA && (
                    <div className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">✓ DPA Signed</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

