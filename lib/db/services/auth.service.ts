/**
 * Auth Service Layer
 * 封装所有认证相关的业务逻辑，不包含 HTTP 相关代码
 * 职责：用户注册、登录验证、密码处理、账号状态检查
 */

import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongoose';
import User, { type IUser } from '@/lib/db/models/User';
import { RegisterInput, LoginInput } from '@/lib/validations/auth';

/**
 * 用户注册 DTO（数据传输对象）
 */
export interface RegisterDto extends RegisterInput {}

/**
 * 登录验证 DTO
 */
export interface LoginDto extends LoginInput {}

/**
 * 安全的用户信息（不包含密码）
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: IUser['role'];
  status: IUser['status'];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 注册结果
 */
export interface RegisterResult {
  success: true;
  user: SafeUser;
}

/**
 * 登录验证结果
 */
export interface LoginResult {
  success: true;
  user: SafeUser;
}

/**
 * 服务层错误类型
 */
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Auth Service 类
 * 所有方法都是静态方法，便于直接调用
 */
export class AuthService {
  /**
   * 用户注册
   * @param data 注册信息
   * @returns 注册成功的用户信息
   * @throws AuthServiceError
   */
  static async register(data: RegisterDto): Promise<RegisterResult> {
    try {
      // 1. 连接数据库
      await connectToDatabase();

      // 2. 检查邮箱是否已注册
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new AuthServiceError(
          '该邮箱已被注册',
          'DUPLICATE_EMAIL',
          { email: data.email }
        );
      }

      // 3. 哈希密码（加盐轮数：12）
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // 4. 创建用户记录
      const newUser = await User.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'driver', // 默认角色为试车员
        status: 'active',
      });

      // 5. 返回安全的用户信息
      return {
        success: true,
        user: this.toSafeUser(newUser),
      };
    } catch (error) {
      // 如果是已知的业务错误，直接抛出
      if (error instanceof AuthServiceError) {
        throw error;
      }

      // 处理数据库错误
      if (error instanceof Error) {
        // MongoDB 网络错误
        if (
          error.name === 'MongoNetworkError' ||
          error.name === 'MongooseServerSelectionError' ||
          error.message.toLowerCase().includes('connect') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT')
        ) {
          throw new AuthServiceError(
            '数据库连接失败，请检查网络连接',
            'DATABASE_ERROR',
            { originalError: error.message }
          );
        }

        // MongoDB 验证错误
        if (error.name === 'ValidationError') {
          throw new AuthServiceError(
            '数据验证失败，请检查输入信息',
            'VALIDATION_ERROR',
            { originalError: error.message }
          );
        }

        // 配置错误
        if (error.message.includes('MONGODB_URI')) {
          throw new AuthServiceError(
            '数据库配置错误',
            'DATABASE_ERROR',
            { originalError: error.message }
          );
        }
      }

      // 其他未知错误
      throw new AuthServiceError(
        '注册失败，请稍后重试',
        'INTERNAL_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 登录验证
   * @param data 登录凭证
   * @returns 验证成功的用户信息
   * @throws AuthServiceError
   */
  static async validateLogin(data: LoginDto): Promise<LoginResult> {
    try {
      // 1. 连接数据库
      await connectToDatabase();

      // 2. 查询用户（仅查询活跃用户）
      const user = await User.findOne({ email: data.email, status: 'active' });
      if (!user) {
        throw new AuthServiceError(
          '邮箱或密码错误',
          'INVALID_CREDENTIALS'
        );
      }

      // 3. 验证密码
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new AuthServiceError(
          '邮箱或密码错误',
          'INVALID_CREDENTIALS'
        );
      }

      // 4. 返回安全的用户信息
      return {
        success: true,
        user: this.toSafeUser(user),
      };
    } catch (error) {
      // 如果是已知的业务错误，直接抛出
      if (error instanceof AuthServiceError) {
        throw error;
      }

      // 处理数据库连接错误
      if (error instanceof Error) {
        if (
          error.name === 'MongoNetworkError' ||
          error.name === 'MongooseServerSelectionError' ||
          error.message.toLowerCase().includes('connect')
        ) {
          throw new AuthServiceError(
            '数据库连接失败，请检查网络连接',
            'DATABASE_ERROR',
            { originalError: error.message }
          );
        }
      }

      // 其他未知错误
      throw new AuthServiceError(
        '登录验证失败，请稍后重试',
        'INTERNAL_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 通过邮箱查找用户
   * @param email 邮箱地址
   * @returns 用户信息或 null
   */
  static async findUserByEmail(email: string): Promise<SafeUser | null> {
    try {
      await connectToDatabase();
      const user = await User.findOne({ email });
      return user ? this.toSafeUser(user) : null;
    } catch (error) {
      throw new AuthServiceError(
        '查询用户失败',
        'DATABASE_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 检查邮箱是否已存在
   * @param email 邮箱地址
   * @returns 是否存在
   */
  static async isEmailExists(email: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const count = await User.countDocuments({ email });
      return count > 0;
    } catch (error) {
      throw new AuthServiceError(
        '检查邮箱失败',
        'DATABASE_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 验证密码强度
   * @param password 明文密码
   * @returns 是否符合强度要求
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('密码至少8个字符');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密码需包含小写字母');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密码需包含大写字母');
    }

    if (!/\d/.test(password)) {
      errors.push('密码需包含数字');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 哈希密码（用于单独调用）
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * 验证密码（用于单独调用）
   * @param password 明文密码
   * @param hashedPassword 哈希后的密码
   * @returns 是否匹配
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 将 Mongoose 文档转换为安全的用户对象（不包含密码）
   * @param user Mongoose User 文档
   * @returns 安全的用户信息
   */
  private static toSafeUser(user: IUser): SafeUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
