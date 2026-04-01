import { Router } from 'express';
import {
  listUsers,
  updateRole,
  toggleStatus,
  softDeleteUser,
} from './users.controller';
import { requireAuth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/rbac';
import { Permission } from '@/constants/permissions';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  listUsers,
);
router.patch(
  '/:id/role',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  updateRole,
);
router.patch(
  '/:id/status',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  toggleStatus,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  softDeleteUser,
);

export default router;
