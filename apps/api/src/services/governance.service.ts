import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';

// Type definition for LifecycleStatus (temporary until Prisma client is regenerated)
type LifecycleStatus = 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED';

export class GovernanceFlowService {
  // Note: ToolGovernance and ToolDecisionLog models were removed from schema
  // These methods are stubbed out - governance data should be stored differently
  static async getGovernance(toolId: string, companyId: string): Promise<any | null> {
    const tool = await prisma.aITool.findFirst({ where: { id: toolId, companyId } });
    if (!tool) return null;
    // Return null for now - governance data structure needs to be redefined
    return null;
  }

  static async upsertGovernance(toolId: string, data: any) {
    // Stub - governance upsert needs to be reimplemented
    throw new Error('Governance upsert not implemented - models removed from schema');
  }

  static async listDecisionLogs(toolId: string, companyId: string): Promise<any[]> {
    const tool = await prisma.aITool.findFirst({ where: { id: toolId, companyId } });
    if (!tool) return [];
    // Return empty array - decision logs need to use DecisionLog model instead
    return [];
  }

  static async addDecisionLog(toolId: string, companyId: string, input: { decision: string; rationale?: string; ownerId?: string }) {
    const tool = await prisma.aITool.findFirst({ where: { id: toolId, companyId } });
    if (!tool) throw new Error('Tool not found');
    // Stub - decision logs should use DecisionLog model instead
    throw new Error('Decision log creation not implemented - use DecisionLog model instead');
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
    return (prisma as any).policy.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createPolicy(companyId: string, actorId: string | undefined, input: CreatePolicyInput) {
    const policy = await (prisma as any).policy.create({
      data: { ...input, companyId } as any,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'policy.create',
      targetType: 'Policy',
      targetId: policy.id,
      changes: input as any,
    });

    return policy;
  }

  static async updatePolicy(companyId: string, actorId: string | undefined, id: string, input: Partial<CreatePolicyInput>) {
    const policy = await (prisma as any).policy.update({
      where: { id, companyId },
      data: input,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'policy.update',
      targetType: 'Policy',
      targetId: id,
      changes: input as any,
    });

    return policy;
  }

  static async deletePolicy(companyId: string, actorId: string | undefined, id: string) {
    await (prisma as any).policy.delete({
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
    return (prisma as any).control.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createControl(companyId: string, actorId: string | undefined, input: CreateControlInput) {
    const control = await (prisma as any).control.create({
      data: { ...input, companyId } as any,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'control.create',
      targetType: 'Control',
      targetId: control.id,
      changes: input as any,
    });

    return control;
  }

  static async updateControl(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateControlInput>) {
    const control = await (prisma as any).control.update({
      where: { id, companyId },
      data: input,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'control.update',
      targetType: 'Control',
      targetId: id,
      changes: input as any,
    });

    return control;
  }

  static async deleteControl(companyId: string, actorId: string | undefined, id: string) {
    await (prisma as any).control.delete({
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
    return (prisma as any).procedure.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createProcedure(companyId: string, actorId: string | undefined, input: CreateProcedureInput) {
    const procedure = await (prisma as any).procedure.create({
      data: { ...input, companyId } as any,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'procedure.create',
      targetType: 'Procedure',
      targetId: procedure.id,
      changes: input as any,
    });

    return procedure;
  }

  static async updateProcedure(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateProcedureInput>) {
    const procedure = await (prisma as any).procedure.update({
      where: { id, companyId },
      data: input,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'procedure.update',
      targetType: 'Procedure',
      targetId: id,
      changes: input as any,
    });

    return procedure;
  }

  static async deleteProcedure(companyId: string, actorId: string | undefined, id: string) {
    await (prisma as any).procedure.delete({
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
    return (prisma as any).regulation.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async createRegulation(companyId: string, actorId: string | undefined, input: CreateRegulationInput) {
    const regulation = await (prisma as any).regulation.create({
      data: { ...input, companyId } as any,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'regulation.create',
      targetType: 'Regulation',
      targetId: regulation.id,
      changes: input as any,
    });

    return regulation;
  }

  static async updateRegulation(companyId: string, actorId: string | undefined, id: string, input: Partial<CreateRegulationInput>) {
    const regulation = await (prisma as any).regulation.update({
      where: { id, companyId },
      data: input,
    });

    await AuditLogService.log({
      companyId,
      actorId,
      action: 'regulation.update',
      targetType: 'Regulation',
      targetId: id,
      changes: input as any,
    });

    return regulation;
  }

  static async deleteRegulation(companyId: string, actorId: string | undefined, id: string) {
    await (prisma as any).regulation.delete({
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
}
