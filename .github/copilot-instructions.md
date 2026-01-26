# GitHub Copilot Instructions for SmartTrack

> **关键定位**: SmartTrack 是一个面向**局域网部署**的智能试车场管理系统，所有架构决策必须围绕"离线优先、自主可控"展开。

---

## 🚨 强制约束 (Non-Negotiable Constraints)

### 1. 局域网部署限制 (LAN Deployment Restrictions)

**禁止使用任何依赖外网的服务或资源**：

#### ❌ 禁止项 (Prohibited)
- **外部 CDN**：禁止使用任何外部 CDN 加载资源（如 Google Fonts、Unpkg、jsDelivr 等）
  - ✅ 正确做法：所有字体、图标、库文件必须本地化到 `public/` 或 `node_modules`
- **云端认证服务**：禁止使用 Auth0、Clerk、Firebase Auth 等云端认证
  - ✅ 正确做法：使用 NextAuth.js 的 Credentials Provider + 本地数据库验证
- **Vercel Edge Runtime**：禁止使用 Edge Runtime、Edge Functions、Edge Middleware
  - ✅ 正确做法：所有 API Routes 和 Middleware 必须使用 **Node.js Runtime**
  - 配置示例：`export const runtime = 'nodejs'`
- **外部 API 依赖**：禁止调用需要互联网连接的第三方 API（天气、地图、支付等）
  - ✅ 正确做法：使用本地离线地图库或内网部署的服务

#### ⚠️ 特殊场景处理
- **开发阶段**：可以使用 Vercel 进行云端部署测试，但代码必须兼容 Node.js Runtime
- **最终交付**：必须提供完整的 Docker 镜像，确保在无外网环境下可一键启动

---

### 2. 开发流程强制顺序 (Mandatory Development Workflow)

**所有 Issue 开发必须严格遵循以下顺序**：

```
📝 Step 1: 更新文档 (Documentation First)
  ↓
🛠️ Step 2: 实现 Service 层 (Service Layer)
  ↓
🌐 Step 3: 开发 API Routes (API Layer)
  ↓
🎨 Step 4: 构建 UI 组件 (UI Layer)
  ↓
✅ Step 5: 编写测试 (Tests - TDD)
```

#### 详细说明

**Step 1: 文档优先 (Documentation First)**
- 在 `docs/` 目录下创建或更新相关文档
- 必须包含：数据模型定义、业务流程图、API 接口设计
- 文档格式：Markdown + Mermaid 流程图

**Step 2: Service 层实现 (Service Layer)**
- 位置：`lib/db/services/[domain-name].service.ts`
- 职责：封装所有数据库操作逻辑，不包含 HTTP 相关代码
- 示例：
  ```typescript
  // lib/db/services/booking.service.ts
  export class BookingService {
    static async createBooking(data: CreateBookingDto) {
      // 纯业务逻辑，无 HTTP 依赖
    }
  }
  ```

**Step 3: API Routes (API Layer)**
- 位置：`app/api/[resource]/route.ts`
- 职责：参数校验、调用 Service、返回标准 JSON 响应
- 必须使用 `lib/utils/api-response.ts` 统一响应格式

**Step 4: UI 组件 (UI Layer)**
- 基础组件：`components/ui/` (ShadcnUI)
- 业务组件：`components/business/` (领域逻辑)
- 页面组件：`app/dashboard/[feature]/page.tsx`

**Step 5: 测试 (Tests)**
- 单元测试：使用 Jest (Service 层)
- E2E 测试：使用 Playwright (关键业务流程)
- 测试覆盖率：核心业务逻辑 ≥ 80%

---

### 3. 代码模块化与容器化 (Modularity for Docker)

**所有代码必须高度模块化，便于 Docker 容器化部署**：

#### 设计原则
- **服务无状态**：不依赖本地文件系统或内存状态（使用数据库或 Redis）
- **配置外部化**：所有环境变量通过 `.env` 注入，禁止硬编码
- **健康检查**：每个服务必须提供 `/api/health` 端点
- **日志规范**：使用结构化日志（JSON 格式），便于日志聚合

#### Docker 相关要求
- 必须提供 `Dockerfile` 和 `docker-compose.yml`
- 必须使用多阶段构建减小镜像体积
- 必须声明端口映射和数据卷挂载点

---

## 🧠 核心技术架构规范 (Core Architecture)

### 1. 状态管理：XState

**职责**：管理业务实体的 `status` 字段流转（如预约生命周期）

#### 使用场景
- 预约状态：`pending → confirmed → in-progress → completed → cancelled`
- 车辆状态：`available → booked → in-use → maintenance → retired`
- 用户审批：`submitted → reviewing → approved/rejected`

#### 实现规范
- 状态机定义：`lib/state-machines/[entity].machine.ts`
- 与 React 集成：使用 `@xstate/react` 的 `useMachine` hook
- 示例：
  ```typescript
  // lib/state-machines/booking.machine.ts
  import { createMachine } from 'xstate';
  
  export const bookingMachine = createMachine({
    id: 'booking',
    initial: 'pending',
    states: {
      pending: { on: { CONFIRM: 'confirmed', CANCEL: 'cancelled' } },
      confirmed: { on: { START: 'in-progress', CANCEL: 'cancelled' } },
      'in-progress': { on: { COMPLETE: 'completed' } },
      completed: { type: 'final' },
      cancelled: { type: 'final' },
    },
  });
  ```

---

### 2. 业务规则引擎：Zen Engine (JSON Rules)

**职责**：处理复杂的业务规则决策（如费用计算、准入校验）

#### 使用场景
- **费用计算**：根据车型、场地、时长、时段动态计费
- **准入校验**：检查用户资质、车辆保险、场地限制
- **冲突检测**：判断时间段、资源是否冲突
- **优先级调度**：根据客户等级、任务紧急度分配资源

#### 规则定义规范
- 规则文件：`lib/rules/[domain].rules.json`
- JSON 结构：符合 Zen Engine 规范
- 示例：
  ```json
  {
    "contentType": "application/vnd.gorules.decision",
    "nodes": [
      {
        "id": "input",
        "type": "inputNode",
        "content": {
          "fields": [
            { "name": "vehicleType", "type": "string" },
            { "name": "duration", "type": "number" }
          ]
        }
      },
      {
        "id": "calculate-fee",
        "type": "decisionTableNode",
        "content": {
          "rules": [
            {
              "condition": "vehicleType == 'SUV' && duration > 4",
              "result": { "baseFee": 500, "discount": 0.1 }
            }
          ]
        }
      }
    ]
  }
  ```

#### 集成代码
```typescript
// lib/services/fee-calculator.service.ts
import { ZenEngine } from '@gorules/zen-engine';

export class FeeCalculatorService {
  static async calculateFee(input: FeeInput) {
    const engine = new ZenEngine();
    const decision = engine.createDecision(feeRulesJson);
    const result = await decision.evaluate(input);
    return result;
  }
}
```

---

### 3. XState vs Zen Engine 分工总结

| 场景 | 使用技术 | 示例 |
|------|---------|------|
| 状态流转 | XState | 预约状态从 pending 到 confirmed |
| 条件判断 | Zen Engine | 判断车辆是否满足准入条件 |
| 数值计算 | Zen Engine | 根据规则计算费用 |
| 时序控制 | XState | 限制某些状态下的操作权限 |
| 配置化决策 | Zen Engine | 通过 JSON 调整费用规则无需改代码 |

---

## 📋 标准化规范 (Standards)

### 1. API 响应格式

**所有 API 必须返回统一的 JSON 格式**：

```typescript
// 成功响应
{
  "success": true,
  "data": {
    "id": "booking-123",
    "status": "confirmed",
    "createdAt": "2026-01-26T14:00:00Z"
  },
  "error": null,
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100
    }
  }
}

// 错误响应
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "车辆 ID 不能为空",
    "details": {
      "field": "vehicleId",
      "constraint": "required"
    }
  }
}
```

#### 实现工具函数
```typescript
// lib/utils/api-response.ts
export function successResponse<T>(data: T, meta?: any) {
  return Response.json({
    success: true,
    data,
    error: null,
    meta,
  });
}

export function errorResponse(code: string, message: string, details?: any) {
  return Response.json({
    success: false,
    data: null,
    error: { code, message, details },
  }, { status: 400 });
}
```

---

### 2. TypeScript 严格模式

**必须启用严格类型检查**：

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

- 禁止使用 `any`，必须定义明确的类型或接口
- 所有 DTO (Data Transfer Object) 必须使用 Zod 进行运行时校验

---

### 3. 测试驱动开发 (TDD)

**测试策略**：

#### 单元测试 (Jest)
- 覆盖所有 Service 层方法
- 覆盖所有工具函数
- Mock 外部依赖（数据库、外部 API）

#### 集成测试 (Playwright)
- 测试完整的用户流程（登录 → 预约 → 确认）
- 测试关键的业务场景（冲突检测、费用计算）
- 测试错误处理（无效输入、权限不足）

#### 测试文件位置
```
__tests__/
  ├── unit/
  │   ├── services/
  │   │   └── booking.service.test.ts
  │   └── utils/
  │       └── date-helper.test.ts
  └── e2e/
      └── booking-flow.spec.ts
```

#### Playwright 测试示例
```typescript
// __tests__/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test('完整预约流程', async ({ page }) => {
  await page.goto('/dashboard/bookings');
  await page.click('text=新建预约');
  await page.fill('[name="vehicleId"]', 'V001');
  await page.fill('[name="venueId"]', 'A01');
  await page.click('button[type="submit"]');
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

---

## 🎨 前端开发规范 (Frontend Guidelines)

### 1. 组件设计原则

- **原子化设计**：使用 ShadcnUI 作为基础组件库
- **组件分层**：
  - `components/ui/`: 纯 UI 组件（无业务逻辑）
  - `components/business/`: 业务组件（包含领域逻辑）
  - `app/dashboard/`: 页面级组件

### 2. 样式规范

- **仅使用 Tailwind CSS**，禁止编写独立的 CSS 文件
- **响应式设计**：所有组件必须适配移动端（使用 `sm:`, `md:`, `lg:` 断点）
- **暗色模式**：使用 Tailwind 的 `dark:` 前缀支持暗色主题

### 3. 数据获取

- **服务端组件**：直接使用 `async/await` 调用 Service 层
- **客户端组件**：使用 TanStack Query (`useQuery`/`useMutation`)

---

## 🚀 性能与安全 (Performance & Security)

### 1. 性能优化

- **懒加载**：使用 `next/dynamic` 动态导入大组件
- **图片优化**：使用 `next/image` 自动优化图片
- **数据缓存**：使用 TanStack Query 的缓存机制

### 2. 安全规范

- **输入校验**：所有用户输入必须使用 Zod 校验
- **SQL 注入防护**：使用 Mongoose 的参数化查询
- **XSS 防护**：React 默认转义输出，避免使用 `dangerouslySetInnerHTML`
- **CSRF 防护**：NextAuth.js 自动处理

---

## 📚 参考文档 (Quick Links)

- **项目架构**：`docs/AI_DEVELOPMENT.md`
- **数据模型**：`docs/architecture/data-models.md`
- **API 文档**：`docs/architecture/api-specification.md`
- **部署指南**：`docs/deployment/docker-guide.md`

---

## ⚡ AI 助手快速检查清单

在生成代码前，请确认：

- [ ] 代码是否符合局域网部署要求（无外部依赖）？
- [ ] 是否遵循了文档 → Service → API → UI 的开发顺序？
- [ ] XState 和 Zen Engine 的分工是否正确？
- [ ] API 响应格式是否符合标准？
- [ ] 是否包含必要的 TypeScript 类型定义？
- [ ] 是否编写了对应的测试用例？
- [ ] 代码是否模块化，便于 Docker 部署？

---

**End of Instructions** | 如有疑问，请参考 `docs/AI_DEVELOPMENT.md` 获取更多上下文。
