import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

/**
 * 启动内存数据库（测试开始时调用）
 */
export async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('✅ Test database connected');
}

/**
 * 清空所有集合（每个测试后调用）
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * 断开连接并停止内存数据库（测试结束时调用）
 */
export async function disconnectTestDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    console.log('✅ Test database disconnected');
  }
}

/**
 * 创建测试数据辅助函数
 */
export async function seedTestData() {
  // 可在这里预置通用测试数据
  // 例如：创建测试用户、测试车辆等
}
