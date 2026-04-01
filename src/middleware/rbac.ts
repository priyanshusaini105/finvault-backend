import type { NextFunction, Request, Response } from 'express';
import { ROLE_PERMISSIONS } from '@/constants/permissions';
import type { Permission } from '@/constants/permissions';
import { ApiError } from '@/utils/ApiError';

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role];

    if (!userPermissions.includes(permission)) {
      return next(ApiError.forbidden());
    }

    next();
  };
}
