import { HttpStatus } from '@/constants/httpStatus';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Array<{ field: string; issue: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ field: string; issue: string }>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(
      HttpStatus.UNAUTHORIZED,
      'UNAUTHORIZED',
      message,
    );
  }

  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(
      HttpStatus.FORBIDDEN,
      'FORBIDDEN',
      message,
    );
  }

  static notFound(resource: string) {
    return new ApiError(
      HttpStatus.NOT_FOUND,
      'NOT_FOUND',
      `${resource} not found`,
    );
  }

  static validation(
    message = 'Validation failed',
    details?: Array<{ field: string; issue: string }>,
  ) {
    return new ApiError(
      HttpStatus.BAD_REQUEST,
      'VALIDATION_ERROR',
      message,
      details,
    );
  }

  static conflict(message: string) {
    return new ApiError(HttpStatus.CONFLICT, 'CONFLICT', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(
      HttpStatus.INTERNAL_ERROR,
      'INTERNAL_ERROR',
      message,
    );
  }
}
