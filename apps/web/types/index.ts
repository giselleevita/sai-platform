// Shared TypeScript types for frontend

export interface Tool {
  id: string;
  name: string;
  category: string;
  vendor?: string;
  description?: string;
  url?: string;
  riskLevel: string;
  riskScore: number;
  users: number;
  frequency: string;
  dataTypes: string[];
  controls: string[];
  hasDPA: boolean;
  dataResidency?: string;
  notes?: string;
  // Governance metadata (optional, enriched in UI)
  decisionStatus?: string;
  decisionOwner?: string;
  decisionOwnerId?: string;
  decisionOwnerRole?: string;
  decisionRationale?: string;
  decisionExpiresAt?: string;
  reviewDate?: string;
  applicablePolicies?: string[];
  complianceStatus?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskSummary {
  totalTools: number;
  riskCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averageRiskScore: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ComplianceSnapshot {
  timestamp: string;
  percentCompliant: number;
  highRiskUnresolved: number;
  missingDecisions: number;
  overdueReviews: number;
}

export interface ToolDecisionLog {
  id: string;
  toolId: string;
  decision: string;
  rationale?: string;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}
