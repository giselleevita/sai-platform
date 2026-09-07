'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout, ErrorAlert, LoadingSpinner, PageHeader } from '@/components/shared';
import { api } from '@/lib/api';

type Actor = { id: string; name: string; email: string };

type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actorId: string | null;
  actor: Actor | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
};

type Facets = {
  actions: string[];
  targetTypes: string[];
  actors: Actor[];
};

type Filters = {
  action: string;
  targetType: string;
  actorId: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = { action: '', targetType: '', actorId: '', from: '', to: '' };

const PAGE_SIZE = 50;

function buildQuery(filters: Filters, cursor: string | null): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set('limit', String(PAGE_SIZE));
  if (cursor) params.set('cursor', cursor);
  return params.toString();
}

function describeChanges(changes: Record<string, unknown> | null): string {
  if (!changes || Object.keys(changes).length === 0) return '';
  return Object.entries(changes)
    .map(([field, value]) => {
      if (value && typeof value === 'object' && 'from' in (value as object) && 'to' in (value as object)) {
        const change = value as { from: unknown; to: unknown };
        return `${field}: ${String(change.from)} to ${String(change.to)}`;
      }
      return `${field}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`;
    })
    .join(', ');
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [facets, setFacets] = useState<Facets>({ actions: [], targetTypes: [], actors: [] });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => Object.values(filters).some((value) => value !== ''),
    [filters],
  );

  const load = useCallback(async (next: Filters) => {
    setLoading(true);
    setError('');
    const res = await api.get<AuditEntry[]>(`/api/audit?${buildQuery(next, null)}`);
    if (!res.success) {
      setError(res.error || 'Failed to load the audit trail');
      setEntries([]);
      setCursor(null);
      setLoading(false);
      return;
    }
    setEntries(Array.isArray(res.data) ? res.data : []);
    setCursor((res.meta?.nextCursor as string | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await api.get<Facets>('/api/audit/facets');
      if (res.success && res.data) setFacets(res.data);
    })();
  }, []);

  useEffect(() => {
    void load(EMPTY_FILTERS);
  }, [load]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const res = await api.get<AuditEntry[]>(`/api/audit?${buildQuery(filters, cursor)}`);
    setLoadingMore(false);
    if (!res.success) {
      setError(res.error || 'Failed to load more of the audit trail');
      return;
    }
    setEntries((current) => [...current, ...(Array.isArray(res.data) ? res.data : [])]);
    setCursor((res.meta?.nextCursor as string | null) ?? null);
  };

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    void load(next);
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    void load(EMPTY_FILTERS);
  };

  const selectClass =
    'mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100';

  return (
    <AppLayout>
      <PageHeader
        title="Audit trail"
        subtitle="Every governance change, who made it, and what it changed. Append only."
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Action
            <select
              value={filters.action}
              onChange={(e) => update({ action: e.target.value })}
              className={selectClass}
            >
              <option value="">All actions</option>
              {facets.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Record type
            <select
              value={filters.targetType}
              onChange={(e) => update({ targetType: e.target.value })}
              className={selectClass}
            >
              <option value="">All records</option>
              {facets.targetTypes.map((targetType) => (
                <option key={targetType} value={targetType}>
                  {targetType}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Person
            <select
              value={filters.actorId}
              onChange={(e) => update({ actorId: e.target.value })}
              className={selectClass}
            >
              <option value="">Anyone</option>
              {facets.actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name || actor.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => update({ from: e.target.value })}
              className={selectClass}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => update({ to: e.target.value })}
              className={selectClass}
            />
          </label>
        </div>
        {filtered ? (
          <button
            onClick={reset}
            className="mt-3 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {filtered
            ? 'Nothing in the trail matches those filters.'
            : 'Nothing has been recorded yet. Changes appear here as they are made.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">When</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Who</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Record</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">What changed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {entries.map((entry) => {
                  const summary = describeChanges(entry.changes);
                  const isOpen = expanded === entry.id;
                  return (
                    <tr key={entry.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {entry.actor ? (
                          <span title={entry.actor.email}>{entry.actor.name || entry.actor.email}</span>
                        ) : (
                          // A null actor is the system acting, not a gap in
                          // the record, so say which it is.
                          <span className="text-gray-500 dark:text-gray-400">system</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{entry.action}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {entry.targetType}
                        {entry.targetId ? (
                          <span className="ml-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {entry.targetId.slice(-8)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {summary ? (
                          <>
                            <span className={isOpen ? '' : 'line-clamp-1'}>{summary}</span>
                            <button
                              onClick={() => setExpanded(isOpen ? null : entry.id)}
                              className="mt-1 block text-xs font-medium text-gray-500 underline dark:text-gray-400"
                            >
                              {isOpen ? 'Hide detail' : 'Show detail'}
                            </button>
                            {isOpen ? (
                              <pre className="mt-2 max-w-xl overflow-x-auto rounded bg-gray-50 dark:bg-gray-950 p-2 text-xs text-gray-700 dark:text-gray-300">
                                {JSON.stringify(entry.changes, null, 2)}
                              </pre>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">no detail recorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4">
            {cursor ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load older entries'}
              </button>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} shown
              {cursor ? ', more available' : ', this is the end of the trail'}.
            </p>
          </div>
        </>
      )}
    </AppLayout>
  );
}
