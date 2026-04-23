import { createHash } from 'crypto';

/** Stable hash of governance fields used for Evidentia idempotency and SAI `contentHash`. */
export function computeEvidenceGovernanceHash(input: {
  controlId: string;
  source: string;
  reference?: string | null;
  status: string;
}): string {
  return createHash('sha256')
    .update([input.controlId, input.source, input.reference ?? '', input.status].join('|'))
    .digest('hex');
}
