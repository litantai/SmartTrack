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

## 🎯 开发动作标准 (Action Standards)

**作为 AI 编程助手的核心技能，你必须严格遵循以下三大原则**：

### 原则 1: 状态机优先原则 (State Machine First)

**适用场景**：任何涉及业务流程、状态流转的功能开发或修改

**执行标准**：
1. **在编写任何代码之前**，必须先输出 XState 可视化逻辑描述
2. 使用 Mermaid 语法绘制状态转换图
3. 明确定义：
   - 所有可能的状态（states）
   - 状态之间的转换事件（events）
   - 转换条件（guards）
   - 副作用动作（actions）

**示例**：当用户要求"实现预约审批流程"时，你必须先输出：

```mermaid
stateDiagram-v2
    [*] --> pending: 创建预约
    pending --> reviewing: 提交审批 (SUBMIT)
    reviewing --> approved: 审批通过 (APPROVE)
    reviewing --> rejected: 审批拒绝 (REJECT)
    approved --> in-progress: 开始执行 (START)
    in-progress --> completed: 完成 (COMPLETE)
    rejected --> [*]
    completed --> [*]
    
    note right of reviewing
        守卫条件: 
        - 申请人有效
        - 资源可用
    end note
```

**然后提供对应的 XState 代码**：

```typescript
// lib/state-machines/booking-approval.machine.ts
import { createMachine, assign } from 'xstate';

export const bookingApprovalMachine = createMachine({
  id: 'bookingApproval',
  initial: 'pending',
  context: {
    bookingId: null,
    reviewerId: null,
    rejectionReason: null,
  },
  states: {
    pending: {
      on: {
        SUBMIT: {
          target: 'reviewing',
          actions: 'notifyReviewer',
        },
      },
    },
    reviewing: {
      on: {
        APPROVE: {
          target: 'approved',
          cond: 'hasValidResources',
          actions: 'recordApproval',
        },
        REJECT: {
          target: 'rejected',
          actions: assign({
            rejectionReason: (_, event) => event.reason,
          }),
        },
      },
    },
    approved: {
      on: {
        START: {
          target: 'in-progress',
          actions: 'notifyUser',
        },
      },
    },
    'in-progress': {
      on: {
        COMPLETE: {
          target: 'completed',
          actions: 'finalizeBooking',
        },
      },
    },
    rejected: { type: 'final' },
    completed: { type: 'final' },
  },
});
```

---

### 原则 2: 规则解耦原则 (Rule Decoupling)

**适用场景**：任何涉及条件判断、计算、权限控制、业务规则的逻辑

**执行标准**：
1. **在实现判断逻辑前**，必须主动询问用户：
   - "这个逻辑是否需要未来动态调整？"
   - "是否需要将此规则配置化到 Zen Engine JSON 文件？"
2. 如果满足以下任一条件，**强制**使用 Zen Engine：
   - 规则涉及多个条件组合判断
   - 规则可能频繁变化（如定价策略、折扣规则）
   - 规则需要业务人员可配置（无需开发介入）
3. 规则文件位置：`lib/rules/[domain-name].rules.json`
4. Service 层必须通过 Zen Engine 调用规则，而非硬编码判断

**示例对话**：

**用户**："实现车辆预约费用计算功能"

**AI 响应**：
> 🤔 **规则解耦检查**：
> 
> 我注意到费用计算涉及以下判断条件：
> - 车型类型（SUV/轿车/卡车）
> - 场地类型（高速环道/测试场）
> - 预约时长（≤2h / 2-4h / >4h）
> - 是否高峰时段
> - 用户会员等级
> 
> **建议使用 Zen Engine 配置化此规则**，原因：
> 1. ✅ 规则复杂（5 个维度组合判断）
> 2. ✅ 定价策略可能随市场调整
> 3. ✅ 业务人员需要灵活配置
> 
> 是否需要我创建 `lib/rules/fee-calculation.rules.json` 文件？

**如果用户确认，则提供**：

```json
// lib/rules/fee-calculation.rules.json
{
  "contentType": "application/vnd.gorules.decision",
  "nodes": [
    {
      "id": "input",
      "type": "inputNode",
      "content": {
        "fields": [
          { "name": "vehicleType", "type": "string" },
          { "name": "venueType", "type": "string" },
          { "name": "duration", "type": "number" },
          { "name": "isPeakHour", "type": "boolean" },
          { "name": "userLevel", "type": "string" }
        ]
      }
    },
    {
      "id": "base-fee-calculation",
      "type": "decisionTableNode",
      "content": {
        "hitPolicy": "first",
        "rules": [
          {
            "condition": "vehicleType == 'SUV' && venueType == 'track'",
            "result": { "baseFee": 500 }
          },
          {
            "condition": "vehicleType == 'sedan' && venueType == 'test-pad'",
            "result": { "baseFee": 300 }
          }
        ]
      }
    },
    {
      "id": "duration-discount",
      "type": "decisionTableNode",
      "content": {
        "rules": [
          { "condition": "duration <= 2", "result": { "discount": 0 } },
          { "condition": "duration > 2 && duration <= 4", "result": { "discount": 0.1 } },
          { "condition": "duration > 4", "result": { "discount": 0.2 } }
        ]
      }
    },
    {
      "id": "peak-multiplier",
      "type": "expressionNode",
      "content": {
        "expression": "isPeakHour ? baseFee * 1.5 : baseFee"
      }
    },
    {
      "id": "user-level-discount",
      "type": "decisionTableNode",
      "content": {
        "rules": [
          { "condition": "userLevel == 'VIP'", "result": { "userDiscount": 0.2 } },
          { "condition": "userLevel == 'Gold'", "result": { "userDiscount": 0.1 } },
          { "condition": "userLevel == 'Regular'", "result": { "userDiscount": 0 } }
        ]
      }
    },
    {
      "id": "output",
      "type": "outputNode",
      "content": {
        "fields": [
          { "name": "finalFee", "type": "number" },
          { "name": "breakdown", "type": "object" }
        ]
      }
    }
  ],
  "edges": [
    { "source": "input", "target": "base-fee-calculation" },
    { "source": "base-fee-calculation", "target": "duration-discount" },
    { "source": "duration-discount", "target": "peak-multiplier" },
    { "source": "peak-multiplier", "target": "user-level-discount" },
    { "source": "user-level-discount", "target": "output" }
  ]
}
```

**以及 Service 层集成代码**：

```typescript
// lib/db/services/fee-calculator.service.ts
import { ZenEngine } from '@gorules/zen-engine';
import feeRules from '@/lib/rules/fee-calculation.rules.json';

export class FeeCalculatorService {
  private static engine = new ZenEngine();
  private static decision = this.engine.createDecision(feeRules);

  static async calculateFee(input: {
    vehicleType: string;
    venueType: string;
    duration: number;
    isPeakHour: boolean;
    userLevel: string;
  }) {
    const result = await this.decision.evaluate(input);
    return {
      finalFee: result.finalFee,
      breakdown: result.breakdown,
    };
  }
}
```

---

### 原则 3: 闭环验证原则 (Closed-Loop Verification)

**适用场景**：所有代码生成任务完成后

**执行标准**：
1. **代码生成后立即**，主动提供对应的 Playwright 测试代码
2. 测试必须覆盖：
   - 正常流程（Happy Path）
   - 边界情况（Edge Cases）
   - 错误处理（Error Handling）
3. 测试文件位置：`__tests__/e2e/[feature-name].spec.ts`
4. 测试必须可直接运行，无需用户修改

**示例**：当完成"预约审批流程"功能后，必须主动提供：

```typescript
// __tests__/e2e/booking-approval.spec.ts
import { test, expect } from '@playwright/test';

test.describe('预约审批流程', () => {
  test.beforeEach(async ({ page }) => {
    // 登录为管理员
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('正常流程：提交审批 → 通过 → 开始执行 → 完成', async ({ page }) => {
    // Step 1: 创建预约
    await page.goto('/dashboard/bookings/new');
    await page.selectOption('[name="vehicleId"]', { label: 'Tesla Model 3' });
    await page.selectOption('[name="venueId"]', { label: '高速环道' });
    await page.fill('[name="startTime"]', '2026-01-28T09:00');
    await page.fill('[name="endTime"]', '2026-01-28T11:00');
    await page.click('button:has-text("创建预约")');
    
    await expect(page.locator('.toast-success')).toContainText('预约创建成功');
    
    // Step 2: 提交审批
    await page.click('button:has-text("提交审批")');
    await expect(page.locator('.booking-status')).toContainText('reviewing');
    
    // Step 3: 审批通过
    await page.goto('/dashboard/approvals');
    await page.click('.approval-item:first-child button:has-text("通过")');
    await page.fill('[name="reviewComment"]', '资源充足，审批通过');
    await page.click('button:has-text("确认通过")');
    
    await expect(page.locator('.toast-success')).toContainText('审批成功');
    
    // Step 4: 开始执行
    await page.goto('/dashboard/bookings');
    await page.click('.booking-item:first-child');
    await page.click('button:has-text("开始执行")');
    await expect(page.locator('.booking-status')).toContainText('in-progress');
    
    // Step 5: 完成任务
    await page.click('button:has-text("完成")');
    await page.fill('[name="feedback"]', '测试顺利完成');
    await page.click('button:has-text("提交反馈")');
    
    await expect(page.locator('.booking-status')).toContainText('completed');
  });

  test('边界情况：审批被拒绝', async ({ page }) => {
    // 创建预约
    await page.goto('/dashboard/bookings/new');
    await page.selectOption('[name="vehicleId"]', { label: 'Tesla Model 3' });
    await page.selectOption('[name="venueId"]', { label: '高速环道' });
    await page.fill('[name="startTime"]', '2026-01-28T09:00');
    await page.fill('[name="endTime"]', '2026-01-28T11:00');
    await page.click('button:has-text("创建预约")');
    
    // 提交审批
    await page.click('button:has-text("提交审批")');
    
    // 审批拒绝
    await page.goto('/dashboard/approvals');
    await page.click('.approval-item:first-child button:has-text("拒绝")');
    await page.fill('[name="rejectionReason"]', '场地维护中，暂不可用');
    await page.click('button:has-text("确认拒绝")');
    
    await expect(page.locator('.toast-info')).toContainText('审批已拒绝');
    
    // 验证状态为 rejected
    await page.goto('/dashboard/bookings');
    await expect(page.locator('.booking-item:first-child .status')).toContainText('rejected');
  });

  test('错误处理：未授权用户无法审批', async ({ page }) => {
    // 退出管理员，登录为普通用户
    await page.click('[data-testid="user-menu"]');
    await page.click('text=退出登录');
    
    await page.goto('/login');
    await page.fill('[name="username"]', 'driver');
    await page.fill('[name="password"]', 'driver123');
    await page.click('button[type="submit"]');
    
    // 尝试访问审批页面
    await page.goto('/dashboard/approvals');
    
    // 验证权限错误
    await expect(page.locator('.error-message')).toContainText('无权限访问');
  });

  test('边界情况：资源不可用时无法审批通过', async ({ page }) => {
    // 创建预约
    await page.goto('/dashboard/bookings/new');
    await page.selectOption('[name="vehicleId"]', { label: '维修中的车辆' });
    await page.selectOption('[name="venueId"]', { label: '高速环道' });
    await page.fill('[name="startTime"]', '2026-01-28T09:00');
    await page.fill('[name="endTime"]', '2026-01-28T11:00');
    await page.click('button:has-text("创建预约")');
    
    await page.click('button:has-text("提交审批")');
    
    // 尝试审批通过
    await page.goto('/dashboard/approvals');
    await page.click('.approval-item:first-child button:has-text("通过")');
    await page.click('button:has-text("确认通过")');
    
    // 验证错误提示
    await expect(page.locator('.toast-error')).toContainText('车辆当前不可用');
  });
});
```

**测试运行命令**：
```bash
npx playwright test __tests__/e2e/booking-approval.spec.ts
```

---

### 🎯 三大原则协同示例

**用户需求**："实现一个车辆预约功能，包括审批流程和动态定价"

**AI 执行流程**：

1. **应用原则 1 (状态机优先)**
   - 先输出预约状态机 Mermaid 图
   - 提供 XState 代码定义

2. **应用原则 2 (规则解耦)**
   - 询问："定价规则是否需要配置化？"
   - 创建 `lib/rules/booking-fee.rules.json`
   - 提供 Service 层集成代码

3. **应用原则 3 (闭环验证)**
   - 提供完整的 Playwright E2E 测试
   - 覆盖正常流程、边界情况、错误处理

---

### 📋 开发动作标准检查清单

在开始编码前，请确认：

- [ ] **状态流转场景**：是否已输出 XState 状态图和代码？
- [ ] **判断逻辑场景**：是否已询问是否需要 Zen Engine 配置化？
- [ ] **代码生成完成**：是否已提供对应的 Playwright 测试代码？
- [ ] **测试覆盖**：是否覆盖了正常流程、边界情况和错误处理？

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
