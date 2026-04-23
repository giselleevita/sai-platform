import { randomUUID } from 'crypto';
import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';
import { NotFoundError } from '../errors/AppError';
import { normalizeLifecycleStatus } from './status-normalization.service';
import type { Prisma } from '@prisma/client';

// Type definition for LifecycleStatus (temporary until Prisma client is regenerated)
type LifecycleStatus = 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED';

/** Persisted under AITool.customFields.toolGovernance — Risk-scoped DecisionLog remains separate. */
const TOOL_GOVERNANCE_KEY = 'toolGovernance';

export type ToolGovernanceProfile = {
  decisionStatus?: string;
  decisionOwner?: string;
  decisionOwnerRole?: string;
  decisionRationale?: string;
  decisionExpiresAt?: string;
  reviewDate?: string;
  applicablePolicies?: string[];
  complianceStatus?: string;
};

type ToolDecisionLogEntry = {
  id: string;
  decision: string;
  rationale?: string | null;
  ownerId?: string | null;
  createdAt: string;
};

type ToolGovernanceStorage = {
  profile?: ToolGovernanceProfile;
  decisionLogs?: ToolDecisionLogEntry[];
};

const PROFILE_KEYS = new Set([
  'decisionStatus',
  'decisionOwner',
  'decisionOwnerRole',
  'decisionRationale',
  'decisionExpiresAt',
  'reviewDate',
  'applicablePolicies',
  'complianceStatus',
]);

function parseCustomFields(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function getToolGovernanceStorage(customFields: unknown): ToolGovernanceStorage {
  const root = parseCustomFields(customFields);
  const raw = root[TOOL_GOVERNANCE_KEY];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ToolGovernanceStorage;
  }
  return {};
}

function pickProfileFields(data: Record<string, unknown>): ToolGovernanceProfile {
  const out: ToolGovernanceProfile = {};
  for (const key of PROFILE_KEYS) {
    if (!(key in data) || data[key] === undefined) continue;
    const v = data[key];
    if (key === 'applicablePolicies') {
      if (Array.isArray(v)) {
        out.applicablePolicies = v.filter((x): x is string => typeof x === 'string');
      }
      continue;
    }
    if (typeof v === 'string') {
      (out as Record<string, string>)[key] = v;
    }
  }
  return out;
}

function mergeGovernanceIntoCustomFields(
  customFields: unknown,
  nextStorage: ToolGovernanceStorage,
): Record<string, unknown> {
  const root = parseCustomFields(customFields);
  return {
    ...root,
    [TOOL_GOVERNANCE_KEY]: nextStorage,
  };
}

export class GovernanceFlowService {
  /**
   * Returns persisted governance profile for the tool, or null if none stored.
   * Stored in `AITool.customFields.toolGovernance.profile` (JSON).
   */
  static async getGovernance(toolId: string, companyId: string): Promise<ToolGovernanceProfile | null> {
    const tool = await prisma.aITool.findFirst({ where: { id: toolId, companyId } });
    if (!tool) return null;
    const { profile } = getToolGovernanceStorage(tool.customFields);
    if (!profile || Object.keys(profile).length === 0) return null;
    return profile;
  }

  /**
   * Merge profile fields into stored tool governance (tenant-scoped).
   */
  static async upsertGovernance(
    toolId: string,
    companyId: string,
    data: Record<string, unknown>,
  ): Promise<ToolGovernanceProfile> {
    const tool = await prisma.aITool.findFirst({ where: { id: toolId, companyId } });
    if (!tool) {
      throw new NotFoundError('Tool not found');
    }
    const storage = getToolGovernanceStorage(tool.customFields);
    const patch = pickProfileFields(data);
    const profile: ToolGovernanceProfile = { ...(storage.profile ?? {}), ...patch };
    const nextCustom = mergeGovernanceIntoCustomFields(tool.customFields, {
      ...storage,
      profile,
    });
    await prisma.aITool.update({
      where: { id: toolId },
      data: { customFields: nextCustom as object },
    });
    return profile;
  }

  /**
   * Decision history for the AI tool (free-form strings). Stored in custom JSON, not the Risk `DecisionLog` table.
   */
  static async listDecisionLogs(toolId: string, companyId: string): Promise<ToolDecisionLogEntry[]> {
    const tool = await prisma.aITool.findFirst({ where: { id: toolId, companyId } });
    if (!tool) return [];
    const { decisionLogs = [] } = getToolGovernanceStorage(tool.customFields);
    return [...decisionLogs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  static async addDecisionLog(
    toolId: string,
    companyId: string,
    input: { decision: string; rationale?: string; ownerId?: string },
  ): Promise<ToolDecisionLogEntry> {
    const entry: ToolDecisionLogEntry = {
      id: randomUUID(),
      decision: input.decision,
      rationale: input.rationale ?? null,
      ownerId: input.ownerId ?? null,
      createdAt: new Date().toISOString(),
    };

    const log = await prisma.$transaction(async (tx) => {
      const tool = await tx.aITool.findFirst({ where: { id: toolId, companyId } });
      if (!tool) {
        throw new NotFoundError('Tool not found');
      }
      const storage = getToolGovernanceStorage(tool.customFields);
      const decisionLogs = [...(storage.decisionLogs ?? []), entry];
      const nextCustom = mergeGovernanceIntoCustomFields(tool.customFields, {
        ...storage,
        decisionLogs,
      });
      await tx.aITool.update({
        where: { id: toolId },
        data: { customFields: nextCustom as object },
      });
      return entry;
    });

    await AuditLogService.log({
      companyId,
      actorId: input.ownerId,
      action: 'inventory.tool.decisionLog.create',
      targetType: 'AITool',
      targetId: toolId,
      changes: { decision: input.decision, rationale: input.rationale },
    });

    return log;
  }
}

export interface CreatePolicyInput {
  name: string;
  description?: string;
  status?: LifecycleStatus;
  ownerId?: string;
  approverId?: string;
  reviewerId?: string;
}

export interface CreateControlInput {
  policyId?: string;
  name: string;
  description?: string;
  status?: LifecycleStatus;
  ownerId?: string;
  approverId?: string;
  reviewerId?: string;
}

export interface CreateProcedureInput {
  controlId: string;
  name: string;
  steps?: Record<string, unknown>;
}

export interface CreateRegulationInput {
  framework: string;
  article?: string;
  name: string;
  description?: string;
}

export class GovernanceService {
  static async listPolicies(companyId: string) {
    return prisma.policy.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createPolicy(companyId: string, actorId: string | undefined, input: CreatePolicyInput) {
    const policy = await prisma.policy.create({
      data: {
        ...input,
        status: normalizeLifecycleStatus(input.status) || undefined,
        companyId,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'policy.create',
      targetType: 'Policy',
      targetId: policy.id,
      changes: input as unknown as Record<string, unknown>,
    });

    return policy;
  }

  static async updatePolicy(companyId: string, actorId: string | undefined, id: string, input: Partial<CreatePolicyInput>) {
    const policy = await prisma.policy.update({
      where: { id, companyId },
      data: {
        ...input,
        ...(input.status !== undefined && { status: normalizeLifecycleStatus(input.status) }),
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'policy.update',
      targetType: 'Policy',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    return policy;
  }

  static async deletePolicy(companyId: string, actorId: string | undefined, id: string) {
    await prisma.policy.delete({
      where: { id, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'policy.delete',
      targetType: 'Policy',
      targetId: id,
    });
  }

  static async listControls(companyId: string) {
    return prisma.control.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createControl(companyId: string, actorId: string | undefined, input: CreateControlInput) {
    const control = await prisma.control.create({
      data: {
        ...input,
        status: normalizeLifecycleStatus(input.status) || undefined,
        companyId,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'control.create',
      targetType: 'Control',
      targetId: control.id,
      changes: input as unknown as Record<string, unknown>,
    });

    return control;
  }

  static async updateControl(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateControlInput>) {
    const control = await prisma.control.update({
      where: { id, companyId },
      data: {
        ...input,
        ...(input.status !== undefined && { status: normalizeLifecycleStatus(input.status) }),
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'control.update',
      targetType: 'Control',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    return control;
  }

  static async deleteControl(companyId: string, actorId: string | undefined, id: string) {
    await prisma.control.delete({
      where: { id, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'control.delete',
      targetType: 'Control',
      targetId: id,
    });
  }

  static async listProcedures(companyId: string) {
    return prisma.procedure.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createProcedure(companyId: string, actorId: string | undefined, input: CreateProcedureInput) {
    const procedure = await prisma.procedure.create({
      data: {
        companyId,
        controlId: input.controlId,
        name: input.name,
        steps: (input.steps ?? {}) as Prisma.InputJsonValue,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'procedure.create',
      targetType: 'Procedure',
      targetId: procedure.id,
      changes: input as unknown as Record<string, unknown>,
    });

    return procedure;
  }

  static async updateProcedure(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateProcedureInput>) {
    const procedure = await prisma.procedure.update({
      where: { id, companyId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.steps !== undefined ? { steps: (input.steps ?? {}) as Prisma.InputJsonValue } : {}),
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'procedure.update',
      targetType: 'Procedure',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    return procedure;
  }

  static async deleteProcedure(companyId: string, actorId: string | undefined, id: string) {
    await prisma.procedure.delete({
      where: { id, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'procedure.delete',
      targetType: 'Procedure',
      targetId: id,
    });
  }

  static async listRegulations(companyId: string) {
    return prisma.regulation.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createRegulation(companyId: string, actorId: string | undefined, input: CreateRegulationInput) {
    const regulation = await prisma.regulation.create({
      data: { ...input, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'regulation.create',
      targetType: 'Regulation',
      targetId: regulation.id,
      changes: input as unknown as Record<string, unknown>,
    });

    return regulation;
  }

  static async updateRegulation(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateRegulationInput>) {
    const regulation = await prisma.regulation.update({
      where: { id, companyId },
      data: input,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'regulation.update',
      targetType: 'Regulation',
      targetId: id,
      changes: input as unknown as Record<string, unknown>,
    });

    return regulation;
  }

  static async deleteRegulation(companyId: string, actorId: string | undefined, id: string) {
    await prisma.regulation.delete({
      where: { id, companyId },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'regulation.delete',
      targetType: 'Regulation',
      targetId: id,
    });
  }

  /** Point-in-time compliance / governance counts for audit snapshots. */
  static async createComplianceSnapshot(companyId: string, actorId: string | undefined) {
    const [policies, controls, risks, evidenceTotal] = await Promise.all([
      prisma.policy.count({ where: { companyId } }),
      prisma.control.count({ where: { companyId } }),
      prisma.risk.count({ where: { companyId } }),
      prisma.evidence.count({ where: { companyId } }),
    ]);

    const evidenceByStatus = await prisma.evidence.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
    });

    const summary = {
      generatedAt: new Date().toISOString(),
      policies,
      controls,
      risks,
      evidenceTotal,
      evidenceByStatus: Object.fromEntries(
        evidenceByStatus.map((row) => [row.status, row._count.id])
      ),
    };

    const snap = await prisma.complianceSnapshot.create({
      data: {
        companyId,
        summary,
      },
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'compliance.snapshot.create',
      targetType: 'ComplianceSnapshot',
      targetId: snap.id,
      changes: { snapshotId: snap.id },
    });

    return snap;
  }

  static async listComplianceSnapshots(companyId: string) {
    return prisma.complianceSnapshot.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
  }
}
