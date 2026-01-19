import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  // 1. 提供者配置 - 注意：在 Edge Runtime 中运行的配置不能包含数据库操作
  // 实际的认证逻辑在 auth.ts 中的 Node.js 运行时执行
  providers: [],

  // 2. 会话策略
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  // 3. 回调函数
  callbacks: {
    // 授权回调 - 用于中间件
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/login') || 
                         nextUrl.pathname.startsWith('/register');
      const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || 
                              nextUrl.pathname.startsWith('/admin');

      // 已登录用户访问登录/注册页，重定向到首页
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // 未登录用户访问受保护路由，重定向到登录页
      if (isProtectedRoute && !isLoggedIn) {
        return false; // 这会自动重定向到登录页
      }

      // 基于角色的访问控制
      if (isLoggedIn && isProtectedRoute) {
        const userRole = auth?.user?.role;
        
        // 管理员路由保护
        if (nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
      }

      return true;
    },

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
