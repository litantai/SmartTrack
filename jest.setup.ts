/**
 * Jest 设置文件
 * 在所有测试前执行，用于初始化全局配置、Mock 等
 */

import '@testing-library/jest-dom';

// 设置环境变量（测试环境）
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// 全局测试超时时间
jest.setTimeout(30000);

// Mock console 方法（减少测试输出噪音）
global.console = {
  ...console,
  // 保留 error 和 warn 输出
  error: jest.fn(),
  warn: jest.fn(),
  // 抑制 log 和 info 输出
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
