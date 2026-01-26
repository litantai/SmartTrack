/**
 * API 响应类型定义
 * 定义统一的 API 响应格式，确保所有 API Routes 返回一致的数据结构
 */

/**
 * 标准 API 成功响应
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  error: null;
  meta?: ApiMeta;
}

/**
 * 标准 API 错误响应
 */
export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiError;
}

/**
 * 通用 API 响应类型
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API 错误详情
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * API 元数据（分页、排序等）
 */
export interface ApiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
  timestamp?: string;
  [key: string]: any;
}

/**
 * 常见 API 错误代码
 */
export const ApiErrorCode = {
  // 客户端错误 (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  
  // 服务器错误 (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // 业务逻辑错误
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
} as const;

export type ApiErrorCodeType = typeof ApiErrorCode[keyof typeof ApiErrorCode];
