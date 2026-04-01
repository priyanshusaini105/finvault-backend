import type { Request, Response, NextFunction } from 'express';
import { recordsService } from './records.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { HttpStatus } from '@/constants/httpStatus';

export const createRecord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const record = await recordsService.create(
      req.body,
      req.user!.userId,
    );
    return ApiResponse.success(
      res,
      'Record created successfully',
      record,
      HttpStatus.CREATED,
    );
  },
);

export const listRecords = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await recordsService.list({
      type: req.query.type as string | undefined,
      category: req.query.category as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      page,
      limit,
    });
    return ApiResponse.paginated(
      res,
      'Records fetched successfully',
      result.records,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    );
  },
);

export const getRecord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const record = await recordsService.getById(
      req.params.id as string,
    );
    return ApiResponse.success(
      res,
      'Record fetched successfully',
      record,
    );
  },
);

export const updateRecord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const record = await recordsService.update(
      req.params.id as string,
      req.body,
    );
    return ApiResponse.success(
      res,
      'Record updated successfully',
      record,
    );
  },
);

export const deleteRecord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const record = await recordsService.softDelete(
      req.params.id as string,
    );
    return ApiResponse.success(
      res,
      'Record deleted successfully',
      record,
    );
  },
);
