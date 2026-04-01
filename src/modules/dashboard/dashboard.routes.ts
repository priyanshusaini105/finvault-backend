import { Router } from 'express';
import {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecent,
} from './dashboard.controller';
import { requireAuth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/rbac';
import { Permission } from '@/constants/permissions';

const router = Router();

router.get(
  '/summary',
  requireAuth,
  requirePermission(Permission.DASHBOARD_SUMMARY),
  getSummary,
);
router.get(
  '/trends',
  requireAuth,
  requirePermission(Permission.DASHBOARD_ANALYTICS),
  getTrends,
);
router.get(
  '/categories',
  requireAuth,
  requirePermission(Permission.DASHBOARD_ANALYTICS),
  getCategoryBreakdown,
);
router.get(
  '/recent',
  requireAuth,
  requirePermission(Permission.DASHBOARD_SUMMARY),
  getRecent,
);

export default router;
