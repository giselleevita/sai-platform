import { Router } from 'express';
import { authMiddleware, requirePermission, Permission } from '../middleware';
import { asyncHandler } from '../utils';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { IntegrationsEvidentiaController } from '../controllers/integrations-evidentia.controller';
import { IntegrationsConnectorsController } from '../controllers/integrations-connectors.controller';
import { IntegrationsSsoController } from '../controllers/integrations-sso.controller';
import { IntegrationsScimController } from '../controllers/integrations-scim.controller';

const router = Router();

router.use(authMiddleware);

const evidentiaSettingsSchema = z.object({
  evidentiaSyncEnabled: z.boolean(),
});

const evidentiaLinkSchema = z.object({
  evidentiaTenantId: z.string().min(1).max(200),
  /** Env var name (or other runtime key) that resolves to a tenant-scoped bearer token. */
  secretRef: z.string().min(1).max(200),
});

const connectorCreateSchema = z.object({
  type: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const connectorUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const connectorIdParamsSchema = z.object({
  id: z.string().min(1),
});

const pushBodySchema = z
  .object({
    evidenceId: z.string().min(1).optional(),
  })
  .default({});

router.get(
  '/evidentia/settings',
  requirePermission(Permission.EVIDENCE_READ),
  asyncHandler(IntegrationsEvidentiaController.getSettings)
);
router.get(
  '/evidentia/link',
  requirePermission(Permission.EVIDENCE_READ),
  asyncHandler(IntegrationsEvidentiaController.getLink)
);
router.get(
  '/evidentia/status',
  requirePermission(Permission.EVIDENCE_READ),
  asyncHandler(IntegrationsEvidentiaController.status)
);
router.get(
  '/evidentia/external-evidence',
  requirePermission(Permission.EVIDENCE_READ),
  asyncHandler(IntegrationsEvidentiaController.listExternal)
);
router.post(
  '/evidentia/settings',
  requirePermission(Permission.USER_WRITE),
  validate({ body: evidentiaSettingsSchema }),
  asyncHandler(IntegrationsEvidentiaController.updateSettings)
);
router.post(
  '/evidentia/link',
  requirePermission(Permission.USER_WRITE),
  validate({ body: evidentiaLinkSchema }),
  asyncHandler(IntegrationsEvidentiaController.upsertLink)
);
router.post(
  '/evidentia/push',
  requirePermission(Permission.EVIDENCE_WRITE),
  validate({ body: pushBodySchema }),
  asyncHandler(IntegrationsEvidentiaController.push)
);

router.get(
  '/sso/connection',
  requirePermission(Permission.USER_READ),
  asyncHandler(IntegrationsSsoController.getConnection)
);
router.post(
  '/sso/connection',
  requirePermission(Permission.USER_WRITE),
  asyncHandler(IntegrationsSsoController.upsertConnection)
);
router.get(
  '/sso/domains',
  requirePermission(Permission.USER_READ),
  asyncHandler(IntegrationsSsoController.listDomains)
);
router.post(
  '/sso/domains',
  requirePermission(Permission.USER_WRITE),
  asyncHandler(IntegrationsSsoController.upsertDomain)
);
router.get(
  '/sso/group-role-mappings',
  requirePermission(Permission.USER_READ),
  asyncHandler(IntegrationsSsoController.listGroupRoleMappings)
);
router.post(
  '/sso/group-role-mappings',
  requirePermission(Permission.USER_WRITE),
  asyncHandler(IntegrationsSsoController.upsertGroupRoleMapping)
);

router.get(
  '/scim/tokens',
  requirePermission(Permission.USER_READ),
  asyncHandler(IntegrationsScimController.listTokens)
);
router.post(
  '/scim/tokens',
  requirePermission(Permission.USER_WRITE),
  asyncHandler(IntegrationsScimController.createToken)
);
router.post(
  '/scim/tokens/:id/revoke',
  requirePermission(Permission.USER_WRITE),
  asyncHandler(IntegrationsScimController.revokeToken)
);

router.get(
  '/connectors',
  requirePermission(Permission.COMPLIANCE_READ),
  asyncHandler(IntegrationsConnectorsController.list)
);
router.post(
  '/connectors',
  requirePermission(Permission.USER_WRITE),
  validate({ body: connectorCreateSchema }),
  asyncHandler(IntegrationsConnectorsController.create)
);
router.patch(
  '/connectors/:id',
  requirePermission(Permission.USER_WRITE),
  validate({ params: connectorIdParamsSchema, body: connectorUpdateSchema }),
  asyncHandler(IntegrationsConnectorsController.update)
);

export default router;
