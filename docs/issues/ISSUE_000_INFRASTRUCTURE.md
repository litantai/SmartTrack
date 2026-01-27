# Issue #0: 【Infrastructure】详细设计规范文档与 TDD 基础环境搭建

## 📋 Issue 元信息 (Metadata)

- **Issue Number**: #0
- **Title**: 【Infrastructure】详细设计规范文档与 TDD 基础环境搭建
- **Labels**: `infrastructure`, `priority:P0`, `complexity:high`, `documentation`
- **Assignee**: 待分配
- **Estimated Time**: 3-4 days
- **Dependencies**: None (这是所有开发工作的基础)
- **Milestone**: Phase 1.0 - Foundation

---

## 🎯 任务目标 (Objective)

建立 SmartTrack 项目的开发基础设施，包括：
1. **详细设计规范文档** - 明确 API 契约、状态机流转图、业务规则示例
2. **测试驱动开发 (TDD) 环境** - 配置 Vitest 和内存数据库测试环境
3. **核心业务实体类型定义** - 建立类型安全的开发基础

此 Issue 是整个 Phase 1 开发的**前置依赖**，必须优先完成。

---

## 📝 任务内容 (Tasks)

### Task 1: 编写详细设计规范文档

**创建文件**: `docs/DETAILED_DESIGN.md`

**必须包含以下章节**:

#### 1.1 API 契约规范 (API Contract Specification)

定义所有 RESTful API 端点的详细规范，包括：

- **端点列表** - 所有 API 路由的完整清单
- **请求/响应格式** - 标准化的 JSON 结构
- **错误码定义** - 统一的错误代码体系
- **认证与授权** - 权限矩阵和访问控制规则

**示例结构**:
```markdown
### Vehicle Management API

#### GET /api/vehicles
**描述**: 获取车辆列表（支持分页、筛选、排序）

**请求参数**:
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20
- `status` (string, optional): 状态筛选 (available|booked|in-use|maintenance|retired)
- `type` (string, optional): 车型筛选 (sedan|suv|truck|sport|ev|other)
- `sortBy` (string, optional): 排序字段 (vehicleId|brand|createdAt)
- `sortOrder` (string, optional): 排序方向 (asc|desc)

**响应格式** (成功):
\`\`\`json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "67890abc",
        "vehicleId": "V001",
        "plateNumber": "京A12345",
        "brand": "Tesla",
        "model": "Model 3",
        "type": "ev",
        "status": "available",
        "specifications": {
          "year": 2023,
          "color": "白色",
          "transmission": "automatic"
        },
        "createdAt": "2026-01-15T08:00:00Z",
        "updatedAt": "2026-01-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "error": null,
  "meta": {
    "timestamp": "2026-01-26T10:00:00Z",
    "requestId": "req_abc123"
  }
}
\`\`\`

**响应格式** (错误):
\`\`\`json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "分页参数无效：page 必须大于 0",
    "details": {
      "field": "page",
      "value": -1,
      "constraint": "min:1"
    }
  },
  "meta": {
    "timestamp": "2026-01-26T10:00:00Z",
    "requestId": "req_abc124"
  }
}
\`\`\`
```

**要求**:
- 覆盖 Vehicle、Venue、Booking 三大核心模块的所有 API
- 每个端点必须包含：描述、请求参数、响应格式（成功和失败）、状态码
- 使用符合 `docs/AI_DEVELOPMENT.md` 的统一响应格式

---

#### 1.2 XState 状态机流转图 (State Machine Diagrams)

使用 **Mermaid** 语法绘制以下状态机的详细流转图：

##### 1.2.1 Vehicle State Machine (车辆状态机)

```mermaid
stateDiagram-v2
    [*] --> available: 车辆入场
    available --> booked: 被预约 (BOOK)
    booked --> in-use: 开始使用 (START)
    booked --> available: 取消预约 (CANCEL)
    in-use --> maintenance: 发现故障 (REPORT_ISSUE)
    in-use --> available: 使用完成 (COMPLETE)
    maintenance --> available: 维修完成 (FIX_COMPLETE)
    maintenance --> retired: 报废决策 (RETIRE)
    available --> maintenance: 定期保养 (SCHEDULE_MAINTENANCE)
    retired --> [*]
    
    note right of booked
        守卫条件:
        - 保险有效
        - 通过安全检查
    end note
    
    note right of maintenance
        自动触发:
        - 里程达到保养阈值
        - 使用时长超限
    end note
```

**要求**:
- 明确每个状态的定义和含义
- 标注所有状态转换事件（Events）
- 定义守卫条件（Guards）- 何时允许或拒绝状态转换
- 说明副作用动作（Actions）- 状态转换时需执行的操作（如发送通知、更新数据库）

##### 1.2.2 Booking State Machine (预约状态机)

```mermaid
stateDiagram-v2
    [*] --> draft: 创建草稿
    draft --> pending: 提交预约 (SUBMIT)
    draft --> [*]: 取消草稿 (DISCARD)
    pending --> reviewing: 进入审批 (SEND_TO_REVIEW)
    pending --> cancelled: 用户取消 (CANCEL)
    reviewing --> approved: 审批通过 (APPROVE)
    reviewing --> rejected: 审批拒绝 (REJECT)
    reviewing --> cancelled: 审批中取消 (CANCEL)
    approved --> confirmed: 系统确认 (CONFIRM)
    approved --> cancelled: 取消预约 (CANCEL)
    confirmed --> in-progress: 开始执行 (START)
    confirmed --> cancelled: 执行前取消 (CANCEL)
    in-progress --> completed: 任务完成 (COMPLETE)
    in-progress --> failed: 任务失败 (FAIL)
    rejected --> [*]
    cancelled --> [*]
    completed --> [*]
    failed --> [*]
    
    note right of reviewing
        审批规则:
        - 金额 > 5000 需管理员审批
        - 特殊车辆需技术审批
        - 高峰时段需额外审批
    end note
    
    note right of confirmed
        自动操作:
        - 锁定车辆资源
        - 锁定场地时段
        - 发送任务通知
    end note
```

**要求**:
- 覆盖预约的完整生命周期
- 明确审批流程和条件
- 定义自动化触发规则

---

#### 1.3 Zen Engine 业务规则逻辑示例 (Business Rules Examples)

提供 **至少两个** 实际的业务规则配置示例：

##### 1.3.1 费用计算规则 (Fee Calculation Rules)

**规则文件**: `lib/rules/fee-calculation.rules.json`

**业务需求**:
根据以下因素动态计算预约费用：
- **车型类型** - SUV、轿车、卡车的基础费率不同
- **场地类型** - 高速环道、测试场地的定价不同
- **预约时长** - 时长折扣：2-4小时 9折，超过4小时 8折
- **时段类型** - 高峰时段（工作日 9:00-17:00）加收 50%
- **用户等级** - VIP 客户享受 8折，Gold 客户 9折，普通客户无折扣

**示例 Zen Engine JSON**:
```json
{
  "contentType": "application/vnd.gorules.decision",
  "nodes": [
    {
      "id": "input-node",
      "type": "inputNode",
      "position": { "x": 100, "y": 100 },
      "content": {
        "fields": [
          { "name": "vehicleType", "field": "vehicleType", "fieldType": "string" },
          { "name": "venueType", "field": "venueType", "fieldType": "string" },
          { "name": "duration", "field": "duration", "fieldType": "number" },
          { "name": "isPeakHour", "field": "isPeakHour", "fieldType": "boolean" },
          { "name": "userLevel", "field": "userLevel", "fieldType": "string" }
        ]
      }
    },
    {
      "id": "base-fee-table",
      "type": "decisionTableNode",
      "position": { "x": 400, "y": 100 },
      "content": {
        "key": "base-fee-calculation",
        "hitPolicy": "first",
        "inputs": [
          { "field": "vehicleType", "name": "车型类型" },
          { "field": "venueType", "name": "场地类型" }
        ],
        "outputs": [
          { "field": "baseFee", "name": "基础费用" }
        ],
        "rules": [
          {
            "_id": "rule-1",
            "vehicleType": "suv",
            "venueType": "track",
            "baseFee": 800
          },
          {
            "_id": "rule-2",
            "vehicleType": "suv",
            "venueType": "test-pad",
            "baseFee": 600
          },
          {
            "_id": "rule-3",
            "vehicleType": "sedan",
            "venueType": "track",
            "baseFee": 500
          },
          {
            "_id": "rule-4",
            "vehicleType": "sedan",
            "venueType": "test-pad",
            "baseFee": 350
          },
          {
            "_id": "rule-5",
            "vehicleType": "truck",
            "venueType": "track",
            "baseFee": 1200
          },
          {
            "_id": "rule-6",
            "vehicleType": "truck",
            "venueType": "test-pad",
            "baseFee": 900
          }
        ]
      }
    },
    {
      "id": "duration-discount-table",
      "type": "decisionTableNode",
      "position": { "x": 700, "y": 100 },
      "content": {
        "key": "duration-discount",
        "hitPolicy": "first",
        "inputs": [
          { "field": "duration", "name": "预约时长" }
        ],
        "outputs": [
          { "field": "durationDiscount", "name": "时长折扣" }
        ],
        "rules": [
          {
            "_id": "duration-1",
            "duration": "<= 2",
            "durationDiscount": 1.0
          },
          {
            "_id": "duration-2",
            "duration": "> 2 && <= 4",
            "durationDiscount": 0.9
          },
          {
            "_id": "duration-3",
            "duration": "> 4",
            "durationDiscount": 0.8
          }
        ]
      }
    },
    {
      "id": "peak-hour-multiplier",
      "type": "expressionNode",
      "position": { "x": 1000, "y": 100 },
      "content": {
        "key": "peak-multiplier",
        "expressions": [
          {
            "key": "peakMultiplier",
            "value": "isPeakHour ? 1.5 : 1.0"
          }
        ]
      }
    },
    {
      "id": "user-level-discount-table",
      "type": "decisionTableNode",
      "position": { "x": 1300, "y": 100 },
      "content": {
        "key": "user-level-discount",
        "hitPolicy": "first",
        "inputs": [
          { "field": "userLevel", "name": "用户等级" }
        ],
        "outputs": [
          { "field": "userDiscount", "name": "会员折扣" }
        ],
        "rules": [
          {
            "_id": "level-1",
            "userLevel": "VIP",
            "userDiscount": 0.8
          },
          {
            "_id": "level-2",
            "userLevel": "Gold",
            "userDiscount": 0.9
          },
          {
            "_id": "level-3",
            "userLevel": "Regular",
            "userDiscount": 1.0
          }
        ]
      }
    },
    {
      "id": "final-calculation",
      "type": "expressionNode",
      "position": { "x": 1600, "y": 100 },
      "content": {
        "key": "final-fee-calculation",
        "expressions": [
          {
            "key": "intermediateAmount",
            "value": "baseFee * peakMultiplier"
          },
          {
            "key": "finalFee",
            "value": "intermediateAmount * durationDiscount * userDiscount"
          }
        ]
      }
    },
    {
      "id": "output-node",
      "type": "outputNode",
      "position": { "x": 1900, "y": 100 },
      "content": {
        "fields": [
          { "name": "finalFee", "field": "finalFee", "fieldType": "number" },
          { "name": "breakdown", "field": "breakdown", "fieldType": "object" }
        ]
      }
    }
  ],
  "edges": [
    { "id": "e1", "sourceId": "input-node", "targetId": "base-fee-table" },
    { "id": "e2", "sourceId": "base-fee-table", "targetId": "duration-discount-table" },
    { "id": "e3", "sourceId": "duration-discount-table", "targetId": "peak-hour-multiplier" },
    { "id": "e4", "sourceId": "peak-hour-multiplier", "targetId": "user-level-discount-table" },
    { "id": "e5", "sourceId": "user-level-discount-table", "targetId": "final-calculation" },
    { "id": "e6", "sourceId": "final-calculation", "targetId": "output-node" }
  ]
}
```

**集成代码示例**:
```typescript
// lib/db/services/fee-calculator.service.ts
import { ZenEngine } from '@gorules/zen-engine';
import feeCalculationRules from '@/lib/rules/fee-calculation.rules.json';

export class FeeCalculatorService {
  private static engine = new ZenEngine();
  private static decision = this.engine.createDecision(feeCalculationRules);

  static async calculateBookingFee(input: {
    vehicleType: string;
    venueType: string;
    duration: number;
    isPeakHour: boolean;
    userLevel: string;
  }) {
    const result = await this.decision.evaluate(input);
    
    return {
      finalFee: Math.round(result.finalFee * 100) / 100, // 保留两位小数
      breakdown: {
        baseFee: result.baseFee,
        peakMultiplier: result.peakMultiplier,
        durationDiscount: result.durationDiscount,
        userDiscount: result.userDiscount,
        intermediateAmount: result.intermediateAmount
      }
    };
  }
}
```

##### 1.3.2 准入校验规则 (Access Control Rules)

**规则文件**: `lib/rules/access-validation.rules.json`

**业务需求**:
在用户创建预约时，校验以下条件：
- **用户资质** - 驾驶员必须有有效驾照，且未过期
- **车辆状态** - 车辆必须处于 `available` 状态，保险有效，且已通过安全检查
- **场地限制** - 特殊场地（如高速环道）只允许经验丰富的驾驶员使用
- **时间冲突** - 车辆和场地在预约时段内无其他冲突预约
- **预约额度** - 用户当月预约次数未超限（普通用户最多5次，VIP无限制）

**示例 Zen Engine JSON** (简化版):
```json
{
  "contentType": "application/vnd.gorules.decision",
  "nodes": [
    {
      "id": "input",
      "type": "inputNode",
      "content": {
        "fields": [
          { "name": "driverLicenseValid", "fieldType": "boolean" },
          { "name": "vehicleStatus", "fieldType": "string" },
          { "name": "vehicleInsuranceValid", "fieldType": "boolean" },
          { "name": "venueRequiresExperience", "fieldType": "boolean" },
          { "name": "driverExperienceYears", "fieldType": "number" },
          { "name": "hasConflict", "fieldType": "boolean" },
          { "name": "userLevel", "fieldType": "string" },
          { "name": "monthlyBookingCount", "fieldType": "number" }
        ]
      }
    },
    {
      "id": "validation-rules",
      "type": "decisionTableNode",
      "content": {
        "hitPolicy": "collect",
        "inputs": [
          { "field": "driverLicenseValid" },
          { "field": "vehicleStatus" },
          { "field": "vehicleInsuranceValid" },
          { "field": "venueRequiresExperience" },
          { "field": "driverExperienceYears" },
          { "field": "hasConflict" },
          { "field": "userLevel" },
          { "field": "monthlyBookingCount" }
        ],
        "outputs": [
          { "field": "isValid", "fieldType": "boolean" },
          { "field": "rejectReason", "fieldType": "string" }
        ],
        "rules": [
          {
            "_id": "rule-license",
            "driverLicenseValid": "== false",
            "isValid": false,
            "rejectReason": "驾驶证无效或已过期，请更新后重试"
          },
          {
            "_id": "rule-vehicle-status",
            "vehicleStatus": "!= 'available'",
            "isValid": false,
            "rejectReason": "车辆当前不可用，请选择其他车辆"
          },
          {
            "_id": "rule-insurance",
            "vehicleInsuranceValid": "== false",
            "isValid": false,
            "rejectReason": "车辆保险已过期，无法预约"
          },
          {
            "_id": "rule-experience",
            "venueRequiresExperience": "== true",
            "driverExperienceYears": "< 3",
            "isValid": false,
            "rejectReason": "该场地要求至少3年驾驶经验"
          },
          {
            "_id": "rule-conflict",
            "hasConflict": "== true",
            "isValid": false,
            "rejectReason": "该时段存在冲突，请选择其他时间"
          },
          {
            "_id": "rule-quota-regular",
            "userLevel": "== 'Regular'",
            "monthlyBookingCount": ">= 5",
            "isValid": false,
            "rejectReason": "本月预约次数已达上限（5次），请升级为VIP会员"
          }
        ]
      }
    },
    {
      "id": "output",
      "type": "outputNode",
      "content": {
        "fields": [
          { "name": "canProceed", "fieldType": "boolean" },
          { "name": "validationErrors", "fieldType": "array" }
        ]
      }
    }
  ],
  "edges": [
    { "sourceId": "input", "targetId": "validation-rules" },
    { "sourceId": "validation-rules", "targetId": "output" }
  ]
}
```

**要求**:
- 每个规则文件必须符合 Zen Engine 标准格式
- 提供详细的业务背景说明
- 包含完整的 Service 层集成示例代码

---

### Task 2: 初始化 Vitest 测试环境

**目标**: 配置 Vitest 作为单元测试框架，替代 Jest (更快、更适合 Vite/Next.js 15)

#### 2.1 安装依赖

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

#### 2.2 创建配置文件

**文件**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '__tests__/',
        '*.config.ts',
        '*.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types')
    }
  }
});
```

**文件**: `vitest.setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 自动清理 React 组件
afterEach(() => {
  cleanup();
});

// 扩展 matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
```

#### 2.3 配置内存数据库 (MongoDB Memory Server)

**安装依赖**:
```bash
npm install -D mongodb-memory-server
```

**创建工具文件**: `__tests__/utils/test-db.ts`

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

/**
 * 启动内存数据库（测试开始时调用）
 */
export async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('✅ Test database connected');
}

/**
 * 清空所有集合（每个测试后调用）
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * 断开连接并停止内存数据库（测试结束时调用）
 */
export async function disconnectTestDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    console.log('✅ Test database disconnected');
  }
}

/**
 * 创建测试数据辅助函数
 */
export async function seedTestData() {
  // 可在这里预置通用测试数据
  // 例如：创建测试用户、测试车辆等
}
```

#### 2.4 编写测试示例

**文件**: `__tests__/unit/services/base.service.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../utils/test-db';
import { BaseService } from '@/lib/db/services/base.service';
import mongoose, { Schema } from 'mongoose';

describe('BaseService', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('should create a new document', async () => {
    // 测试用例示例
    expect(true).toBe(true);
  });

  it('should find a document by id', async () => {
    // 测试用例示例
    expect(true).toBe(true);
  });
});
```

#### 2.5 更新 package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**验收标准**:
- [ ] Vitest 配置正确，可正常运行测试
- [ ] 内存数据库启动和清理逻辑正常工作
- [ ] 至少有一个示例测试通过
- [ ] 覆盖率报告可正常生成

---

### Task 3: 定义核心业务实体的 TypeScript Interface

**目标**: 建立项目的类型安全基础，定义所有核心数据模型的接口

#### 3.1 创建类型定义文件

**文件**: `types/models.ts`

```typescript
import { ObjectId } from 'mongodb';

// ==================== User 用户 ====================
export interface IUser {
  _id: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  profile: UserProfile;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'manager' | 'driver' | 'visitor';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserProfile {
  fullName: string;
  phone?: string;
  avatar?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
}

// ==================== Vehicle 车辆 ====================
export interface IVehicle {
  _id: ObjectId;
  vehicleId: string;
  plateNumber: string;
  brand: string;
  model: string;
  type: VehicleType;
  status: VehicleStatus;
  specifications: VehicleSpecifications;
  insurance: InsuranceInfo;
  maintenance: MaintenanceInfo;
  usage: UsageStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'sport' | 'ev' | 'other';
export type VehicleStatus = 'available' | 'booked' | 'in-use' | 'maintenance' | 'retired';

export interface VehicleSpecifications {
  year: number;
  color: string;
  engine?: string;
  transmission?: 'manual' | 'automatic';
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  expiryDate: Date;
  coverageAmount: number;
}

export interface MaintenanceInfo {
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  serviceHistory: ServiceRecord[];
}

export interface ServiceRecord {
  date: Date;
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  cost: number;
}

export interface UsageStatistics {
  totalMileage: number;
  totalHours: number;
  totalBookings: number;
}

// ==================== Venue 场地 ====================
export interface IVenue {
  _id: ObjectId;
  venueId: string;
  name: string;
  type: VenueType;
  location: VenueLocation;
  capacity: number;
  features: string[];
  status: VenueStatus;
  pricing: VenuePricing;
  availability: AvailabilitySchedule;
  createdAt: Date;
  updatedAt: Date;
}

export type VenueType = 'track' | 'test-pad' | 'simulation' | 'inspection' | 'other';
export type VenueStatus = 'active' | 'maintenance' | 'closed';

export interface VenueLocation {
  building?: string;
  floor?: string;
  area: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface VenuePricing {
  baseRate: number;
  currency: string;
  peakHourMultiplier: number;
  minimumDuration: number;
}

export interface AvailabilitySchedule {
  workingHours: {
    start: string; // "08:00"
    end: string;   // "18:00"
  };
  workingDays: number[]; // [1, 2, 3, 4, 5] 周一到周五
  maintenanceBlocks: MaintenanceBlock[];
}

export interface MaintenanceBlock {
  startDate: Date;
  endDate: Date;
  reason: string;
}

// ==================== Booking 预约 ====================
export interface IBooking {
  _id: ObjectId;
  bookingId: string;
  userId: ObjectId;
  vehicleId: ObjectId;
  venueId: ObjectId;
  status: BookingStatus;
  timeSlot: TimeSlot;
  purpose: string;
  estimatedFee: number;
  actualFee?: number;
  approval?: ApprovalInfo;
  feedback?: BookingFeedback;
  metadata: BookingMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 
  | 'draft' 
  | 'pending' 
  | 'reviewing' 
  | 'approved' 
  | 'rejected' 
  | 'confirmed' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

export interface ApprovalInfo {
  reviewerId?: ObjectId;
  reviewedAt?: Date;
  decision: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

export interface BookingFeedback {
  rating: number; // 1-5
  comments: string;
  issues?: string[];
  submittedAt: Date;
}

export interface BookingMetadata {
  createdBy: ObjectId;
  lastModifiedBy?: ObjectId;
  cancelledBy?: ObjectId;
  cancellationReason?: string;
  source: 'web' | 'mobile' | 'api';
}

// ==================== DTO Types (用于 API 请求/响应) ====================

export interface CreateVehicleDTO {
  vehicleId: string;
  plateNumber: string;
  brand: string;
  model: string;
  type: VehicleType;
  specifications: VehicleSpecifications;
  insurance: InsuranceInfo;
}

export interface UpdateVehicleDTO {
  brand?: string;
  model?: string;
  type?: VehicleType;
  status?: VehicleStatus;
  specifications?: Partial<VehicleSpecifications>;
  insurance?: Partial<InsuranceInfo>;
}

export interface CreateBookingDTO {
  vehicleId: string;
  venueId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
}

export interface UpdateBookingDTO {
  startTime?: Date;
  endTime?: Date;
  purpose?: string;
  status?: BookingStatus;
}

// ==================== API Response Types ====================

export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  error: APIError | null;
  meta?: APIMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface APIMeta {
  timestamp?: string;
  requestId?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

**文件**: `types/api.ts`

```typescript
// API 请求和响应的专用类型

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleListParams extends ListQueryParams {
  status?: string;
  type?: string;
  brand?: string;
}

export interface BookingListParams extends ListQueryParams {
  status?: string;
  userId?: string;
  vehicleId?: string;
  venueId?: string;
  startDate?: string;
  endDate?: string;
}

export interface VenueListParams extends ListQueryParams {
  type?: string;
  status?: string;
  available?: boolean;
}
```

**文件**: `types/common.ts`

```typescript
// 通用工具类型

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ID = string | number;

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteFields {
  deletedAt?: Date;
  isDeleted: boolean;
}
```

**验收标准**:
- [ ] 所有核心实体有完整的 TypeScript 接口定义
- [ ] DTO 类型与数据模型清晰分离
- [ ] 类型定义符合 TypeScript 严格模式
- [ ] 导出的类型可被其他模块正常引用

---

## ✅ 验收标准 (Acceptance Criteria)

### 文档完整性
- [ ] `docs/DETAILED_DESIGN.md` 创建完成，包含所有必需章节
- [ ] API 契约覆盖 Vehicle、Venue、Booking 三大模块
- [ ] XState 状态机流转图完整且可视化清晰
- [ ] Zen Engine 规则示例真实可用，包含完整的集成代码

### 测试环境可用性
- [ ] Vitest 配置正确，`npm run test` 可正常运行
- [ ] MongoDB Memory Server 正常启动和清理
- [ ] 至少有一个通过的测试示例
- [ ] 测试覆盖率报告可正常生成

### 类型定义完整性
- [ ] `types/models.ts`、`types/api.ts`、`types/common.ts` 创建完成
- [ ] 所有核心实体有完整的 TypeScript 接口
- [ ] 类型定义在 `tsconfig.json` 严格模式下无错误
- [ ] 类型可在其他模块正常导入使用

### 代码质量
- [ ] 所有文档使用清晰的 Markdown 格式，无语法错误
- [ ] 代码示例正确且可直接运行
- [ ] 文件结构符合项目规范

---

## 📚 参考资料 (References)

- [SmartTrack AI Development Guide](../AI_DEVELOPMENT.md)
- [XState Documentation](https://stately.ai/docs/xstate)
- [Zen Engine Documentation](https://gorules.io/docs)
- [Vitest Documentation](https://vitest.dev/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

## 🔗 相关 Issue (Related Issues)

此 Issue 是以下 Issue 的**前置依赖**（必须先完成 #0，才能开始以下任务）：

- **Issue #T004** - Vehicle 模型定义
- **Issue #T005** - Venue 模型定义
- **Issue #T006** - Booking 模型定义
- 以及所有 Phase 1.1 及以后的任务

---

## 🚀 下一步行动 (Next Steps)

完成此 Issue 后，立即开始 Phase 1.1 的三个数据模型任务（可并行开发）：
1. Issue #T004 - Vehicle Model
2. Issue #T005 - Venue Model
3. Issue #T006 - Booking Model

---

**Last Updated**: 2026-01-26  
**Version**: 1.0  
**Priority**: P0 (最高优先级)
