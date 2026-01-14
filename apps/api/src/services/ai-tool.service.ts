import { AITool } from '@prisma/client';
import { calculateRiskScore } from '@sai/risk-scoring';
import { prisma } from './prisma.client';
import { logger } from '../utils/logger';
import { CacheService } from './cache.service';

export interface CreateAIToolInput {
  name: string;
  category: string;
  vendor?: string;
  description?: string;
  url?: string;
  dataTypes: string[];
  users: number;
  frequency: string;
  controls: string[];
  hasDPA?: boolean;
  dataResidency?: string;
  notes?: string;
}

export interface UpdateAIToolInput extends Partial<CreateAIToolInput> {}

export class AIToolService {
  /**
   * Create new AI tool for company
   */
  static async createTool(companyId: string, input: CreateAIToolInput): Promise<AITool> {
    // Calculate risk score
    const riskResult = calculateRiskScore({
      name: input.name,
      category: input.category as any,
      dataTypes: input.dataTypes as any,
      users: input.users,
      frequency: input.frequency as any,
      controls: input.controls,
      notes: input.notes,
    });

    const tool = await prisma.aITool.create({
      data: {
        companyId,
        name: input.name,
        category: input.category,
        vendor: input.vendor,
        description: input.description,
        url: input.url,
        dataTypes: input.dataTypes,
        users: input.users,
        frequency: input.frequency,
        controls: input.controls,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        hasDPA: input.hasDPA || false,
        dataResidency: input.dataResidency ?? null,
        notes: input.notes,
      },
    });

    // Save risk score history
    await prisma.riskScore.create({
      data: {
        companyId,
        toolId: tool.id,
        score: riskResult.score,
        level: riskResult.level,
        factors: riskResult.factors,
        recommendations: riskResult.recommendations,
      },
    });

    // Send email notification for high-risk tools
    if (riskResult.level === 'High' || riskResult.level === 'Critical') {
      try {
        const { EmailService } = await import('./email.service');
        const owner = tool.ownerId ? await prisma.user.findUnique({ where: { id: tool.ownerId } }) : null;
        if (owner) {
          await EmailService.sendHighRiskToolNotification(
            owner.email,
            tool.name,
            riskResult.level,
            riskResult.score
          );
        }
      } catch (error) {
        // Don't fail tool creation if email fails
        logger.warn('Failed to send high-risk notification:', error);
      }
    }

    // Invalidate cache
    await CacheService.invalidateCompany(companyId);

    // Trigger webhook for tool creation
    try {
      const { WebhooksService } = await import('./webhooks.service');
      await WebhooksService.triggerWebhook(companyId, 'tool.created', {
        toolId: tool.id,
        toolName: tool.name,
        riskLevel: tool.riskLevel,
        riskScore: tool.riskScore,
      });
    } catch (error) {
      // Don't fail tool creation if webhook fails
      logger.warn('Failed to trigger webhook:', error);
    }

    return tool;
  }

  /**
   * Get all tools for company with pagination and search
   */
  static async getToolsByCompany(
    companyId: string,
    options: {
      pagination?: { page?: number; limit?: number };
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      riskLevel?: string;
    } = {}
  ): Promise<{ data: AITool[]; pagination: any }> {
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.limit || 20;
    
    // Build cache key
    const cacheKey = `company:${companyId}:tools:${page}:${limit}:${options.search || ''}:${options.sortBy || 'riskScore'}:${options.sortOrder || 'desc'}:${options.riskLevel || 'All'}`;
    
    // Try cache first (only if no search/filter)
    if (!options.search && !options.riskLevel) {
      const cached = await CacheService.get<{ data: AITool[]; pagination: any }>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      deletedAt: null, // Soft delete filter
      ...(options.riskLevel && options.riskLevel !== 'All' && { riskLevel: options.riskLevel }),
      ...(options.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { vendor: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: any = {};
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'desc';
    } else {
      orderBy.riskScore = 'desc';
    }

    const [tools, total] = await Promise.all([
      prisma.aITool.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.aITool.count({ where }),
    ]);

    const result = {
      data: tools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    // Cache result (only if no search/filter, cache for 5 minutes)
    if (!options.search && !options.riskLevel) {
      await CacheService.set(cacheKey, result, 300);
    }

    return result;
  }

  /**
   * Get tool by ID with related policies and controls
   */
  static async getToolById(id: string, companyId: string): Promise<any | null> {
    const tool = await prisma.aITool.findFirst({
      where: { id, companyId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!tool) return null;

    // Get policies that apply to this tool based on controls
    // Policies are linked through controls, and controls can be mapped to tool risk/data types
    const policies = await prisma.policy.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      include: {
        controls: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    // Filter policies that are relevant based on tool characteristics
    const applicablePolicies = policies.filter((policy) => {
      // A policy is applicable if it has controls that match tool's risk level or data types
      return policy.controls.some((control) => {
        // Simple matching logic - can be enhanced
        const controlName = control.name.toLowerCase();
        const toolHasPII = tool.dataTypes.includes('PII');
        const toolIsHighRisk = tool.riskLevel === 'High' || tool.riskLevel === 'Critical';
        
        if (toolHasPII && controlName.includes('dpa')) return true;
        if (toolIsHighRisk && controlName.includes('approval')) return true;
        if (controlName.includes('mfa') && tool.controls.includes('MFA')) return true;
        return false;
      });
    });

    return {
      ...tool,
      applicablePolicies: applicablePolicies.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        controls: p.controls.map((c) => ({
          id: c.id,
          name: c.name,
        })),
      })),
    };
  }

  /**
   * Update tool and recalculate risk
   */
  static async updateTool(
    id: string,
    companyId: string,
    input: UpdateAIToolInput
  ): Promise<AITool> {
    // Get current tool
    const tool = await this.getToolById(id, companyId);
    if (!tool) {
      throw new Error('Tool not found');
    }

    // Merge with existing data
    const merged = {
      name: input.name || tool.name,
      category: input.category || tool.category,
      dataTypes: input.dataTypes || tool.dataTypes,
      users: input.users ?? tool.users,
      frequency: input.frequency || tool.frequency,
      controls: input.controls || tool.controls,
      notes: input.notes ?? (tool.notes || undefined),
    };

    // Recalculate risk
    const riskResult = calculateRiskScore({
      name: merged.name,
      category: merged.category as any,
      dataTypes: merged.dataTypes as any,
      users: merged.users,
      frequency: merged.frequency as any,
      controls: merged.controls,
      notes: merged.notes,
    });

    // Update tool
    const updated = await prisma.aITool.update({
      where: { id, deletedAt: null }, // Soft delete check
      data: {
        ...input,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
      },
    });

    // Invalidate cache
    await CacheService.invalidateCompany(updated.companyId);

    // Save new risk score
    await prisma.riskScore.create({
      data: {
        companyId,
        toolId: id,
        score: riskResult.score,
        level: riskResult.level,
        factors: riskResult.factors,
        recommendations: riskResult.recommendations,
      },
    });

    return updated;
  }

  /**
   * Delete tool (soft delete)
   */
  static async deleteTool(id: string, companyId: string): Promise<void> {
    const tool = await this.getToolById(id, companyId);
    if (!tool) {
      throw new Error('Tool not found');
    }

    // Soft delete
    await prisma.aITool.updateMany({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await CacheService.invalidateCompany(companyId);
  }

  /**
   * Get risk summary for company
   */
  static async getRiskSummary(companyId: string) {
    // Get all tools for summary (no pagination)
    const result = await this.getToolsByCompany(companyId, { pagination: { limit: 1000 } });
    const tools = result.data;

    const riskCounts = {
      critical: tools.filter((t) => t.riskLevel === 'Critical').length,
      high: tools.filter((t) => t.riskLevel === 'High').length,
      medium: tools.filter((t) => t.riskLevel === 'Medium').length,
      low: tools.filter((t) => t.riskLevel === 'Low').length,
    };

    const avgRiskScore =
      tools.length > 0
        ? Math.round(tools.reduce((sum, t) => sum + t.riskScore, 0) / tools.length)
        : 0;

    return {
      totalTools: tools.length,
      riskCounts,
      averageRiskScore: avgRiskScore,
      toolsRequiringAction: tools.filter((t) => t.riskLevel === 'Critical' || t.riskLevel === 'High'),
    };
  }

  /**
   * Export tools as CSV
   */
  static async exportToolsCSV(companyId: string): Promise<string> {
    const result = await this.getToolsByCompany(companyId, { pagination: { limit: 10000 } });
    const tools = result.data;

    const headers = [
      'Name',
      'Category',
      'Vendor',
      'Data Types',
      'Users',
      'Frequency',
      'Controls',
      'Risk Level',
      'Risk Score',
      'Has DPA',
      'Created At',
    ];

    const rows = tools.map((tool) => [
      tool.name,
      tool.category,
      tool.vendor || '',
      tool.dataTypes.join('; '),
      tool.users,
      tool.frequency,
      tool.controls.join('; '),
      tool.riskLevel,
      tool.riskScore,
      tool.hasDPA ? 'Yes' : 'No',
      tool.createdAt.toISOString().split('T')[0],
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
