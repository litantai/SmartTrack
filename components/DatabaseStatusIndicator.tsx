'use client';

import { useEffect, useState, useCallback } from 'react';
import { XCircle } from 'lucide-react';

interface DatabaseStatus {
  isConnected: boolean;
  status: string;
  message?: string;
  error?: string;
}

export default function DatabaseStatusIndicator() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/health/database');
      const data = await response.json();
      
      if (data.success) {
        setStatus({
          isConnected: true,
          status: 'connected',
          message: data.data.message
        });
      } else {
        setStatus({
          isConnected: false,
          status: 'error',
          error: data.error
        });
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        status: 'error',
        error: '无法连接到服务器'
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // 初始检查
    checkStatus();
    
    // 每30秒检查一次
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkStatus]);

  if (!status) {
    return null;
  }

  if (status.isConnected) {
    return null; // 连接正常时不显示
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">数据库连接异常</h3>
            <p className="text-xs text-red-700 mt-1">
              {status.error || '无法连接到数据库，请检查网络连接或稍后重试'}
            </p>
            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
            >
              {isChecking ? '检查中...' : '重新检查'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
