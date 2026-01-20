'use client';

import { useSession } from 'next-auth/react';
import { UserRoleType } from '@/types/auth';
import { hasPermission, isAdmin } from '@/lib/auth/permissions';

/**
 * 自定义认证 Hook，提供用户会话信息和权限检查功能
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  const user = session?.user;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  /**
   * 检查当前用户是否有特定权限
   */
  const checkPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as UserRoleType, permission);
  };

  /**
   * 检查当前用户是否是管理员
   */
  const isUserAdmin = (): boolean => {
    if (!user?.role) return false;
    return isAdmin(user.role as UserRoleType);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    checkPermission,
    isUserAdmin,
    role: user?.role as UserRoleType | undefined,
  };
}
