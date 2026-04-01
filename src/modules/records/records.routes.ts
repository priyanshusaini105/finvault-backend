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
import { validate } from '@/middleware/validate';
import { Permission } from '@/constants/permissions';
import {
  createRecordSchema,
  updateRecordSchema,
} from './records.schemas';

const router: RouterType = Router();

router.post(
  '/',
  requireAuth,
  requirePermission(Permission.RECORDS_WRITE),
  validate(createRecordSchema),
  createRecord,
);
router.get(
  '/',
  requireAuth,
  requirePermission(Permission.RECORDS_READ),
  listRecords,
);
router.get(
  '/:id',
  requireAuth,
  requirePermission(Permission.RECORDS_READ),
  getRecord,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission(Permission.RECORDS_WRITE),
  validate(updateRecordSchema),
  updateRecord,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission(Permission.RECORDS_DELETE),
  deleteRecord,
);

export default router;
