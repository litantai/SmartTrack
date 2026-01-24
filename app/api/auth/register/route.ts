import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { RegisterSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. 使用 Zod 验证请求参数
    const validatedFields = RegisterSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          error: validatedFields.error.issues[0].message,
          data: null
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validatedFields.data;

    // 2. 连接数据库
    await connectToDatabase();

    // 3. 检查邮箱是否已注册
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: '该邮箱已被注册',
          data: null
        },
        { status: 409 }
      );
    }

    // 4. 使用 bcrypt 哈希密码（加盐轮数：12）
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. 创建用户记录
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'driver', // 默认角色为试车员
      status: 'active'
    });

    // 6. 返回用户信息（不包含密码）
    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        error: null
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('注册错误:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '注册失败，请稍后重试';
    
    if (error instanceof Error) {
      // MongoDB 连接错误
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        errorMessage = '数据库连接失败，请检查网络连接';
      }
      // MongoDB 验证错误
      else if (error.message.includes('validation')) {
        errorMessage = '数据验证失败，请检查输入信息';
      }
      // 其他已知错误
      else if (error.message.includes('MONGODB_URI')) {
        errorMessage = '数据库配置错误';
      }
      
      console.error('详细错误信息:', error.message);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: null
      },
      { status: 500 }
    );
  }
}
