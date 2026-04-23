import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { GovernanceController } from '../controllers';
import { GovernanceExportController } from '../controllers/governance-export.controller';
import { validate } from '../middleware/validation';
import {
  createControlSchema,
  createPolicySchema,
  createProcedureSchema,
  createRegulationSchema,
  updateControlSchema,
  updatePolicySchema,
  updateProcedureSchema,
  updateRegulationSchema,
} from '../validation/schemas';

const router = Router();

router.use(authMiddleware);

// Policies
router.get('/policies', requirePermission(Permission.POLICY_READ), asyncHandler(GovernanceController.listPolicies));
router.post(
  '/policies',
  requirePermission(Permission.POLICY_WRITE),
  validate({ body: createPolicySchema }),
  asyncHandler(GovernanceController.createPolicy)
);
router.patch(
  '/policies/:id',
  requirePermission(Permission.POLICY_WRITE),
  validate({ body: updatePolicySchema }),
  asyncHandler(GovernanceController.updatePolicy)
);
router.delete(
  '/policies/:id',
  requirePermission(Permission.POLICY_DELETE),
  asyncHandler(GovernanceController.deletePolicy)
);

// Controls
router.get('/controls', requirePermission(Permission.CONTROL_READ), asyncHandler(GovernanceController.listControls));
router.post(
  '/controls',
  requirePermission(Permission.CONTROL_WRITE),
  validate({ body: createControlSchema }),
  asyncHandler(GovernanceController.createControl)
);
router.patch(
  '/controls/:id',
  requirePermission(Permission.CONTROL_WRITE),
  validate({ body: updateControlSchema }),
  asyncHandler(GovernanceController.updateControl)
);
router.delete(
  '/controls/:id',
  requirePermission(Permission.CONTROL_DELETE),
  asyncHandler(GovernanceController.deleteControl)
);

// Procedures
router.get('/procedures', requirePermission(Permission.PROCEDURE_READ), asyncHandler(GovernanceController.listProcedures));
router.post(
  '/procedures',
  requirePermission(Permission.PROCEDURE_WRITE),
  validate({ body: createProcedureSchema }),
  asyncHandler(GovernanceController.createProcedure)
);
router.patch(
  '/procedures/:id',
  requirePermission(Permission.PROCEDURE_WRITE),
  validate({ body: updateProcedureSchema }),
  asyncHandler(GovernanceController.updateProcedure)
);
router.delete(
  '/procedures/:id',
  requirePermission(Permission.PROCEDURE_WRITE), // Using WRITE for delete as there's no PROCEDURE_DELETE
  asyncHandler(GovernanceController.deleteProcedure)
);

// Regulations
router.get('/regulations', requirePermission(Permission.REGULATION_READ), asyncHandler(GovernanceController.listRegulations));
router.post(
  '/regulations',
  requirePermission(Permission.REGULATION_WRITE),
  validate({ body: createRegulationSchema }),
  asyncHandler(GovernanceController.createRegulation)
);
router.patch(
  '/regulations/:id',
  requirePermission(Permission.REGULATION_WRITE),
  validate({ body: updateRegulationSchema }),
  asyncHandler(GovernanceController.updateRegulation)
);
router.delete(
  '/regulations/:id',
  requirePermission(Permission.REGULATION_WRITE), // Using WRITE for delete as there's no REGULATION_DELETE
  asyncHandler(GovernanceController.deleteRegulation)
);

router.get(
  '/compliance-snapshots',
  requirePermission(Permission.COMPLIANCE_READ),
  asyncHandler(GovernanceController.listComplianceSnapshots)
);
router.post(
  '/compliance-snapshots',
  requirePermission(Permission.COMPLIANCE_EXPORT),
  asyncHandler(GovernanceController.createComplianceSnapshot)
);

router.get(
  '/export-manifest',
  requirePermission(Permission.COMPLIANCE_EXPORT),
  asyncHandler(GovernanceExportController.exportManifest)
);

export default router;
