import { Router, type Router as RouterType } from 'express';
import {
  createRecord,
  listRecords,
  getRecord,
  updateRecord,
  deleteRecord,
} from './records.controller';
import { requireAuth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/rbac';
import { validate, validateQuery } from '@/middleware/validate';
import { Permission } from '@/constants/permissions';
import {
  createRecordSchema,
  updateRecordSchema,
} from './records.schemas';
import { listRecordsQuerySchema } from './records.query.schema';

const router: RouterType = Router();

/**
 * @openapi
 * /records:
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 1500.00
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-01-15T00:00:00.000Z
 *               notes:
 *                 type: string
 *                 example: Monthly salary
 *     responses:
 *       201:
 *         description: Record created successfully
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
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE]
 *                     category:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - requires records:write permission
 */
router.post(
  '/',
  requireAuth,
  requirePermission(Permission.RECORDS_WRITE),
  validate(createRecordSchema),
  createRecord,
);

/**
 * @openapi
 * /records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
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
 *         description: Records fetched successfully
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
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [INCOME, EXPENSE]
 *                       category:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       notes:
 *                         type: string
 *                       createdBy:
 *                         type: string
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
 *         description: Forbidden - requires records:read permission
 */
router.get(
  '/',
  requireAuth,
  requirePermission(Permission.RECORDS_READ),
  validateQuery(listRecordsQuerySchema),
  listRecords,
);

/**
 * @openapi
 * /records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get a single financial record
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
 *         description: Record fetched successfully
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
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE]
 *                     category:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - requires records:read permission
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  requireAuth,
  requirePermission(Permission.RECORDS_READ),
  getRecord,
);

/**
 * @openapi
 * /records/{id}:
 *   patch:
 *     tags: [Records]
 *     summary: Update a financial record
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
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated successfully
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
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE]
 *                     category:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - requires records:write permission
 *       404:
 *         description: Record not found
 */
router.patch(
  '/:id',
  requireAuth,
  requirePermission(Permission.RECORDS_WRITE),
  validate(updateRecordSchema),
  updateRecord,
);

/**
 * @openapi
 * /records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft delete a financial record
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
 *         description: Record deleted successfully
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
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE]
 *                     category:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - requires records:delete permission
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission(Permission.RECORDS_DELETE),
  deleteRecord,
);

export default router;
