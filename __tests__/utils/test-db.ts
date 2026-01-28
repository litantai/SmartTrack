import { vi } from 'vitest';
import mongoose from 'mongoose';

/**
 * Mock Mongoose 连接和操作
 * 使用 Vitest 的 mock 功能模拟数据库行为，无需外部依赖
 */

// 模拟的集合存储
const mockCollections = new Map<string, any[]>();

/**
 * 启动测试数据库（使用 Mock）
 */
export async function connectTestDB() {
  // Mock mongoose.connect
  vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose as any);
  
  // Mock mongoose.connection
  Object.defineProperty(mongoose, 'connection', {
    value: {
      readyState: 1, // 1 = connected
      collections: new Proxy({}, {
        get: (target, prop: string) => {
          if (!mockCollections.has(prop)) {
            mockCollections.set(prop, []);
          }
          return {
            deleteMany: vi.fn().mockResolvedValue({ deletedCount: mockCollections.get(prop)?.length || 0 }),
            find: vi.fn().mockReturnValue({
              exec: vi.fn().mockResolvedValue(mockCollections.get(prop) || [])
            }),
            findOne: vi.fn().mockReturnValue({
              exec: vi.fn().mockResolvedValue(mockCollections.get(prop)?.[0] || null)
            }),
            create: vi.fn().mockImplementation((data) => {
              const collection = mockCollections.get(prop) || [];
              collection.push(data);
              mockCollections.set(prop, collection);
              return Promise.resolve(data);
            }),
            insertMany: vi.fn().mockImplementation((data) => {
              const collection = mockCollections.get(prop) || [];
              collection.push(...data);
              mockCollections.set(prop, collection);
              return Promise.resolve(data);
            })
          };
        }
      })
    },
    configurable: true
  });
  
  console.log('✅ Test database mocked (Vitest)');
}

/**
 * 清空所有模拟集合（每个测试后调用）
 */
export async function clearTestDB() {
  mockCollections.clear();
}

/**
 * 断开连接并清理 Mock（测试结束时调用）
 */
export async function disconnectTestDB() {
  mockCollections.clear();
  vi.restoreAllMocks();
  console.log('✅ Test database mocks cleaned');
}

/**
 * 创建测试数据辅助函数
 */
export async function seedTestData() {
  // 可在这里预置通用测试数据
  // 例如：创建测试用户、测试车辆等
}

/**
 * 获取模拟集合数据（用于测试断言）
 */
export function getMockCollection(name: string): any[] {
  return mockCollections.get(name) || [];
}

/**
 * 设置模拟集合数据（用于测试准备）
 */
export function setMockCollection(name: string, data: any[]) {
  mockCollections.set(name, data);
}
