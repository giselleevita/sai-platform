import { Router } from 'express';
import { asyncHandler } from '../utils';
import { scimAuthMiddleware } from '../middleware/scimAuth';
import { ScimUsersController } from '../controllers/scim-users.controller';

const router = Router();

// SCIM v2 (subset): Users
router.get('/Users', scimAuthMiddleware, asyncHandler(ScimUsersController.list));
router.post('/Users', scimAuthMiddleware, asyncHandler(ScimUsersController.create));
router.get('/Users/:id', scimAuthMiddleware, asyncHandler(ScimUsersController.get));
router.patch('/Users/:id', scimAuthMiddleware, asyncHandler(ScimUsersController.patch));
router.delete('/Users/:id', scimAuthMiddleware, asyncHandler(ScimUsersController.delete));

export default router;

