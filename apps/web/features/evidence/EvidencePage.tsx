'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getCsrfToken, redirectToLoginIfNoSession } from '@/lib/auth';
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

interface Evidence {
  id: string;
  controlId: string;
  control?: { id: string; name: string };
  source: string;
  status: 'PENDING' | 'REJECTED' | 'MISSING' | 'SUBMITTED' | 'APPROVED' | 'EXPIRED';
  validFrom?: string;
  validTo?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

interface Control {
  id: string;
  name: string;
}

type EvidenceAttachment = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
};

const STATUSES = ['All', 'MISSING', 'SUBMITTED', 'APPROVED', 'EXPIRED', 'PENDING', 'REJECTED'];
const EVIDENCE_STATUSES = ['MISSING', 'SUBMITTED', 'APPROVED', 'EXPIRED', 'PENDING', 'REJECTED'] as const;

export default function EvidencePage() {
  const router = useRouter();
  const { canCreate, canApprove, canDelete, isReadOnly } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [creating, setCreating] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Record<string, EvidenceAttachment[]>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (redirectToLoginIfNoSession(router)) return;
      const [evidenceResult, controlsResult] = await Promise.all([
        api.get<Evidence[]>('/api/evidence'),
        api.get<Control[]>('/api/governance/controls'),
      ]);
      if (!evidenceResult.success) throw new Error(evidenceResult.error || 'Failed to load evidence');
      setEvidence(api.unwrapRows(evidenceResult.data));
      if (controlsResult.success) setControls(api.unwrapRows(controlsResult.data));
    } catch (err: any) {
      setError(err?.message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const isExpired = (item: Evidence) => item.validTo ? new Date(item.validTo) < new Date() : false;
  const effectiveStatus = (item: Evidence) => (item.status === 'APPROVED' && isExpired(item) ? 'EXPIRED' : item.status);
  const filteredEvidence = statusFilter === 'All' ? evidence : evidence.filter((item) => effectiveStatus(item) === statusFilter);

  const metrics = useMemo(
    () => ({
      approved: evidence.filter((item) => effectiveStatus(item) === 'APPROVED').length,
      missing: evidence.filter((item) => ['MISSING', 'EXPIRED'].includes(effectiveStatus(item))).length,
      submitted: evidence.filter((item) => effectiveStatus(item) === 'SUBMITTED').length,
    }),
    [evidence],
  );

  const loadAttachments = async (evidenceId: string) => {
    const result = await api.get<EvidenceAttachment[]>(`/api/evidence/${evidenceId}/attachments`);
    if (!result.success) {
      setError(result.error || 'Failed to load attachments');
      return;
    }
    setAttachments((current) => ({ ...current, [evidenceId]: api.unwrapRows(result.data) }));
  };

  const toggleAttachments = async (evidenceId: string) => {
    const nextId = expandedId === evidenceId ? null : evidenceId;
    setExpandedId(nextId);
    if (nextId && !attachments[nextId]) await loadAttachments(nextId);
  };

  const updateStatus = async (item: Evidence, status: Evidence['status']) => {
    const result = await api.patch(`/api/evidence/${item.id}`, { status });
    if (!result.success) {
      setError(result.error || 'Failed to update evidence status');
      return;
    }
    await loadData();
  };

  const deleteEvidence = async (item: Evidence) => {
    if (!confirm(`Delete evidence from "${item.source}"?`)) return;
    const result = await api.delete(`/api/evidence/${item.id}`);
    if (!result.success) {
      setError(result.error || 'Failed to delete evidence');
      return;
    }
    await loadData();
  };

  const uploadAttachment = async (evidenceId: string, file: File) => {
    setUploadingId(evidenceId);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/evidence/${evidenceId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() || '' } : {}) },
        body: form,
      });
      if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);
      await loadAttachments(evidenceId);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const columns: DataTableColumn<Evidence>[] = [
    {
      key: 'control',
      header: 'Control / Evidence',
      render: (item) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{item.control?.name || controls.find((control) => control.id === item.controlId)?.name || item.controlId}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.source}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge value={effectiveStatus(item)} /> },
    {
      key: 'validity',
      header: 'Validity',
      render: (item) => (
        <div className="text-sm">
          <div>{item.validFrom ? new Date(item.validFrom).toLocaleDateString() : 'No start date'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{item.validTo ? `Until ${new Date(item.validTo).toLocaleDateString()}` : 'No expiry'}</div>
        </div>
      ),
    },
    { key: 'reference', header: 'Reference', render: (item) => item.reference || 'No reference' },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2 text-xs font-semibold">
          <button onClick={() => void toggleAttachments(item.id)} className="text-gray-700 hover:underline dark:text-gray-200">
            {expandedId === item.id ? 'Hide files' : 'Files'}
          </button>
          {canApprove && item.status !== 'APPROVED' ? (
            <button onClick={() => void updateStatus(item, 'APPROVED')} className="text-green-700 hover:underline">
              Approve
            </button>
          ) : null}
          {canApprove && item.status !== 'REJECTED' ? (
            <button onClick={() => void updateStatus(item, 'REJECTED')} className="text-red-700 hover:underline">
              Reject
            </button>
          ) : null}
          {!isReadOnly ? (
            <button onClick={() => setEditingEvidence(item)} className="text-blue-700 hover:underline">
              Edit
            </button>
          ) : (
            <span className="text-gray-500">Read only</span>
          )}
          {canDelete ? (
            <button onClick={() => void deleteEvidence(item)} className="text-red-700 hover:underline">
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  if (loading && evidence.length === 0) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Evidence"
        subtitle="Govern proof coverage, validity windows, review state, and control linkage."
        right={
          <PermissionGate allowed={canCreate}>
            <button onClick={() => setCreating(true)} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              Add evidence
            </button>
          </PermissionGate>
        }
      />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <ErrorBanner message={error} onRetry={loadData} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile title="Evidence Items" value={evidence.length} hint="Linked proof records" />
          <MetricTile title="Approved" value={metrics.approved} hint="Auditor-ready proof" />
          <MetricTile title="Missing / Expired" value={metrics.missing} hint="Coverage gaps" />
          <MetricTile title="Submitted" value={metrics.submitted} hint="Pending approval" />
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
          rows={filteredEvidence}
          empty={<EmptyState title="No evidence found" message="Attach evidence to controls to prove control operation and audit readiness." />}
        />
        {expandedId ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attachments</h2>
              {canCreate ? (
                <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200">
                  {uploadingId === expandedId ? 'Uploading...' : 'Upload file'}
                  <input type="file" className="hidden" disabled={uploadingId === expandedId} onChange={(event) => event.target.files?.[0] && void uploadAttachment(expandedId, event.target.files[0])} />
                </label>
              ) : null}
            </div>
            <div className="space-y-2">
              {(attachments[expandedId] || []).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No attachments uploaded.</p>
              ) : (
                attachments[expandedId].map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{attachment.filename}</span>
                    <span className="text-xs text-gray-500">{Math.ceil(attachment.sizeBytes / 1024)} KB</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
      <EvidenceModal
        open={creating || Boolean(editingEvidence)}
        evidence={editingEvidence}
        controls={controls}
        onClose={() => {
          setCreating(false);
          setEditingEvidence(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditingEvidence(null);
          await loadData();
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

function EvidenceModal(props: {
  open: boolean;
  evidence: Evidence | null;
  controls: Control[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState({
    controlId: props.evidence?.controlId || '',
    source: props.evidence?.source || 'SAI',
    reference: props.evidence?.reference || '',
    validFrom: props.evidence?.validFrom?.slice(0, 10) || '',
    validTo: props.evidence?.validTo?.slice(0, 10) || '',
    status: props.evidence?.status || 'SUBMITTED',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      controlId: props.evidence?.controlId || '',
      source: props.evidence?.source || 'SAI',
      reference: props.evidence?.reference || '',
      validFrom: props.evidence?.validFrom?.slice(0, 10) || '',
      validTo: props.evidence?.validTo?.slice(0, 10) || '',
      status: props.evidence?.status || 'SUBMITTED',
    });
  }, [props.evidence, props.open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...formData,
      reference: formData.reference.trim() || undefined,
      validFrom: formData.validFrom || undefined,
      validTo: formData.validTo || undefined,
    };
    const result = props.evidence
      ? await api.patch(`/api/evidence/${props.evidence.id}`, payload)
      : await api.post('/api/evidence', payload);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Failed to save evidence');
      return;
    }
    props.onSaved();
  };

  return (
    <Modal open={props.open} title={props.evidence ? 'Edit evidence' : 'Add evidence'} onClose={props.onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <FormField label="Control" htmlFor="evidence-control" required>
          <select id="evidence-control" className={fieldClassName} value={formData.controlId} onChange={(event) => setFormData({ ...formData, controlId: event.target.value })} required>
            <option value="">Select control</option>
            {props.controls.map((control) => (
              <option key={control.id} value={control.id}>
                {control.name}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Source" htmlFor="evidence-source" required>
            <input id="evidence-source" className={fieldClassName} value={formData.source} onChange={(event) => setFormData({ ...formData, source: event.target.value })} required />
          </FormField>
          <FormField label="Status" htmlFor="evidence-status">
          <select
            id="evidence-status"
            className={fieldClassName}
            value={formData.status}
            onChange={(event) =>
              setFormData({ ...formData, status: event.target.value as Evidence['status'] })
            }
          >
              {EVIDENCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Reference" htmlFor="evidence-reference">
          <input id="evidence-reference" className={fieldClassName} value={formData.reference} onChange={(event) => setFormData({ ...formData, reference: event.target.value })} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Valid from" htmlFor="evidence-valid-from">
            <input id="evidence-valid-from" type="date" className={fieldClassName} value={formData.validFrom} onChange={(event) => setFormData({ ...formData, validFrom: event.target.value })} />
          </FormField>
          <FormField label="Valid to" htmlFor="evidence-valid-to">
            <input id="evidence-valid-to" type="date" className={fieldClassName} value={formData.validTo} onChange={(event) => setFormData({ ...formData, validTo: event.target.value })} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
            Cancel
          </button>
          <button disabled={saving} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving...' : 'Save evidence'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
