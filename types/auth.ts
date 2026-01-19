export enum UserRole {
  ADMIN = 'admin',        // 系统管理员：全局权限，用户管理
  SCHEDULER = 'scheduler', // 调度员：场地预约、车辆调度
  DRIVER = 'driver',      // 试车员：查看任务、填报测试数据
  REVIEWER = 'reviewer'   // 审核员：审批预约申请、查看报表
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 权限矩阵
export const PERMISSIONS = {
  admin: ['*'], // 所有权限
  scheduler: ['booking:create', 'booking:update', 'vehicle:assign'],
  driver: ['task:view', 'task:update', 'report:submit'],
  reviewer: ['booking:approve', 'report:view', 'analytics:view']
} as const;

export type UserRoleType = 'admin' | 'scheduler' | 'driver' | 'reviewer';
export type UserStatusType = 'active' | 'inactive' | 'suspended';
