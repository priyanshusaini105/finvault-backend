import type { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { Role } from '@prisma/client';
import type { ListUsersQueryInput } from './users.query.schema';

export const listUsers = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit } = req.validatedQuery as ListUsersQueryInput;
    const result = await usersService.list(page, limit);
    return ApiResponse.paginated(
      res,
      'Users fetched successfully',
      result.users,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    );
  },
);

export const updateRole = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { role } = req.body as { role: Role };
    const user = await usersService.updateRole(
      req.params.id as string,
      role,
    );
    return ApiResponse.success(res, 'User role updated', user);
  },
);

export const toggleStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { isActive } = req.body as { isActive: boolean };
    const user = await usersService.toggleStatus(
      req.params.id as string,
      isActive,
    );
    return ApiResponse.success(res, 'User status updated', user);
  },
);

export const softDeleteUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await usersService.softDelete(
      req.params.id as string,
    );
    return ApiResponse.success(res, 'User deactivated', user);
  },
);
