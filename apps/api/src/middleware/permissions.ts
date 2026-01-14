import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Permission enum - defines all possible actions in the system
 */
export enum Permission {
  // Inventory/Tool permissions
  TOOL_READ = 'TOOL_READ',
  TOOL_WRITE = 'TOOL_WRITE',
  TOOL_DELETE = 'TOOL_DELETE',
  TOOL_EXPORT = 'TOOL_EXPORT',

  // Governance permissions
  POLICY_READ = 'POLICY_READ',
  POLICY_WRITE = 'POLICY_WRITE',
  POLICY_DELETE = 'POLICY_DELETE',
  CONTROL_READ = 'CONTROL_READ',
  CONTROL_WRITE = 'CONTROL_WRITE',
  CONTROL_APPROVE = 'CONTROL_APPROVE',
  CONTROL_DELETE = 'CONTROL_DELETE',
  PROCEDURE_READ = 'PROCEDURE_READ',
  PROCEDURE_WRITE = 'PROCEDURE_WRITE',
  REGULATION_READ = 'REGULATION_READ',
  REGULATION_WRITE = 'REGULATION_WRITE',

  // Risk permissions
  RISK_READ = 'RISK_READ',
  RISK_WRITE = 'RISK_WRITE',
  RISK_DECISION = 'RISK_DECISION', // Can make risk acceptance decisions
  RISK_DELETE = 'RISK_DELETE',

  // Evidence permissions
  EVIDENCE_READ = 'EVIDENCE_READ',
  EVIDENCE_WRITE = 'EVIDENCE_WRITE',
  EVIDENCE_APPROVE = 'EVIDENCE_APPROVE',
  EVIDENCE_DELETE = 'EVIDENCE_DELETE',

  // Incident permissions
  INCIDENT_READ = 'INCIDENT_READ',
  INCIDENT_WRITE = 'INCIDENT_WRITE',
  INCIDENT_ESCALATE = 'INCIDENT_ESCALATE',
  INCIDENT_RESOLVE = 'INCIDENT_RESOLVE',
  INCIDENT_DELETE = 'INCIDENT_DELETE',

  // Audit permissions
  AUDITLOG_READ = 'AUDITLOG_READ',
  AUDITLOG_EXPORT = 'AUDITLOG_EXPORT',

  // Compliance permissions
  COMPLIANCE_READ = 'COMPLIANCE_READ',
  COMPLIANCE_EXPORT = 'COMPLIANCE_EXPORT',

  // Reporting permissions
  REPORT_READ = 'REPORT_READ',
  REPORT_EXPORT = 'REPORT_EXPORT',

  // Exception permissions
  EXCEPTION_READ = 'EXCEPTION_READ',
  EXCEPTION_WRITE = 'EXCEPTION_WRITE',
  EXCEPTION_APPROVE = 'EXCEPTION_APPROVE',

  // Vendor permissions
  VENDOR_READ = 'VENDOR_READ',
  VENDOR_WRITE = 'VENDOR_WRITE',
  VENDOR_DELETE = 'VENDOR_DELETE',
}

/**
 * Role to permissions mapping
 * Defines what each role can do
 */
export const rolePermissions: Record<string, Permission[]> = {
  MANAGEMENT: [
    // Full access to everything
    Permission.TOOL_READ,
    Permission.TOOL_WRITE,
    Permission.TOOL_DELETE,
    Permission.TOOL_EXPORT,
    Permission.POLICY_READ,
    Permission.POLICY_WRITE,
    Permission.POLICY_DELETE,
    Permission.CONTROL_READ,
    Permission.CONTROL_WRITE,
    Permission.CONTROL_APPROVE,
    Permission.CONTROL_DELETE,
    Permission.PROCEDURE_READ,
    Permission.PROCEDURE_WRITE,
    Permission.REGULATION_READ,
    Permission.REGULATION_WRITE,
    Permission.RISK_READ,
    Permission.RISK_WRITE,
    Permission.RISK_DECISION,
    Permission.RISK_DELETE,
    Permission.EVIDENCE_READ,
    Permission.EVIDENCE_WRITE,
    Permission.EVIDENCE_APPROVE,
    Permission.EVIDENCE_DELETE,
    Permission.INCIDENT_READ,
    Permission.INCIDENT_WRITE,
    Permission.INCIDENT_ESCALATE,
    Permission.INCIDENT_RESOLVE,
    Permission.INCIDENT_DELETE,
    Permission.AUDITLOG_READ,
    Permission.AUDITLOG_EXPORT,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_EXPORT,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.EXCEPTION_READ,
    Permission.EXCEPTION_WRITE,
    Permission.EXCEPTION_APPROVE,
    Permission.VENDOR_READ,
    Permission.VENDOR_WRITE,
    Permission.VENDOR_DELETE,
  ],
  ADMIN: [
    // Full operational access, but may need approval for some decisions
    Permission.TOOL_READ,
    Permission.TOOL_WRITE,
    Permission.TOOL_DELETE,
    Permission.TOOL_EXPORT,
    Permission.POLICY_READ,
    Permission.POLICY_WRITE,
    Permission.POLICY_DELETE,
    Permission.CONTROL_READ,
    Permission.CONTROL_WRITE,
    Permission.CONTROL_APPROVE,
    Permission.CONTROL_DELETE,
    Permission.PROCEDURE_READ,
    Permission.PROCEDURE_WRITE,
    Permission.REGULATION_READ,
    Permission.REGULATION_WRITE,
    Permission.RISK_READ,
    Permission.RISK_WRITE,
    Permission.RISK_DECISION,
    Permission.RISK_DELETE,
    Permission.EVIDENCE_READ,
    Permission.EVIDENCE_WRITE,
    Permission.EVIDENCE_APPROVE,
    Permission.EVIDENCE_DELETE,
    Permission.INCIDENT_READ,
    Permission.INCIDENT_WRITE,
    Permission.INCIDENT_ESCALATE,
    Permission.INCIDENT_RESOLVE,
    Permission.INCIDENT_DELETE,
    Permission.AUDITLOG_READ,
    Permission.AUDITLOG_EXPORT,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_EXPORT,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.EXCEPTION_READ,
    Permission.EXCEPTION_WRITE,
    Permission.EXCEPTION_APPROVE,
    Permission.VENDOR_READ,
    Permission.VENDOR_WRITE,
    Permission.VENDOR_DELETE,
  ],
  OPERATOR: [
    // Can read and create, but limited write/delete
    Permission.TOOL_READ,
    Permission.TOOL_WRITE,
    Permission.TOOL_EXPORT,
    Permission.POLICY_READ,
    Permission.CONTROL_READ,
    Permission.PROCEDURE_READ,
    Permission.PROCEDURE_WRITE,
    Permission.REGULATION_READ,
    Permission.RISK_READ,
    Permission.RISK_WRITE,
    Permission.EVIDENCE_READ,
    Permission.EVIDENCE_WRITE,
    Permission.INCIDENT_READ,
    Permission.INCIDENT_WRITE,
    Permission.AUDITLOG_READ,
    Permission.COMPLIANCE_READ,
    Permission.REPORT_READ,
    Permission.EXCEPTION_READ,
    Permission.EXCEPTION_WRITE,
    Permission.VENDOR_READ,
    Permission.VENDOR_WRITE,
  ],
  AUDITOR: [
    // Read-only access for audit purposes
    Permission.TOOL_READ,
    Permission.TOOL_EXPORT,
    Permission.POLICY_READ,
    Permission.CONTROL_READ,
    Permission.PROCEDURE_READ,
    Permission.REGULATION_READ,
    Permission.RISK_READ,
    Permission.EVIDENCE_READ,
    Permission.EVIDENCE_APPROVE, // Auditors can approve evidence
    Permission.INCIDENT_READ,
    Permission.AUDITLOG_READ,
    Permission.AUDITLOG_EXPORT,
    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_EXPORT,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.EXCEPTION_READ,
    Permission.VENDOR_READ,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Middleware to require a specific permission
 * Returns 401 if unauthenticated, 403 if missing permission
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Missing required permission: ${permission}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Missing required permission. Required one of: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require all of the specified permissions
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Missing required permissions. Required all of: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}
