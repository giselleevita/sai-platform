import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mfaCode: z.string().length(6).optional(),
  recoveryCode: z.string().optional(),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  name: z.string().min(1, 'Name is required').max(100),
  companyName: z.string().min(1, 'Company name is required').max(200),
  industry: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

// Tool schemas
export const createToolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required'),
  vendor: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  dataTypes: z.array(z.string()).min(1, 'At least one data type is required'),
  users: z.number().int().min(0, 'Users must be a positive number'),
  frequency: z.enum(['Daily', 'Weekly', 'Rarely']),
  controls: z.array(z.string()).default([]),
  hasDPA: z.boolean().default(false),
  dataResidency: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateToolSchema = createToolSchema.partial();

// ML Integration schemas
export const createMLIntegrationSchema = z.object({
  provider: z.enum(['MLFLOW', 'SAGEMAKER', 'VERTEX_AI', 'OTHER']),
  displayName: z.string().min(1, 'Display name is required').max(200),
  status: z.enum(['ACTIVE', 'DISABLED', 'ERROR']).optional(),
  config: z.record(z.string(), z.any()).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateMLIntegrationSchema = createMLIntegrationSchema.partial();

export const gpaiCreateSchema = z.object({
  provider: z.enum(['MLFLOW', 'SAGEMAKER', 'VERTEX_AI', 'OTHER']),
  displayName: z.string().min(1, 'Display name is required').max(200),
  modelFamily: z.string().min(1, 'Model family is required').max(200),
  transparencySummary: z.string().max(4000).optional(),
  euDeclarationRef: z.string().max(200).optional(),
  status: z.enum(['ACTIVE', 'DISABLED', 'ERROR']).optional(),
});

export const conformityAssessmentSchema = z.object({
  systemName: z.string().min(1, 'System name is required').max(200),
  euAiActTier: z.enum(['high-risk', 'limited-risk', 'minimal-risk']),
  hasRiskManagement: z.boolean(),
  hasTechnicalDocumentation: z.boolean(),
  hasHumanOversight: z.boolean(),
  hasMonitoringPlan: z.boolean(),
});

/** PATCH /api/inventory/:id/governance — persisted under AITool.customFields.toolGovernance.profile */
export const toolGovernancePatchSchema = z
  .object({
    decisionStatus: z.string().max(500).optional(),
    decisionOwner: z.string().max(500).optional(),
    decisionOwnerRole: z.string().max(500).optional(),
    decisionRationale: z.string().max(4000).optional(),
    decisionExpiresAt: z.string().max(100).optional(),
    reviewDate: z.string().max(100).optional(),
    applicablePolicies: z.array(z.string()).optional(),
    complianceStatus: z.string().max(500).optional(),
  })
  .strict();

// Risk schemas
export const createRiskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  likelihood: z.number().int().min(1, 'Likelihood must be between 1 and 5').max(5, 'Likelihood must be between 1 and 5'),
  impact: z.number().int().min(1, 'Impact must be between 1 and 5').max(5, 'Impact must be between 1 and 5'),
  category: z.string().min(1, 'Category is required').max(100),
  ownerId: z.string().optional(),
  controlIds: z.array(z.string()).default([]),
});

export const updateRiskSchema = createRiskSchema.partial();

export const riskDecisionSchema = z.object({
  decision: z.enum(['ACCEPTED', 'DEFERRED', 'REJECTED']),
  rationale: z.string().max(2000).optional(),
});

export const riskClassificationSchema = z.object({
  systemName: z.string().min(1, 'System name is required').max(200),
  domain: z.enum([
    'biometric-identification',
    'critical-infrastructure',
    'education',
    'employment',
    'essential-services',
    'law-enforcement',
    'migration-border',
    'justice-democracy',
    'other',
  ]),
  hasBiometricIdentification: z.boolean().optional(),
  isSafetyComponent: z.boolean().optional(),
  impactsFundamentalRights: z.boolean().optional(),
  userScale: z.number().int().min(0).optional(),
});

// Incident schemas
export const createIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  status: z.enum(['DETECTED', 'CLASSIFIED', 'ESCALATED', 'RESOLVED', 'REVIEWED']).optional(),
  detectedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  reportedAt: z.string().datetime().optional(),
  ownerId: z.string().optional(),
  toolId: z.string().optional(),
});

export const updateIncidentSchema = createIncidentSchema.partial();

// Policy schemas
export const createPolicySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'RETIRED', 'DEPRECATED']).default('DRAFT'),
  ownerId: z.string().optional(),
  approverId: z.string().optional(),
  reviewerId: z.string().optional(),
});

export const updatePolicySchema = createPolicySchema.partial();

// Control schemas
export const createControlSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  policyId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'RETIRED', 'DEPRECATED']).default('DRAFT'),
  ownerId: z.string().optional(),
  approverId: z.string().optional(),
  reviewerId: z.string().optional(),
});

export const updateControlSchema = createControlSchema.partial();

export const createProcedureSchema = z.object({
  controlId: z.string().min(1, 'Control ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  steps: z.record(z.string(), z.any()).optional(),
});

export const updateProcedureSchema = createProcedureSchema.partial();

export const createRegulationSchema = z.object({
  framework: z.string().min(1, 'Framework is required').max(100),
  article: z.string().max(100).optional(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
});

export const updateRegulationSchema = createRegulationSchema.partial();

// Evidence schemas
export const createEvidenceSchema = z.object({
  controlId: z.string().min(1, 'Control ID is required'),
  source: z.string().min(1).max(200).default('SAI'),
  reference: z.string().max(1000).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  status: z
    .enum(['PENDING', 'REJECTED', 'MISSING', 'SUBMITTED', 'APPROVED', 'EXPIRED'])
    .default('SUBMITTED'),
  collectionMethod: z.string().max(100).optional(),
});

export const updateEvidenceSchema = createEvidenceSchema.partial().extend({
  assignedReviewerId: z.string().max(100).nullable().optional(),
  reviewNote: z.string().max(2000).nullable().optional(),
});

// Bulk operations schemas
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required').max(100, 'Cannot delete more than 100 items at once'),
});

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required').max(100, 'Cannot update more than 100 items at once'),
  updates: z.record(z.string(), z.any()),
});

// Invitations + user admin schemas
export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['MANAGEMENT', 'ADMIN', 'OPERATOR', 'AUDITOR']).default('OPERATOR'),
  expiresInDays: z.coerce.number().int().min(1).max(30).optional(),
});

export const updateUserSchema = z.object({
  role: z.enum(['MANAGEMENT', 'ADMIN', 'OPERATOR', 'AUDITOR']).optional(),
  disabled: z.boolean().optional(),
});
