import { NextResponse } from 'next/server';
import { checkDatabaseConnection, getDatabaseInfo } from '@/lib/db/connection-status';
import { connectToDatabase } from '@/lib/db/mongoose';

/**
 * API路由：检查数据库连接状态
 * GET /api/health/database
 */
export async function GET() {
  try {
    // 尝试连接数据库
    await connectToDatabase();
    
    // 检查连接状态
    const connectionStatus = await checkDatabaseConnection();
    const dbInfo = getDatabaseInfo();

    if (connectionStatus.isConnected) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'connected',
          message: '数据库连接正常',
          details: {
            host: dbInfo.host,
            database: dbInfo.name,
            readyState: dbInfo.readyState,
            models: dbInfo.models.length
          }
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: '数据库连接失败',
        details: connectionStatus
      }, { status: 503 });
    }
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    return NextResponse.json({
      success: false,
      error: '数据库连接异常',
      details: {
        message: error instanceof Error ? error.message : '未知错误'
      }
    }, { status: 503 });
  }
}
