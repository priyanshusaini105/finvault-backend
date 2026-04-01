import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { HttpStatus } from '@/constants/httpStatus';

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { user, token } = await authService.register(req.body);
    return ApiResponse.success(
      res,
      'User registered successfully',
      { user, token },
      HttpStatus.CREATED,
    );
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { user, token } = await authService.login(req.body);
    return ApiResponse.success(res, 'Login successful', {
      user,
      token,
    });
  },
);

export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await authService.getMe(req.user!.userId);
    return ApiResponse.success(res, 'Profile fetched', user);
  },
);
