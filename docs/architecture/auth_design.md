# 用户认证与授权模块设计

## 1. 概述 (Overview)

本模块负责 SmartTrack 系统的用户身份认证与权限管理，为整个试车场管理系统提供安全的访问控制基础。模块的核心功能包括：

- **用户注册**：支持新用户账户创建，确保数据完整性和安全性
- **用户登录**：基于凭证的身份验证，生成会话令牌
- **基于角色的访问控制 (RBAC)**：通过角色体系实现差异化的功能权限管理
- **会话管理**：使用 JWT 令牌维护用户登录状态

该模块确保只有经过授权的用户才能访问相应的系统功能，为不同角色（管理员、调度员、试车员、审核员）提供定制化的操作界面。

---

## 2. 技术栈 (Tech Stack)

本模块采用现代化的全栈技术方案，充分利用 Next.js 生态系统的优势：

| 技术组件 | 版本 | 用途说明 |
|---------|------|---------|
| **Next.js** | 14.x | App Router 架构，提供服务端渲染与 API Routes |
| **NextAuth.js (Auth.js)** | v5 | 统一认证框架，处理登录、会话与回调 |
| **MongoDB** | 5.x+ | NoSQL 数据库，存储用户信息与会话数据 |
| **Mongoose** | 6.x+ | ODM 框架，提供类型安全的数据模型定义 |
| **Zod** | 3.x | 运行时类型校验，用于表单验证与 API 参数检查 |
| **bcryptjs** | 2.x | 密码哈希加密算法，保障用户密码安全 |
| **jose** | 5.x | JWT 令牌生成与验证 (NextAuth 内置) |

---

## 3. 数据库模型设计 (Data Model)

### 3.1 User Schema 定义

用户集合是认证系统的核心数据结构，存储在 MongoDB 的 `users` 集合中。

```typescript
// lib/db/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;  // 已哈希加密
  role: 'admin' | 'scheduler' | 'driver' | 'reviewer';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, '用户名不能为空'],
    trim: true,
    minlength: [2, '用户名至少2个字符'],
    maxlength: [50, '用户名最多50个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [60, '密码哈希长度不符'] // bcrypt 哈希固定长度
  },
  role: {
    type: String,
    enum: ['admin', 'scheduler', 'driver', 'reviewer'],
    default: 'driver',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true // 自动生成 createdAt 和 updatedAt
});

// 索引优化
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
```

### 3.2 关键字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | String | ✅ | 用户真实姓名，用于显示和识别 |
| `email` | String | ✅ | 登录凭证，全局唯一 |
| `password` | String | ✅ | 经 bcrypt 哈希后的密码，不可逆加密 |
| **`role`** | Enum | ✅ | **核心权限字段**，决定用户的系统访问级别 |
| `status` | Enum | ✅ | 账户状态，控制用户的启用/禁用 |
| `avatar` | String | ❌ | 用户头像 URL，可选 |
| `createdAt` | Date | 自动 | 账户创建时间 |
| `updatedAt` | Date | 自动 | 最后修改时间 |

### 3.3 角色权限体系

`role` 字段是整个 RBAC 系统的基石，不同角色对应的权限如下：

```typescript
// types/auth.ts
export enum UserRole {
  ADMIN = 'admin',        // 系统管理员：全局权限，用户管理
  SCHEDULER = 'scheduler', // 调度员：场地预约、车辆调度
  DRIVER = 'driver',      // 试车员：查看任务、填报测试数据
  REVIEWER = 'reviewer'   // 审核员：审批预约申请、查看报表
}

// 权限矩阵示例
export const PERMISSIONS = {
  admin: ['*'], // 所有权限
  scheduler: ['booking:create', 'booking:update', 'vehicle:assign'],
  driver: ['task:view', 'task:update', 'report:submit'],
  reviewer: ['booking:approve', 'report:view', 'analytics:view']
};
```

**重要性**：
- 所有 API 路由和页面级别的访问控制都依赖 `role` 字段
- 中间件将根据角色自动重定向到对应的工作台
- 前端组件根据角色显示/隐藏特定功能

---

## 4. API 路由规划 (API Routes)

### 4.1 用户注册接口

**端点**：`POST /api/auth/register`

**功能**：创建新用户账户，仅限管理员或开放注册时可用。

**请求体**：
```typescript
// lib/validations/auth.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(50),
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码需包含大小写字母和数字'),
  role: z.enum(['admin', 'scheduler', 'driver', 'reviewer']).optional()
});
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "driver"
  },
  "error": null
}
```

**实现逻辑** (`app/api/auth/register/route.ts`)：
1. 使用 Zod 验证请求参数
2. 检查邮箱是否已注册
3. 使用 bcrypt 哈希密码（加盐轮数：12）
4. 创建用户记录并返回（不包含密码）

### 4.2 NextAuth 统一认证端点

**端点**：`GET/POST /api/auth/[...nextauth]`

**功能**：NextAuth.js 的动态路由处理器，统一管理：
- `GET /api/auth/signin` - 登录页面
- `POST /api/auth/callback/credentials` - 凭证验证
- `GET /api/auth/session` - 获取当前会话
- `POST /api/auth/signout` - 退出登录

**文件位置**：`app/api/auth/[...nextauth]/route.ts`

---

## 5. NextAuth 配置策略 (Authentication Strategy)

### 5.1 核心配置文件

```typescript
// lib/auth/auth.config.ts
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import { LoginSchema } from '@/lib/validations/auth';

export const authOptions = {
  // 1. 提供者配置
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        // 参数验证
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        // 数据库查询
        await connectToDatabase();
        const user = await User.findOne({ email, status: 'active' });
        if (!user) return null;

        // 密码验证
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 返回安全的用户信息
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        };
      }
    })
  ],

  // 2. 会话策略
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  // 3. 回调函数
  callbacks: {
    // JWT 回调：将 role 和 id 注入令牌
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // Session 回调：将 JWT 信息暴露给客户端
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },

  // 4. 自定义页面
  pages: {
    signIn: '/login',
    error: '/login', // 错误重定向到登录页
  },

  // 5. 密钥配置
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 5.2 类型扩展

为了让 TypeScript 识别自定义的 `role` 字段，需要扩展 NextAuth 类型：

```typescript
// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user']
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
```

---

## 6. 页面规划 (UI/UX)

### 6.1 登录页面 (`/login`)

**路径**：`app/(auth)/login/page.tsx`

**功能**：
- 用户凭证输入（邮箱 + 密码）
- 前端表单验证（react-hook-form + Zod）
- 调用 `signIn('credentials', { email, password })`
- 登录成功后根据角色重定向到对应工作台

**UI 组件**：
- ShadcnUI 的 `Card`, `Input`, `Button` 组件
- 错误提示使用 `toast` 通知
- 响应式设计（支持移动端）

### 6.2 注册页面 (`/register`)

**路径**：`app/(auth)/register/page.tsx`

**功能**：
- 新用户信息填写（姓名、邮箱、密码、确认密码）
- 调用 `POST /api/auth/register`
- 注册成功后自动跳转登录页

**安全策略**：
- 可配置为仅限管理员创建账户（关闭公开注册）
- 新注册用户默认角色为 `driver`

### 6.3 路由保护中间件

**文件位置**：`middleware.ts`

**功能**：
- 拦截所有请求，检查用户会话
- 未登录用户访问受保护页面时重定向到 `/login`
- 根据用户角色限制特定路由访问

**实现示例**：
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 角色访问控制
    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // 必须已登录
    }
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/protected/:path*']
};
```

---

## 7. 任务分解 (Checklist)

完整实现本模块需要按以下顺序推进各项任务：

### 阶段 1：数据库与基础架构 (Foundation)
- [ ] 配置 MongoDB 连接 (`lib/db/mongoose.ts`)
- [ ] 定义 User Model 及 Schema (`lib/db/models/User.ts`)
- [ ] 创建类型定义文件 (`types/auth.ts`, `types/next-auth.d.ts`)
- [ ] 编写 Zod 验证规则 (`lib/validations/auth.ts`)

### 阶段 2：认证逻辑开发 (Core Authentication)
- [ ] 实现注册 API (`app/api/auth/register/route.ts`)
  - [ ] 参数校验与邮箱唯一性检查
  - [ ] 密码哈希加密 (bcrypt)
  - [ ] 创建用户记录
- [ ] 配置 NextAuth.js (`lib/auth/auth.config.ts`)
  - [ ] 设置 CredentialsProvider
  - [ ] 实现 JWT 和 Session 回调
  - [ ] 配置密钥和会话策略
- [ ] 创建 NextAuth 路由 (`app/api/auth/[...nextauth]/route.ts`)

### 阶段 3：前端页面开发 (UI Development)
- [ ] 构建登录页面 (`app/(auth)/login/page.tsx`)
  - [ ] 集成 react-hook-form + Zod
  - [ ] 调用 NextAuth `signIn` 方法
  - [ ] 错误处理和加载状态
- [ ] 构建注册页面 (`app/(auth)/register/page.tsx`)
  - [ ] 表单组件和验证
  - [ ] API 调用和反馈提示
- [ ] 设计认证布局 (`app/(auth)/layout.tsx`)

### 阶段 4：权限控制与中间件 (Authorization)
- [ ] 实现全局中间件 (`middleware.ts`)
  - [ ] 路由保护逻辑
  - [ ] 基于角色的访问控制
- [ ] 创建权限检查工具函数 (`lib/auth/permissions.ts`)
- [ ] 开发 useSession Hook 封装 (`hooks/useAuth.ts`)

### 阶段 5：测试与优化 (Testing & Optimization)
- [ ] 单元测试：注册/登录 API
- [ ] 集成测试：完整认证流程
- [ ] 性能优化：数据库索引与查询优化
- [ ] 安全审计：XSS、CSRF、SQL 注入防护

### 阶段 6：文档与部署 (Documentation & Deployment)
- [ ] 编写 API 文档 (Swagger/OpenAPI)
- [ ] 更新开发指南 (`docs/AI_DEVELOPMENT.md`)
- [ ] 配置环境变量 (`.env.example`)
- [ ] 部署到 Vercel 并验证生产环境

---

## 8. 安全考虑

### 8.1 密码安全
- 使用 bcrypt 加密，加盐轮数不少于 12
- 密码强度要求：至少 8 位，包含大小写字母和数字
- 永不明文存储或日志输出密码

### 8.2 会话安全
- JWT 密钥使用强随机字符串 (`NEXTAUTH_SECRET`)
- 设置合理的会话过期时间（30 天）
- HTTPS 传输（生产环境强制）

### 8.3 防护措施
- 登录失败限流（防止暴力破解）
- CSRF 令牌保护（NextAuth 内置）
- XSS 防护：用户输入严格校验和转义
- SQL 注入防护：使用 Mongoose ORM，避免直接拼接查询

---

## 9. 扩展计划

未来可根据业务需求扩展以下功能：

- **OAuth 集成**：支持微信、企业微信登录
- **多因素认证 (MFA)**：邮箱验证码、TOTP 双因子
- **审计日志**：记录所有登录/操作日志
- **密码重置**：邮件找回密码功能
- **账户锁定**：连续失败后临时禁用账户

---

## 10. 参考资料

- [NextAuth.js 官方文档](https://next-auth.js.org/)
- [Next.js App Router 认证指南](https://nextjs.org/docs/app/building-your-application/authentication)
- [Mongoose Schema 定义](https://mongoosejs.com/docs/guide.html)
- [Zod 验证库](https://zod.dev/)
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
