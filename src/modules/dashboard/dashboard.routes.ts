import { Router, type Router as RouterType } from 'express';
import {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecent,
} from './dashboard.controller';
import { requireAuth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/rbac';
import { Permission } from '@/constants/permissions';

const router: RouterType = Router();

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary
 *     description: Returns total income, total expenses, and net balance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary fetched
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
 *                     totalIncome:
 *                       type: number
 *                       example: 15000.00
 *                     totalExpenses:
 *                       type: number
 *                       example: 8000.00
 *                     netBalance:
 *                       type: number
 *                       example: 7000.00
 *       403:
 *         description: Forbidden - requires dashboard:summary permission
 */
router.get(
  '/summary',
  requireAuth,
  requirePermission(Permission.DASHBOARD_SUMMARY),
  getSummary,
);

/**
 * @openapi
 * /dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly trends
 *     description: Returns grouped income/expense per month for the last 6 months
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends fetched
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
 *                       month:
 *                         type: string
 *                         example: "2025-01"
 *                       income:
 *                         type: number
 *                         example: 5000.00
 *                       expense:
 *                         type: number
 *                         example: 3000.00
 *       403:
 *         description: Forbidden - requires dashboard:analytics permission
 */
router.get(
  '/trends',
  requireAuth,
  requirePermission(Permission.DASHBOARD_ANALYTICS),
  getTrends,
);

/**
 * @openapi
 * /dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown
 *     description: Returns total per category with percentage of overall spend
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown fetched
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
 *                       category:
 *                         type: string
 *                         example: "Salary"
 *                       total:
 *                         type: number
 *                         example: 5000.00
 *                       percentage:
 *                         type: number
 *                         example: 33.33
 *       403:
 *         description: Forbidden - requires dashboard:analytics permission
 */
router.get(
  '/categories',
  requireAuth,
  requirePermission(Permission.DASHBOARD_ANALYTICS),
  getCategoryBreakdown,
);

/**
 * @openapi
 * /dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activity
 *     description: Returns the last 10 transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity fetched
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
 *       403:
 *         description: Forbidden - requires dashboard:summary permission
 */
router.get(
  '/recent',
  requireAuth,
  requirePermission(Permission.DASHBOARD_SUMMARY),
  getRecent,
);

export default router;
