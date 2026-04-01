import type { Response } from 'express';

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data: T,
    statusCode: number = 200,
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
    return res.status(200).json({
      success: true as const,
      message,
      data,
      meta,
    });
  }
}
