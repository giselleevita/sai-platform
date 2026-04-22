const LEGACY_TO_CANONICAL_EVIDENCE_STATUS: Record<string, 'MISSING' | 'SUBMITTED' | 'APPROVED' | 'EXPIRED'> = {
  PENDING: 'SUBMITTED',
  REJECTED: 'EXPIRED',
  MISSING: 'MISSING',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  EXPIRED: 'EXPIRED',
};

const LEGACY_TO_CANONICAL_LIFECYCLE_STATUS: Record<string, 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED'> = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RETIRED: 'RETIRED',
  DEPRECATED: 'RETIRED',
};

function toUpper(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim().toUpperCase();
}

export function normalizeEvidenceStatus(status?: string | null) {
  const normalized = toUpper(status);
  if (!normalized) return undefined;
  return LEGACY_TO_CANONICAL_EVIDENCE_STATUS[normalized];
}

export function normalizeLifecycleStatus(status?: string | null) {
  const normalized = toUpper(status);
  if (!normalized) return undefined;
  return LEGACY_TO_CANONICAL_LIFECYCLE_STATUS[normalized];
}
