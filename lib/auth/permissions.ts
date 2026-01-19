import { UserRoleType, PERMISSIONS } from '@/types/auth';

/**
 * 检查用户是否有特定权限
 * @param userRole 用户角色
 * @param permission 需要的权限
 * @returns 是否有权限
 */
export function hasPermission(userRole: UserRoleType, permission: string): boolean {
  const rolePermissions = PERMISSIONS[userRole];
  
  // 管理员拥有所有权限
  if (rolePermissions[0] === '*') {
    return true;
  }
  
  return (rolePermissions as readonly string[]).includes(permission);
}

/**
 * 检查用户是否有任一权限
 * @param userRole 用户角色
 * @param permissions 权限列表
 * @returns 是否有任一权限
 */
export function hasAnyPermission(userRole: UserRoleType, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * 检查用户是否有所有权限
 * @param userRole 用户角色
 * @param permissions 权限列表
 * @returns 是否有所有权限
 */
export function hasAllPermissions(userRole: UserRoleType, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * 检查用户是否是管理员
 * @param userRole 用户角色
 * @returns 是否是管理员
 */
export function isAdmin(userRole: UserRoleType): boolean {
  return userRole === 'admin';
}
