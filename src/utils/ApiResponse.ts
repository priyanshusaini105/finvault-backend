import type { Response } from 'express';
import { HttpStatus } from '@/constants/httpStatus';

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data: T,
    statusCode = HttpStatus.OK,
  ) {
    return res.status(statusCode).json({
      success: true as const,
      message,
      data,
    });
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T,
    meta: { page: number; limit: number; total: number },
  ) {
    return res.status(HttpStatus.OK).json({
      success: true as const,
      message,
      data,
      meta,
    });
  }
}
