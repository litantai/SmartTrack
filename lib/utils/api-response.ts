/**
 * API 响应工具函数
 * 提供统一的 API 响应格式化方法，确保所有 API Routes 返回一致的结构
 */

import { NextResponse } from 'next/server';
import type { ApiSuccessResponse, ApiErrorResponse, ApiMeta, ApiErrorCodeType } from '@/lib/types/api';
import { ApiErrorCode } from '@/lib/types/api';

/**
 * 创建成功响应
 * @param data 响应数据
 * @param meta 可选的元数据（分页、时间戳等）
 * @param status HTTP 状态码（默认 200）
 * @returns NextResponse
 */
export function successResponse<T>(
  data: T,
  meta?: ApiMeta,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: meta ? { ...meta, timestamp: new Date().toISOString() } : { timestamp: new Date().toISOString() },
    },
    { status }
  );
}

/**
 * 创建错误响应
 * @param code 错误代码
 * @param message 错误消息
 * @param details 可选的错误详情
 * @param status HTTP 状态码（默认 400）
 * @returns NextResponse
 */
export function errorResponse(
  code: ApiErrorCodeType | string,
  message: string,
  details?: Record<string, any>,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * 创建验证错误响应
 * @param message 错误消息
 * @param details 验证详情（字段、约束等）
 * @returns NextResponse
 */
export function validationErrorResponse(
  message: string = '输入验证失败',
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  return errorResponse(ApiErrorCode.VALIDATION_ERROR, message, details, 400);
}

/**
 * 创建未授权响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function unauthorizedResponse(
  message: string = '未授权，请先登录'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ApiErrorCode.UNAUTHORIZED, message, undefined, 401);
}

/**
 * 创建禁止访问响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function forbiddenResponse(
  message: string = '无权限访问此资源'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ApiErrorCode.FORBIDDEN, message, undefined, 403);
}

/**
 * 创建资源未找到响应
 * @param resource 资源名称
 * @returns NextResponse
 */
export function notFoundResponse(
  resource: string = '资源'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ApiErrorCode.NOT_FOUND, `${resource}不存在`, undefined, 404);
}

/**
 * 创建资源冲突响应（如唯一性冲突）
 * @param message 错误消息
 * @param details 冲突详情
 * @returns NextResponse
 */
export function conflictResponse(
  message: string,
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  return errorResponse(ApiErrorCode.CONFLICT, message, details, 409);
}

/**
 * 创建服务器内部错误响应
 * @param message 错误消息
 * @param details 错误详情（仅在开发环境返回）
 * @returns NextResponse
 */
export function internalErrorResponse(
  message: string = '服务器内部错误',
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  // 生产环境不暴露详细错误
  const isDevelopment = process.env.NODE_ENV === 'development';
  return errorResponse(
    ApiErrorCode.INTERNAL_ERROR,
    message,
    isDevelopment ? details : undefined,
    500
  );
}

/**
 * 创建数据库错误响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function databaseErrorResponse(
  message: string = '数据库操作失败'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ApiErrorCode.DATABASE_ERROR, message, undefined, 500);
}

/**
 * 创建分页元数据
 * @param page 当前页码
 * @param pageSize 每页数量
 * @param total 总记录数
 * @returns ApiMeta
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): ApiMeta {
  return {
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
