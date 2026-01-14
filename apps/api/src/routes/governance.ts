import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { GovernanceController } from '../controllers';

const router = Router();

router.use(authMiddleware);

// Policies
router.get('/policies', requirePermission(Permission.POLICY_READ), asyncHandler(GovernanceController.listPolicies));
router.post(
  '/policies',
  requirePermission(Permission.POLICY_WRITE),
  asyncHandler(GovernanceController.createPolicy)
);
router.patch(
  '/policies/:id',
  requirePermission(Permission.POLICY_WRITE),
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
  asyncHandler(GovernanceController.createControl)
);
router.patch(
  '/controls/:id',
  requirePermission(Permission.CONTROL_WRITE),
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
  asyncHandler(GovernanceController.createProcedure)
);
router.patch(
  '/procedures/:id',
  requirePermission(Permission.PROCEDURE_WRITE),
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
  asyncHandler(GovernanceController.createRegulation)
);
router.patch(
  '/regulations/:id',
  requirePermission(Permission.REGULATION_WRITE),
  asyncHandler(GovernanceController.updateRegulation)
);
router.delete(
  '/regulations/:id',
  requirePermission(Permission.REGULATION_WRITE), // Using WRITE for delete as there's no REGULATION_DELETE
  asyncHandler(GovernanceController.deleteRegulation)
);

export default router;
