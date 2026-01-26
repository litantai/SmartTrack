import { NextRequest } from 'next/server';
import { RegisterSchema } from '@/lib/validations/auth';
import { AuthService, AuthServiceError } from '@/lib/db/services/auth.service';
import {
  successResponse,
  validationErrorResponse,
  conflictResponse,
  databaseErrorResponse,
  internalErrorResponse,
} from '@/lib/utils/api-response';
import { ApiErrorCode } from '@/lib/types/api';

// 显式声明使用 Node.js Runtime（局域网部署要求）
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. 使用 Zod 验证请求参数
    const validatedFields = RegisterSchema.safeParse(body);
    if (!validatedFields.success) {
      return validationErrorResponse(
        validatedFields.error.issues[0].message,
        { field: validatedFields.error.issues[0].path[0] }
      );
    }

    // 2. 调用 Service 层处理业务逻辑
    const result = await AuthService.register(validatedFields.data);

    // 3. 返回成功响应
    return successResponse(
      {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('注册错误:', error);

    // 处理 Service 层抛出的业务错误
    if (error instanceof AuthServiceError) {
      switch (error.code) {
        case 'DUPLICATE_EMAIL':
          return conflictResponse(error.message, error.details);
        case 'DATABASE_ERROR':
          return databaseErrorResponse(error.message);
        case 'VALIDATION_ERROR':
          return validationErrorResponse(error.message, error.details);
        default:
          return internalErrorResponse(error.message);
      }
    }

    // 其他未知错误
    return internalErrorResponse(
      '注册失败，请稍后重试',
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}
