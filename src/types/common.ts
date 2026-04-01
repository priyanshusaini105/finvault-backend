export interface IApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface IApiError {
  success: false;
  message: string;
  code: string;
  details?: Array<{ field: string; issue: string }>;
}
