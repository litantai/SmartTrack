import mongoose from 'mongoose';

/**
 * 检查数据库连接状态
 */
export async function checkDatabaseConnection(): Promise<{
  isConnected: boolean;
  status: string;
  error?: string;
}> {
  try {
    if (!process.env.MONGODB_URI) {
      return {
        isConnected: false,
        status: 'error',
        error: 'MONGODB_URI environment variable is not defined'
      };
    }

    // 检查 mongoose 连接状态
    const readyState = mongoose.connection.readyState;
    
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const statusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const status = statusMap[readyState] || 'unknown';
    const isConnected = readyState === 1;

    return {
      isConnected,
      status,
    };
  } catch (error) {
    return {
      isConnected: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 获取数据库连接详细信息
 */
export function getDatabaseInfo() {
  const connection = mongoose.connection;
  return {
    readyState: connection.readyState,
    host: connection.host || 'unknown',
    name: connection.name || 'unknown',
    models: Object.keys(connection.models),
  };
}
