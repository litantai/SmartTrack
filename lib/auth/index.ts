import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { LoginSchema } from '@/lib/validations/auth';
import { AuthService, AuthServiceError } from '@/lib/db/services/auth.service';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 参数验证
          const validatedFields = LoginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            console.error('登录验证失败: 参数格式错误');
            return null;
          }

          // 调用 Service 层进行登录验证
          const result = await AuthService.validateLogin(validatedFields.data);

          console.log('用户登录成功');
          
          // 返回安全的用户信息
          return {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            image: result.user.avatar
          };
        } catch (error) {
          // 处理 Service 层错误
          if (error instanceof AuthServiceError) {
            console.error('登录失败:', error.message, error.code);
            return null;
          }

          console.error('登录过程出错:', error instanceof Error ? error.message : '未知错误');
          return null;
        }
      }
    })
  ],
});
