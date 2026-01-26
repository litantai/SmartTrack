/**
 * Jest 配置文件
 * 支持 TypeScript + Mock MongoDB
 */

import type { Config } from 'jest';

const config: Config = {
  // 测试环境
  testEnvironment: 'node',

  // 使用 ts-jest preset
  preset: 'ts-jest',

  // 覆盖率收集配置
  collectCoverageFrom: [
    'lib/db/services/**/*.ts',
    'lib/utils/**/*.ts',
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // 覆盖率阈值（确保核心业务逻辑 ≥ 80%）
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
    // Service 层必须达到更高的覆盖率
    'lib/db/services/**/*.ts': {
      branches: 70,
      functions: 100,
      lines: 80,
      statements: 80,
    },
  },

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // 模块路径别名（与 tsconfig.json 保持一致）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // 测试超时时间
  testTimeout: 30000,

  // 清除 Mock（每个测试后重置 Mock 状态）
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 设置文件（在所有测试前执行）
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // TypeScript 转换
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
      },
    }],
  },

  // 忽略文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 详细输出
  verbose: true,
};

export default config;



