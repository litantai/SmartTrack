# 认证模块使用指南

## 概述

SmartTrack 的认证模块已完全实现，提供了基于 NextAuth.js v5 的完整身份验证和授权系统。

## 已实现功能

### ✅ 核心功能

1. **用户注册**
   - 端点：`POST /api/auth/register`
   - 支持邮箱和密码注册
   - 自动密码哈希加密（bcrypt，轮数 12）
   - 完整的输入验证（Zod）

2. **用户登录**
   - 使用 NextAuth.js Credentials Provider
   - JWT 会话管理（30天有效期）
   - 自动会话刷新

3. **角色权限系统 (RBAC)**
   - 四种用户角色：
     - `admin` - 系统管理员（全部权限）
     - `scheduler` - 调度员（预约管理）
     - `driver` - 试车员（任务执行）
     - `reviewer` - 审核员（审批查看）

4. **路由保护**
   - 中间件级别的路由保护
   - 基于角色的访问控制
   - 自动重定向未授权访问

5. **UI 组件**
   - 登录页面 (`/login`)
   - 注册页面 (`/register`)
   - Dashboard 页面 (`/dashboard`)
   - 响应式设计，支持移动端

## 环境配置

创建 `.env.local` 文件：

```bash
# MongoDB 数据库连接
MONGODB_URI=mongodb://localhost:27017/smarttrack

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# 环境标识
NODE_ENV=development
```

**重要提示**：
- `NEXTAUTH_SECRET` 应该是一个强随机字符串
- 可以使用以下命令生成：`openssl rand -base64 32`

## API 使用示例

### 注册新用户

```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '张三',
    email: 'zhangsan@example.com',
    password: 'Password123',
    role: 'driver' // 可选，默认为 driver
  }),
});

const data = await response.json();
// 响应：{ success: true, data: { id, name, email, role }, error: null }
```

### 用户登录

```typescript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  email: 'zhangsan@example.com',
  password: 'Password123',
  redirect: false,
});

if (result?.error) {
  console.error('登录失败:', result.error);
} else {
  console.log('登录成功');
}
```

### 获取当前会话

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>加载中...</div>;
  if (status === 'unauthenticated') return <div>未登录</div>;
  
  return (
    <div>
      <p>欢迎, {session.user.name}</p>
      <p>角色: {session.user.role}</p>
    </div>
  );
}
```

### 服务端获取会话

```typescript
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    return <div>请先登录</div>;
  }
  
  return <div>欢迎, {session.user.name}</div>;
}
```

## 权限检查

### 使用 useAuth Hook

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

function ProtectedComponent() {
  const { user, isAuthenticated, checkPermission, isUserAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }
  
  if (!checkPermission('booking:create')) {
    return <div>无权访问</div>;
  }
  
  return <div>受保护的内容</div>;
}
```

### 使用权限工具函数

```typescript
import { hasPermission, isAdmin } from '@/lib/auth/permissions';

// 检查权限
if (hasPermission('admin', 'booking:create')) {
  // 执行操作
}

// 检查是否是管理员
if (isAdmin(userRole)) {
  // 管理员操作
}
```

## 数据库模型

### User Schema

```typescript
{
  name: string;           // 用户姓名（2-50字符）
  email: string;          // 邮箱（唯一，自动小写）
  password: string;       // bcrypt 哈希密码
  role: 'admin' | 'scheduler' | 'driver' | 'reviewer';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;        // 可选头像 URL
  createdAt: Date;        // 自动生成
  updatedAt: Date;        // 自动生成
}
```

## 安全特性

1. **密码安全**
   - bcrypt 哈希加密，加盐轮数 12
   - 密码强度验证：至少8位，包含大小写字母和数字
   - 永不明文存储或传输

2. **会话安全**
   - JWT 令牌加密存储
   - 30天会话过期
   - 自动会话刷新

3. **输入验证**
   - Zod 运行时类型校验
   - XSS 防护（React 自动转义）
   - CSRF 保护（NextAuth 内置）

4. **数据库安全**
   - Mongoose ODM 防止 NoSQL 注入
   - 唯一索引确保邮箱唯一性
   - 优化索引提高查询性能

## 路由配置

### 受保护路由

中间件自动保护以下路由：
- `/dashboard/*` - 需要登录
- `/admin/*` - 需要管理员权限
- `/api/protected/*` - 受保护的 API

### 公开路由

- `/` - 首页
- `/login` - 登录页
- `/register` - 注册页
- `/api/auth/*` - 认证 API

## 测试流程

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问注册页面**
   - 打开浏览器访问 `http://localhost:3000/register`
   - 填写表单注册新用户

3. **登录测试**
   - 访问 `http://localhost:3000/login`
   - 使用注册的账号登录

4. **访问 Dashboard**
   - 登录成功后访问 `http://localhost:3000/dashboard`
   - 查看用户信息

5. **退出登录**
   - 点击 Dashboard 中的"退出登录"按钮

## 常见问题

### Q: 如何修改会话过期时间？

A: 修改 `lib/auth/auth.config.ts` 中的 `session.maxAge` 值（单位：秒）

### Q: 如何添加新的用户角色？

A: 
1. 更新 `lib/db/models/User.ts` 中的 `role` 枚举
2. 更新 `types/auth.ts` 中的 `UserRole` 和 `PERMISSIONS`
3. 更新 `lib/validations/auth.ts` 中的验证规则

### Q: 如何自定义权限规则？

A: 修改 `types/auth.ts` 中的 `PERMISSIONS` 对象

### Q: 登录后如何重定向到特定页面？

A: 在 `signIn` 调用中添加 `callbackUrl` 参数：
```typescript
signIn('credentials', {
  email,
  password,
  callbackUrl: '/dashboard'
});
```

## 下一步

- 实现密码重置功能
- 添加邮箱验证
- 集成 OAuth 提供商（微信、GitHub 等）
- 添加多因素认证（MFA）
- 实现审计日志

## 参考资料

- [NextAuth.js 官方文档](https://next-auth.js.org/)
- [Mongoose 文档](https://mongoosejs.com/)
- [Zod 文档](https://zod.dev/)
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
