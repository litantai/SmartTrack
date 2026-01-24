import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { LoginSchema } from '@/lib/validations/auth';

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
            console.error('登录验证失败:', validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;

          // 数据库查询
          await connectToDatabase();
          const user = await User.findOne({ email, status: 'active' });
          if (!user) {
            console.log('用户不存在或已禁用:', email);
            return null;
          }

          // 密码验证
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            console.log('密码验证失败:', email);
            return null;
          }

          console.log('登录成功:', email);
          
          // 返回安全的用户信息
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar
          };
        } catch (error) {
          console.error('登录过程出错:', error);
          return null;
        }
      }
    })
  ],
});
