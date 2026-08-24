'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { redirectToLoginIfNoSession } from '@/lib/auth';
import {
  AppLayout,
  DataTable,
  EmptyState,
  FormField,
  LoadingSpinner,
  MetricTile,
  Modal,
  PageHeader,
  PermissionGate,
  StatusBadge,
  fieldClassName,
  type DataTableColumn,
} from '@/components/shared';
import { useCurrentUser } from '@/hooks';

interface Control {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED' | 'DEPRECATED';
  policyId?: string;
  ownerId?: string;
  approverId?: string;
  reviewerId?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUSES = ['All', 'DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'RETIRED', 'DEPRECATED'];
const CONTROL_STATUSES = ['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'RETIRED', 'DEPRECATED'] as const;

export default function ControlsPage() {
  const router = useRouter();
  const { canCreate, canApprove, canDelete, isReadOnly } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<Control[]>([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingControl, setEditingControl] = useState<Control | null>(null);
  const [creating, setCreating] = useState(false);

  const loadControls = async () => {
    try {
      setLoading(true);
      setError('');
      if (redirectToLoginIfNoSession(router)) return;
      const result = await api.get<Control[]>('/api/governance/controls');
      if (!result.success) throw new Error(result.error || 'Failed to load controls');
      setControls(api.unwrapRows(result.data));
    } catch (err: any) {
      setError(err?.message || 'Failed to load controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadControls();
  }, []);

  const updateStatus = async (control: Control, status: Control['status']) => {
    const result = await api.patch(`/api/governance/controls/${control.id}`, { status });
    if (!result.success) {
      setError(result.error || 'Failed to update control status');
      return;
    }
    await loadControls();
  };

  const deleteControl = async (control: Control) => {
    if (!confirm(`Delete control "${control.name}"?`)) return;
    const result = await api.delete(`/api/governance/controls/${control.id}`);
    if (!result.success) {
      setError(result.error || 'Failed to delete control');
      return;
    }
    await loadControls();
  };

  const filteredControls = statusFilter === 'All' ? controls : controls.filter((control) => control.status === statusFilter);
  const metrics = useMemo(
    () => ({
      active: controls.filter((control) => control.status === 'ACTIVE').length,
      review: controls.filter((control) => control.status === 'UNDER_REVIEW').length,
      draft: controls.filter((control) => control.status === 'DRAFT').length,
    }),
    [controls],
  );

  const columns: DataTableColumn<Control>[] = [
    {
      key: 'name',
      header: 'Control',
      render: (control) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{control.name}</div>
          <div className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{control.description || 'No description'}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (control) => <StatusBadge value={control.status} /> },
    { key: 'owner', header: 'Owner', render: (control) => control.ownerId || 'Unassigned' },
    { key: 'updated', header: 'Updated', render: (control) => new Date(control.updatedAt).toLocaleDateString() },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (control) => (
        <div className="flex flex-wrap justify-end gap-2 text-xs font-semibold">
          {control.status === 'DRAFT' && canCreate ? (
            <button onClick={() => void updateStatus(control, 'UNDER_REVIEW')} className="text-amber-700 hover:underline">
              Submit
            </button>
          ) : null}
          {control.status === 'UNDER_REVIEW' && canApprove ? (
            <button onClick={() => void updateStatus(control, 'ACTIVE')} className="text-green-700 hover:underline">
              Approve
            </button>
          ) : null}
          {control.status === 'ACTIVE' && canApprove ? (
            <button onClick={() => void updateStatus(control, 'RETIRED')} className="text-red-700 hover:underline">
              Retire
            </button>
          ) : null}
          {!isReadOnly ? (
            <button onClick={() => setEditingControl(control)} className="text-blue-700 hover:underline">
              Edit
            </button>
          ) : (
            <span className="text-gray-500">Read only</span>
          )}
          {canDelete ? (
            <button onClick={() => void deleteControl(control)} className="text-red-700 hover:underline">
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  if (loading && controls.length === 0) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Controls"
        subtitle="Control registry with ownership, lifecycle state, and approval traceability."
        right={
          <PermissionGate allowed={canCreate}>
            <button onClick={() => setCreating(true)} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              Create control
            </button>
          </PermissionGate>
        }
      />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <ErrorBanner message={error} onRetry={loadControls} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile title="Total Controls" value={controls.length} hint="Tenant control registry" />
          <MetricTile title="Active" value={metrics.active} hint="Approved and enforceable" />
          <MetricTile title="Under Review" value={metrics.review} hint="Awaiting management sign-off" />
          <MetricTile title="Draft" value={metrics.draft} hint="Not enforceable yet" />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={[
                'rounded-md border px-3 py-2 text-sm font-semibold',
                statusFilter === status
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
              ].join(' ')}
            >
              {status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
        <DataTable
          columns={columns}
          rows={filteredControls}
          empty={
            <EmptyState
              title="No controls found"
              message="Create controls to define expected organizational behavior and evidence requirements."
              action={
                canCreate ? (
                  <button onClick={() => setCreating(true)} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                    Create first control
                  </button>
                ) : null
              }
            />
          }
        />
      </div>
      <ControlModal
        open={creating || Boolean(editingControl)}
        control={editingControl}
        onClose={() => {
          setCreating(false);
          setEditingControl(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditingControl(null);
          await loadControls();
        }}
      />
    </AppLayout>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        <button onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      </div>
    </div>
  );
}

function ControlModal(props: {
  open: boolean;
  control: Control | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    name: props.control?.name || '',
    description: props.control?.description || '',
    status: props.control?.status || 'DRAFT',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      name: props.control?.name || '',
      description: props.control?.description || '',
      status: props.control?.status || 'DRAFT',
    });
  }, [props.control, props.open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...formData, name: formData.name.trim(), description: formData.description.trim() || undefined };
    const result = props.control
      ? await api.patch(`/api/governance/controls/${props.control.id}`, payload)
      : await api.post('/api/governance/controls', payload);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Failed to save control');
      return;
    }
    props.onSaved();
  };

  return (
    <Modal open={props.open} title={props.control ? 'Edit control' : 'Create control'} onClose={props.onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <FormField label="Name" htmlFor="control-name" required>
          <input id="control-name" className={fieldClassName} value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
        </FormField>
        <FormField label="Description" htmlFor="control-description">
          <textarea id="control-description" className={fieldClassName} rows={4} value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
        </FormField>
        <FormField label="Lifecycle status" htmlFor="control-status">
          <select
            id="control-status"
            className={fieldClassName}
            value={formData.status}
            onChange={(event) =>
              setFormData({ ...formData, status: event.target.value as Control['status'] })
            }
          >
            {CONTROL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
            Cancel
          </button>
          <button disabled={saving} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving...' : 'Save control'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
