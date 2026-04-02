import { Router, type Router as RouterType } from 'express';
import {
  listUsers,
  getUserById,
  updateRole,
  toggleStatus,
  softDeleteUser,
} from './users.controller';
import { requireAuth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/rbac';
import { validate, validateQuery } from '@/middleware/validate';
import { Permission } from '@/constants/permissions';
import { updateRoleSchema, updateStatusSchema } from './users.schemas';
import { listUsersQuerySchema } from './users.query.schema';

const router: RouterType = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [VIEWER, ANALYST, ADMIN]
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       403:
 *         description: Forbidden - requires users:manage permission
 */
router.get(
  '/',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  validateQuery(listUsersQuerySchema),
  listUsers,
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [VIEWER, ANALYST, ADMIN]
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - requires users:manage permission
 *       404:
 *         description: User not found
 */
router.get('/:id', requireAuth, requirePermission(Permission.USERS_MANAGE), getUserById);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       200:
 *         description: User role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [VIEWER, ANALYST, ADMIN]
 *                     isActive:
 *                       type: boolean
 *       403:
 *         description: Forbidden - requires users:manage permission
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id/role',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  validate(updateRoleSchema),
  updateRole,
);

/**
 * @openapi
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Toggle user active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [VIEWER, ANALYST, ADMIN]
 *                     isActive:
 *                       type: boolean
 *       403:
 *         description: Forbidden - requires users:manage permission
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id/status',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  validate(updateStatusSchema),
  toggleStatus,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [VIEWER, ANALYST, ADMIN]
 *                     isActive:
 *                       type: boolean
 *       403:
 *         description: Forbidden - requires users:manage permission
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission(Permission.USERS_MANAGE),
  softDeleteUser,
);

export default router;
