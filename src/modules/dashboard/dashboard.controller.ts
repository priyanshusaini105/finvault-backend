import type { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const getSummary = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getSummary();
    return ApiResponse.success(
      res,
      'Dashboard summary fetched',
      data,
    );
  },
);

export const getTrends = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getTrends();
    return ApiResponse.success(
      res,
      'Monthly trends fetched',
      data,
    );
  },
);

export const getCategoryBreakdown = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data =
      await dashboardService.getCategoryBreakdown();
    return ApiResponse.success(
      res,
      'Category breakdown fetched',
      data,
    );
  },
);

export const getRecent = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getRecent();
    return ApiResponse.success(
      res,
      'Recent activity fetched',
      data,
    );
  },
);
