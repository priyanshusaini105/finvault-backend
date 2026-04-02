import type { Request, Response, NextFunction } from 'express';
import { recordsService } from './records.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { HttpStatus } from '@/constants/httpStatus';
import type { ListRecordsQueryInput } from './records.query.schema';

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
    const { type, category, dateFrom, dateTo, page, limit } =
      req.validatedQuery as ListRecordsQueryInput;
    const result = await recordsService.list({
      type,
      category,
      dateFrom,
      dateTo,
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
