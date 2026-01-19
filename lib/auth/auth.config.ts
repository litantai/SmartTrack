import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { LoginSchema } from '@/lib/validations/auth';

export const authConfig = {
  // 1. 提供者配置
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        // 参数验证
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        // 数据库查询
        await connectToDatabase();
        const user = await User.findOne({ email, status: 'active' });
        if (!user) return null;

        // 密码验证
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 返回安全的用户信息
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar
        };
      }
    })
  ],

  // 2. 会话策略
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  // 3. 回调函数
  callbacks: {
    // JWT 回调：将 role 和 id 注入令牌
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // Session 回调：将 JWT 信息暴露给客户端
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },

  // 4. 自定义页面
  pages: {
    signIn: '/login',
    error: '/login', // 错误重定向到登录页
  },

  // 5. 密钥配置
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
