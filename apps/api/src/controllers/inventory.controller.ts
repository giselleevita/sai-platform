import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AIToolService } from '../services/ai-tool.service';
import { BadRequestError, NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { prisma } from '../services/prisma.client';
import { GovernanceFlowService } from '../services/governance.service';

const GOVERNANCE_PROFILES: Record<
  string,
  {
    decisionStatus: string;
    decisionOwner: string;
    decisionOwnerRole: string;
    decisionRationale: string;
    decisionExpiresAt?: string;
    reviewDate?: string;
    applicablePolicies: string[];
    complianceStatus: string;
  }
> = {
  'GenAI Copilot': {
    decisionStatus: 'Accepted with expiry',
    decisionOwner: 'Maya Chen',
    decisionOwnerRole: 'Management',
    decisionRationale: 'Controls in place, limited scope, reviewed quarterly',
    decisionExpiresAt: '2026-06-01',
    reviewDate: '2026-03-01',
    applicablePolicies: ['AI Usage Policy', 'High-Risk Approval', 'Data Handling (PII)'],
    complianceStatus: 'Compliant with review scheduled',
  },
  'ImageGen Pro': {
    decisionStatus: 'Rejected',
    decisionOwner: 'Security Council',
    decisionOwnerRole: 'Security',
    decisionRationale: 'No DPA, high data sensitivity, unacceptable risk',
    applicablePolicies: ['AI Usage Policy', 'High-Risk Approval'],
    complianceStatus: 'Non-compliant until mitigated',
  },
  'DataInsights LLM': {
    decisionStatus: 'Mitigate',
    decisionOwner: 'Risk Committee',
    decisionOwnerRole: 'Management',
    decisionRationale: 'Requires additional monitoring and DLP controls',
    reviewDate: '2026-04-15',
    applicablePolicies: ['AI Usage Policy', 'Data Residency', 'Monitoring & Logging'],
    complianceStatus: 'In mitigation with active monitoring',
  },
  'VoiceBot Assist': {
    decisionStatus: 'Accepted',
    decisionOwner: 'Operations',
    decisionOwnerRole: 'Management',
    decisionRationale: 'Low-risk, no sensitive data, logging enabled',
    applicablePolicies: ['AI Usage Policy'],
    complianceStatus: 'Compliant',
  },
  'AutoClassifier': {
    decisionStatus: 'Pending',
    decisionOwner: 'Awaiting owner assignment',
    decisionOwnerRole: 'Unassigned',
    decisionRationale: 'Decision required before production use',
    applicablePolicies: ['AI Usage Policy', 'High-Risk Approval'],
    complianceStatus: 'Decision required',
  },
};

export class InventoryController {
  /**
   * GET /api/inventory
   * Get all AI tools for company with pagination and search
   * SECURITY: Company isolation enforced - only returns tools for authenticated user's company
   */
  static async getTools(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      const pagination = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await AIToolService.getToolsByCompany(companyId, {
        pagination,
        search: req.query.q as string | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        riskLevel: req.query.riskLevel as string | undefined,
      });
      
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Error fetching tools:', error);
      throw error;
    }
  }

  /**
   * GET /api/inventory/summary
   * Get risk summary for company
   */
  static async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      const summary = await AIToolService.getRiskSummary(companyId);
      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error fetching summary:', error);
      throw error;
    }
  }

  /**
   * GET /api/inventory/export/csv
   * Export tools as CSV
   */
  static async exportCSV(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      const csv = await AIToolService.exportToolsCSV(companyId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ai-tools.csv"');
      res.send(csv);
    } catch (error) {
      logger.error('Error exporting CSV:', error);
      throw error;
    }
  }

  /**
   * GET /api/inventory/:id
   * Get specific tool
   * SECURITY: Company isolation enforced - only returns tool if it belongs to user's company
   */
  static async getTool(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      const tool = await AIToolService.getToolById(id, companyId);
      if (!tool) {
        throw new NotFoundError('Tool not found');
      }

      // CRITICAL: Double-check company isolation (defense in depth)
      if (tool.companyId !== companyId) {
        logger.warn(`Security: User ${req.user?.id} attempted to access tool ${id} from company ${tool.companyId}`);
        throw new NotFoundError('Tool not found'); // Don't reveal existence of other company's tools
      }

      res.json({ success: true, data: tool });
    } catch (error) {
      logger.error('Error fetching tool:', error);
      throw error;
    }
  }

  /**
   * GET /api/inventory/:id/governance
   * Returns governance profile for a tool (demo data to surface accountability)
   */
  static async getToolGovernance(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }
    const tool = await AIToolService.getToolById(id, companyId);
    if (!tool) {
      throw new NotFoundError('Tool not found');
    }

    const persisted = await GovernanceFlowService.getGovernance(tool.id, companyId);
    const profile =
      persisted ||
      GOVERNANCE_PROFILES[tool.name] ||
      GOVERNANCE_PROFILES['AutoClassifier'] || {
        decisionStatus: 'Pending',
        decisionOwner: 'Unassigned',
        decisionOwnerRole: 'Unassigned',
        decisionRationale: 'Decision required before production use',
        applicablePolicies: ['AI Usage Policy'],
        complianceStatus: 'Decision required',
      };

    res.json({
      success: true,
      data: {
        toolId: tool.id,
        ...profile,
      },
    });
  }

  /**
   * PATCH /api/inventory/:id/governance
   * Persist governance profile fields (merges into AITool.customFields.toolGovernance.profile)
   */
  static async patchToolGovernance(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }
    const tool = await AIToolService.getToolById(id, companyId);
    if (!tool) {
      throw new NotFoundError('Tool not found');
    }
    const profile = await GovernanceFlowService.upsertGovernance(id, companyId, req.body || {});
    res.json({
      success: true,
      data: {
        toolId: tool.id,
        ...profile,
      },
    });
  }

  /**
   * GET /api/inventory/:id/decisions
   * Returns decision history for a tool
   */
  static async getToolDecisionLogs(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }
    const logs = await GovernanceFlowService.listDecisionLogs(id, companyId);
    res.json({ success: true, data: logs });
  }

  /**
   * POST /api/inventory/:id/decisions
   * Create a decision log entry (demo/POC)
   * Body: { decision: string, rationale?: string }
   */
  static async addToolDecisionLog(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID not found');
    }
    const ownerId = req.user?.id;
    const { decision, rationale } = req.body || {};
    if (!decision) {
      throw new BadRequestError('Decision is required');
    }
    const log = await GovernanceFlowService.addDecisionLog(id, companyId, { decision, rationale, ownerId });
    res.status(201).json({ success: true, data: log });
  }

  /**
   * POST /api/inventory
   * Create new AI tool
   * Note: Input validation is handled by validateCreateTool middleware
   */
  static async createTool(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      const input = req.body; // Already validated by middleware

      const tool = await AIToolService.createTool(companyId, input);
      res.status(201).json({ success: true, data: tool });
    } catch (error) {
      logger.error('Error creating tool:', error);
      throw error;
    }
  }

  /**
   * PATCH /api/inventory/:id
   * Update AI tool
   * SECURITY: Company isolation enforced - can only update tools from user's company
   */
  static async updateTool(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      // CRITICAL: Verify tool belongs to company before update
      const existingTool = await AIToolService.getToolById(id, companyId);
      if (!existingTool) {
        throw new NotFoundError('Tool not found');
      }

      // CRITICAL: Double-check company isolation
      if (existingTool.companyId !== companyId) {
        logger.warn(`Security: User ${req.user?.id} attempted to update tool ${id} from company ${existingTool.companyId}`);
        throw new NotFoundError('Tool not found');
      }

      const input = req.body;
      const tool = await AIToolService.updateTool(id, companyId, input);
      res.json({ success: true, data: tool });
    } catch (error) {
      const errorMsg = (error as any).message;
      if (errorMsg === 'Tool not found') {
        throw new NotFoundError('Tool not found');
      }
      logger.error('Error updating tool:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/inventory/:id
   * Delete AI tool
   * SECURITY: Company isolation enforced - can only delete tools from user's company
   */
  static async deleteTool(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new BadRequestError('Company ID not found');
      }

      // CRITICAL: Verify tool belongs to company before delete
      const existingTool = await AIToolService.getToolById(id, companyId);
      if (!existingTool) {
        throw new NotFoundError('Tool not found');
      }

      // CRITICAL: Double-check company isolation
      if (existingTool.companyId !== companyId) {
        logger.warn(`Security: User ${req.user?.id} attempted to delete tool ${id} from company ${existingTool.companyId}`);
        throw new NotFoundError('Tool not found');
      }

      await AIToolService.deleteTool(id, companyId);
      res.json({ success: true, message: 'Tool deleted successfully' });
    } catch (error) {
      const errorMsg = (error as any).message;
      if (errorMsg === 'Tool not found') {
        throw new NotFoundError('Tool not found');
      }
      logger.error('Error deleting tool:', error);
      throw error;
    }
  }
}
