/**
 * Auth Service 单元测试 (使用 Mock)
 * 测试用户注册、登录验证、密码处理等核心业务逻辑
 * 
 * 注意：此测试使用 Mock 模拟数据库操作，无需真实 MongoDB 连接
 */

import { AuthService, AuthServiceError } from '@/lib/db/services/auth.service';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Mock mongoose 模块
jest.mock('@/lib/db/mongoose', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock User 模型
jest.mock('@/lib/db/models/User');

// Mock bcrypt
jest.mock('bcryptjs');

// 测试数据
const validUserData = {
  name: '张三',
  email: 'zhangsan@example.com',
  password: 'Password123',
  role: 'driver' as const,
};

const mockUserId = '507f1f77bcf86cd799439011';

const mockUser = {
  _id: new mongoose.Types.ObjectId(mockUserId),
  name: validUserData.name,
  email: validUserData.email,
  password: '$2a$12$hashedPassword',
  role: validUserData.role,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // Mock 数据库操作
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashedPassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.register(validUserData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe(validUserData.name);
      expect(result.user.email).toBe(validUserData.email);
      expect(result.user.role).toBe(validUserData.role);
      expect(result.user.status).toBe('active');
      expect(result.user.id).toBeDefined();

      // 验证调用了正确的方法
      expect(User.findOne).toHaveBeenCalledWith({ email: validUserData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 12);
      expect(User.create).toHaveBeenCalled();
    });

    it('应该拒绝重复的邮箱', async () => {
      // Mock 找到已存在的用户
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        AuthService.register(validUserData)
      ).rejects.toThrow(AuthServiceError);

      await expect(
        AuthService.register(validUserData)
      ).rejects.toMatchObject({
        code: 'DUPLICATE_EMAIL',
        message: '该邮箱已被注册',
      });
    });

    it('应该使用默认角色（driver）如果未指定', async () => {
      const dataWithoutRole = {
        name: validUserData.name,
        email: validUserData.email,
        password: validUserData.password,
      };

      const mockUserWithDefaultRole = {
        ...mockUser,
        role: 'driver',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashedPassword');
      (User.create as jest.Mock).mockResolvedValue(mockUserWithDefaultRole);

      const result = await AuthService.register(dataWithoutRole);
      expect(result.user.role).toBe('driver');
    });

    it('应该返回不包含密码的安全用户信息', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashedPassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.register(validUserData);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('应该处理数据库连接错误', async () => {
      const mockError = new Error('ECONNREFUSED');
      mockError.name = 'MongoNetworkError';
      (User.findOne as jest.Mock).mockRejectedValue(mockError);

      await expect(
        AuthService.register(validUserData)
      ).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
        message: '数据库连接失败，请检查网络连接',
      });
    });
  });

  describe('validateLogin', () => {
    it('应该成功验证有效凭证', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.validateLogin({
        email: validUserData.email,
        password: validUserData.password,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validUserData.email);
      expect(result.user.name).toBe(validUserData.name);

      // 验证调用了正确的方法
      expect(User.findOne).toHaveBeenCalledWith({
        email: validUserData.email,
        status: 'active',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        validUserData.password,
        mockUser.password
      );
    });

    it('应该拒绝错误的密码', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.validateLogin({
          email: validUserData.email,
          password: 'WrongPassword123',
        })
      ).rejects.toThrow(AuthServiceError);

      await expect(
        AuthService.validateLogin({
          email: validUserData.email,
          password: 'WrongPassword123',
        })
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误',
      });
    });

    it('应该拒绝不存在的邮箱', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.validateLogin({
          email: 'nonexistent@example.com',
          password: validUserData.password,
        })
      ).rejects.toThrow(AuthServiceError);

      await expect(
        AuthService.validateLogin({
          email: 'nonexistent@example.com',
          password: validUserData.password,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误',
      });
    });

    it('应该返回不包含密码的安全用户信息', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.validateLogin({
        email: validUserData.email,
        password: validUserData.password,
      });

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('findUserByEmail', () => {
    it('应该找到存在的用户', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const user = await AuthService.findUserByEmail(validUserData.email);

      expect(user).toBeDefined();
      expect(user!.email).toBe(validUserData.email);
      expect(user!.name).toBe(validUserData.name);
      expect(User.findOne).toHaveBeenCalledWith({ email: validUserData.email });
    });

    it('应该返回 null 如果用户不存在', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const user = await AuthService.findUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('应该返回不包含密码的安全用户信息', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const user = await AuthService.findUserByEmail(validUserData.email);

      expect(user).toBeDefined();
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
    });
  });

  describe('isEmailExists', () => {
    it('应该返回 true 如果邮箱存在', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(1);

      const exists = await AuthService.isEmailExists(validUserData.email);
      expect(exists).toBe(true);
      expect(User.countDocuments).toHaveBeenCalledWith({ email: validUserData.email });
    });

    it('应该返回 false 如果邮箱不存在', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      const exists = await AuthService.isEmailExists('nonexistent@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('应该验证符合要求的密码', () => {
      const result = AuthService.validatePasswordStrength('Password123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝太短的密码', () => {
      const result = AuthService.validatePasswordStrength('Pass1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码至少8个字符');
    });

    it('应该拒绝没有小写字母的密码', () => {
      const result = AuthService.validatePasswordStrength('PASSWORD123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码需包含小写字母');
    });

    it('应该拒绝没有大写字母的密码', () => {
      const result = AuthService.validatePasswordStrength('password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码需包含大写字母');
    });

    it('应该拒绝没有数字的密码', () => {
      const result = AuthService.validatePasswordStrength('PasswordOnly');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码需包含数字');
    });

    it('应该返回所有违规项', () => {
      const result = AuthService.validatePasswordStrength('pass');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('hashPassword', () => {
    it('应该调用 bcrypt.hash 进行密码哈希', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashedPassword');

      const hash = await AuthService.hashPassword('Password123');

      expect(hash).toBe('$2a$12$hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
    });
  });

  describe('verifyPassword', () => {
    it('应该验证正确的密码', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const isValid = await AuthService.verifyPassword(
        'Password123',
        '$2a$12$hashedPassword'
      );
      
      expect(isValid).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Password123',
        '$2a$12$hashedPassword'
      );
    });

    it('应该拒绝错误的密码', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const isValid = await AuthService.verifyPassword(
        'WrongPassword',
        '$2a$12$hashedPassword'
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('错误处理测试', () => {
    it('注册时应该处理 ValidationError', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      (User.findOne as jest.Mock).mockRejectedValue(validationError);

      await expect(
        AuthService.register(validUserData)
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '数据验证失败，请检查输入信息',
      });
    });

    it('注册时应该处理 MONGODB_URI 配置错误', async () => {
      const configError = new Error('MONGODB_URI is not defined');
      (User.findOne as jest.Mock).mockRejectedValue(configError);

      await expect(
        AuthService.register(validUserData)
      ).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
        message: '数据库配置错误',
      });
    });

    it('登录时应该处理数据库连接错误', async () => {
      const networkError = new Error('Connection refused');
      networkError.name = 'MongooseServerSelectionError';
      (User.findOne as jest.Mock).mockRejectedValue(networkError);

      await expect(
        AuthService.validateLogin({
          email: validUserData.email,
          password: validUserData.password,
        })
      ).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
        message: '数据库连接失败，请检查网络连接',
      });
    });

    it('findUserByEmail 应该处理数据库错误', async () => {
      const dbError = new Error('Database error');
      (User.findOne as jest.Mock).mockRejectedValue(dbError);

      await expect(
        AuthService.findUserByEmail(validUserData.email)
      ).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
        message: '查询用户失败',
      });
    });

    it('isEmailExists 应该处理数据库错误', async () => {
      const dbError = new Error('Database error');
      (User.countDocuments as jest.Mock).mockRejectedValue(dbError);

      await expect(
        AuthService.isEmailExists(validUserData.email)
      ).rejects.toMatchObject({
        code: 'DATABASE_ERROR',
        message: '检查邮箱失败',
      });
    });

    it('注册时应该处理未知错误', async () => {
      const unknownError = new Error('Unknown error');
      (User.findOne as jest.Mock).mockRejectedValue(unknownError);

      await expect(
        AuthService.register(validUserData)
      ).rejects.toMatchObject({
        code: 'INTERNAL_ERROR',
        message: '注册失败，请稍后重试',
      });
    });

    it('登录时应该处理未知错误', async () => {
      const unknownError = new Error('Unknown error');
      (User.findOne as jest.Mock).mockRejectedValue(unknownError);

      await expect(
        AuthService.validateLogin({
          email: validUserData.email,
          password: validUserData.password,
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_ERROR',
        message: '登录验证失败，请稍后重试',
      });
    });
  });
});
