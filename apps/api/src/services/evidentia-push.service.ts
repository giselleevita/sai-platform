import { prisma } from './prisma.client';
import { logger } from '../utils/logger';
import { computeEvidenceGovernanceHash } from '../domain/evidence-governance-hash';
import { EvidentiaGovernanceService, isEvidentiaGovernanceConfigured } from './evidentia-governance.service';
import { normalizeEvidenceStatus } from './status-normalization.service';

const logCtx = (companyId: string, evidenceId: string) => ({ companyId, saiEvidenceId: evidenceId });

async function recoverExternalIdFromEvidentiaList(saiEvidenceId: string, companyId: string): Promise<string | null> {
  try {
    const items = await EvidentiaGovernanceService.listEvidence(logCtx(companyId, saiEvidenceId));
    for (const e of items) {
      const refs = e.references as Record<string, string> | undefined;
      if (refs?.saiEvidenceId === saiEvidenceId) return e.id;
    }
  } catch (e) {
    logger.warn('Evidentia list recovery skipped', { saiEvidenceId, err: e });
  }
  return null;
}

/**
 * Push or align one SAI Evidence row with Evidentia when company sync is enabled.
 * Idempotent: skips HTTP when governance hash unchanged and last push succeeded.
 */
export async function syncEvidenceToEvidentia(companyId: string, evidenceId: string, actorId: string): Promise<void> {
  if (!(await isEvidentiaGovernanceConfigured(companyId))) return;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { evidentiaSyncEnabled: true },
  });
  if (!company?.evidentiaSyncEnabled) return;

  const row = await prisma.evidence.findFirst({
    where: { id: evidenceId, companyId },
    include: { control: true },
  });
  if (!row) return;

  const status = normalizeEvidenceStatus(row.status) as string;
  const governanceHash = computeEvidenceGovernanceHash({
    controlId: row.controlId,
    source: row.source,
    reference: row.reference,
    status,
  });

  const syncRow = await prisma.evidentiaSyncState.findUnique({
    where: { evidenceId: row.id },
  });

  if (
    syncRow?.lastPushedContentHash === governanceHash &&
    syncRow.lastSuccessAt &&
    syncRow.evidentiaExternalId
  ) {
    if (row.externalEvidenceId !== syncRow.evidentiaExternalId) {
      await prisma.evidence.update({
        where: { id: row.id },
        data: { externalEvidenceId: syncRow.evidentiaExternalId },
      });
    }
    return;
  }

  const refs = {
    saiEvidenceId: row.id,
    saiCompanyId: companyId,
    saiControlId: row.controlId,
    saiStatus: status,
  };

  await prisma.evidentiaSyncState.upsert({
    where: { evidenceId: row.id },
    create: {
      evidenceId: row.id,
      companyId,
      lastAttemptAt: new Date(),
    },
    update: {
      companyId,
      lastAttemptAt: new Date(),
    },
  });

  let extId = row.externalEvidenceId ?? syncRow?.evidentiaExternalId ?? null;
  if (!extId) {
    extId = await recoverExternalIdFromEvidentiaList(row.id, companyId);
    if (extId) {
      await prisma.evidence.update({
        where: { id: row.id },
        data: { externalEvidenceId: extId },
      });
    }
  }

  const markFailure = async (message: string, httpStatus?: number) => {
    await prisma.evidentiaSyncState
      .update({
        where: { evidenceId: row.id },
        data: { lastError: message.slice(0, 4000), lastHttpStatus: httpStatus ?? null },
      })
      .catch(() => undefined);
  };

  const markSuccess = async (externalId: string, opts?: { setCollectionMethod?: boolean }) => {
    await prisma.$transaction([
      prisma.evidentiaSyncState.update({
        where: { evidenceId: row.id },
        data: {
          evidentiaExternalId: externalId,
          lastPushedContentHash: governanceHash,
          lastSuccessAt: new Date(),
          lastError: null,
          lastHttpStatus: null,
        },
      }),
      prisma.evidence.update({
        where: { id: row.id },
        data: {
          externalEvidenceId: externalId,
          contentHash: governanceHash,
          ...(opts?.setCollectionMethod ? { collectionMethod: 'sai_evidentia_sync' } : {}),
        },
      }),
    ]);
  };

  try {
    const ctx = logCtx(companyId, row.id);

    if (!extId) {
      const dto = await EvidentiaGovernanceService.createGovernedEvidence(
        {
          title: `SAI governance: ${row.control.name}`,
          description: [
            `Source: ${row.source}`,
            row.reference ? `Reference: ${row.reference}` : '',
            row.validFrom ? `Valid from: ${row.validFrom.toISOString()}` : '',
            row.validTo ? `Valid to: ${row.validTo.toISOString()}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          type: 'GOVERNANCE',
          sourceSystem: 'SAI_PLATFORM',
          owner: actorId,
          references: refs,
        },
        ctx
      );
      const createdId = dto.id;
      await EvidentiaGovernanceService.submitForReview(createdId, ctx);
      if (status === 'APPROVED') {
        await EvidentiaGovernanceService.approve(createdId, 'SAI evidence created as approved', ctx);
      }
      await markSuccess(createdId, { setCollectionMethod: true });
      return;
    }

    if (status === 'APPROVED') {
      await EvidentiaGovernanceService.approve(extId, 'Aligned from SAI evidence approval', ctx);
    } else if (status === 'SUBMITTED' || status === 'MISSING') {
      await EvidentiaGovernanceService.submitForReview(extId, ctx).catch(() => {
        /* may already be in review */
      });
    }

    await markSuccess(extId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const statusMatch = message.match(/HTTP (\d{3})/);
    const httpStatus = statusMatch ? Number(statusMatch[1]) : undefined;
    logger.error('Evidentia sync failed', { evidenceId, err: e });
    await markFailure(message, httpStatus);
  }
}
