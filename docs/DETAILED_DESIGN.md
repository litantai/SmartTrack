# SmartTrack 详细设计规范文档
# Detailed Design Specification

> **文档版本**: v1.0.0  
> **最后更新**: 2026-01-27  
> **维护者**: SmartTrack Development Team

---

## 📋 目录 (Table of Contents)

1. [API 契约规范 (API Contract Specification)](#1-api-契约规范-api-contract-specification)
   - 1.1 [Vehicle Management API](#11-vehicle-management-api)
   - 1.2 [Venue Management API](#12-venue-management-api)
   - 1.3 [Booking Management API](#13-booking-management-api)
   - 1.4 [通用错误码定义](#14-通用错误码定义-error-codes)
2. [XState 状态机流转图 (State Machine Diagrams)](#2-xstate-状态机流转图-state-machine-diagrams)
   - 2.1 [Vehicle State Machine](#21-vehicle-state-machine-车辆状态机)
   - 2.2 [Booking State Machine](#22-booking-state-machine-预约状态机)
3. [Zen Engine 业务规则逻辑示例](#3-zen-engine-业务规则逻辑示例-business-rules-examples)
   - 3.1 [费用计算规则](#31-费用计算规则-fee-calculation-rules)
   - 3.2 [准入校验规则](#32-准入校验规则-access-control-rules)

---

## 1. API 契约规范 (API Contract Specification)

### 1.1 Vehicle Management API

#### GET /api/vehicles

**描述**: 获取车辆列表（支持分页、筛选、排序）

**认证**: 需要登录（所有角色）

**请求参数**:
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20，最大 100
- `status` (string, optional): 状态筛选 (available|booked|in-use|maintenance|retired)
- `type` (string, optional): 车型筛选 (sedan|suv|truck|sport|ev|other)
- `brand` (string, optional): 品牌筛选（模糊匹配）
- `sortBy` (string, optional): 排序字段 (vehicleId|brand|createdAt)，默认 createdAt
- `sortOrder` (string, optional): 排序方向 (asc|desc)，默认 desc

**响应格式 (成功 - 200 OK)**:
```json
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
          "engine": "电动",
          "transmission": "automatic"
        },
        "insurance": {
          "provider": "中国平安",
          "policyNumber": "PA202301001",
          "expiryDate": "2026-12-31T00:00:00Z",
          "coverageAmount": 1000000
        },
        "usage": {
          "totalMileage": 15000,
          "totalHours": 500,
          "totalBookings": 45
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
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**响应格式 (错误 - 400 Bad Request)**:
```json
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
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "req_abc124"
  }
}
```

---

#### GET /api/vehicles/:id

**描述**: 获取指定车辆的详细信息

**认证**: 需要登录（所有角色）

**路径参数**:
- `id` (string, required): 车辆的 MongoDB ObjectId 或 vehicleId

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
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
      "engine": "电动",
      "transmission": "automatic"
    },
    "insurance": {
      "provider": "中国平安",
      "policyNumber": "PA202301001",
      "expiryDate": "2026-12-31T00:00:00Z",
      "coverageAmount": 1000000
    },
    "maintenance": {
      "lastServiceDate": "2026-01-10T00:00:00Z",
      "nextServiceDate": "2026-07-10T00:00:00Z",
      "serviceHistory": [
        {
          "date": "2026-01-10T00:00:00Z",
          "type": "routine",
          "description": "常规保养：更换机油、空滤",
          "cost": 800
        }
      ]
    },
    "usage": {
      "totalMileage": 15000,
      "totalHours": 500,
      "totalBookings": 45
    },
    "createdAt": "2026-01-15T08:00:00Z",
    "updatedAt": "2026-01-20T10:30:00Z"
  },
  "error": null,
  "meta": {
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "req_abc125"
  }
}
```

**响应格式 (错误 - 404 Not Found)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "车辆不存在",
    "details": {
      "vehicleId": "V999"
    }
  },
  "meta": {
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "req_abc126"
  }
}
```

---

#### POST /api/vehicles

**描述**: 创建新车辆

**认证**: 需要 admin 或 manager 角色

**请求体**:
```json
{
  "vehicleId": "V002",
  "plateNumber": "京B67890",
  "brand": "BMW",
  "model": "X5",
  "type": "suv",
  "specifications": {
    "year": 2024,
    "color": "黑色",
    "engine": "3.0T",
    "transmission": "automatic"
  },
  "insurance": {
    "provider": "太平洋保险",
    "policyNumber": "TP202401001",
    "expiryDate": "2027-01-31T00:00:00Z",
    "coverageAmount": 1500000
  }
}
```

**响应格式 (成功 - 201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "67890def",
    "vehicleId": "V002",
    "plateNumber": "京B67890",
    "brand": "BMW",
    "model": "X5",
    "type": "suv",
    "status": "available",
    "specifications": {
      "year": 2024,
      "color": "黑色",
      "engine": "3.0T",
      "transmission": "automatic"
    },
    "insurance": {
      "provider": "太平洋保险",
      "policyNumber": "TP202401001",
      "expiryDate": "2027-01-31T00:00:00Z",
      "coverageAmount": 1500000
    },
    "maintenance": {
      "serviceHistory": []
    },
    "usage": {
      "totalMileage": 0,
      "totalHours": 0,
      "totalBookings": 0
    },
    "createdAt": "2026-01-27T10:00:00Z",
    "updatedAt": "2026-01-27T10:00:00Z"
  },
  "error": null,
  "meta": {
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "req_abc127"
  }
}
```

**响应格式 (错误 - 409 Conflict)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "车辆编号或车牌号已存在",
    "details": {
      "field": "vehicleId",
      "value": "V002"
    }
  },
  "meta": {
    "timestamp": "2026-01-27T10:00:00Z",
    "requestId": "req_abc128"
  }
}
```

---

#### PATCH /api/vehicles/:id

**描述**: 更新车辆信息（部分更新）

**认证**: 需要 admin 或 manager 角色

**路径参数**:
- `id` (string, required): 车辆 ID

**请求体** (所有字段可选):
```json
{
  "brand": "BMW",
  "model": "X5 M Sport",
  "status": "maintenance",
  "specifications": {
    "color": "深灰色"
  }
}
```

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "67890def",
    "vehicleId": "V002",
    "plateNumber": "京B67890",
    "brand": "BMW",
    "model": "X5 M Sport",
    "type": "suv",
    "status": "maintenance",
    "specifications": {
      "year": 2024,
      "color": "深灰色",
      "engine": "3.0T",
      "transmission": "automatic"
    },
    "updatedAt": "2026-01-27T10:30:00Z"
  },
  "error": null
}
```

---

#### DELETE /api/vehicles/:id

**描述**: 删除车辆（软删除，状态改为 retired）

**认证**: 需要 admin 角色

**路径参数**:
- `id` (string, required): 车辆 ID

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "车辆已成功标记为 retired",
    "vehicleId": "V002"
  },
  "error": null
}
```

---

### 1.2 Venue Management API

#### GET /api/venues

**描述**: 获取场地列表（支持分页、筛选、排序）

**认证**: 需要登录（所有角色）

**请求参数**:
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20
- `type` (string, optional): 类型筛选 (track|test-pad|simulation|inspection|other)
- `status` (string, optional): 状态筛选 (active|maintenance|closed)
- `available` (boolean, optional): 是否仅显示可用场地
- `sortBy` (string, optional): 排序字段 (venueId|name|capacity)
- `sortOrder` (string, optional): 排序方向 (asc|desc)

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "venue001",
        "venueId": "A01",
        "name": "高速环道",
        "type": "track",
        "location": {
          "building": "测试中心",
          "area": "北区",
          "coordinates": {
            "latitude": 39.9042,
            "longitude": 116.4074
          }
        },
        "capacity": 5,
        "features": ["高速测试", "ABS测试", "紧急制动"],
        "status": "active",
        "pricing": {
          "baseRate": 500,
          "currency": "CNY",
          "peakHourMultiplier": 1.5,
          "minimumDuration": 60
        },
        "availability": {
          "workingHours": {
            "start": "08:00",
            "end": "18:00"
          },
          "workingDays": [1, 2, 3, 4, 5],
          "maintenanceBlocks": []
        },
        "createdAt": "2026-01-10T08:00:00Z",
        "updatedAt": "2026-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 25,
      "totalPages": 2
    }
  },
  "error": null
}
```

---

#### GET /api/venues/:id

**描述**: 获取指定场地的详细信息

**路径参数**:
- `id` (string, required): 场地 ID

**响应格式**: 与列表项相同，返回单个场地详情

---

#### POST /api/venues

**描述**: 创建新场地

**认证**: 需要 admin 或 manager 角色

**请求体**:
```json
{
  "venueId": "B02",
  "name": "综合测试场",
  "type": "test-pad",
  "location": {
    "building": "测试中心",
    "area": "南区"
  },
  "capacity": 3,
  "features": ["NVH测试", "悬挂测试"],
  "pricing": {
    "baseRate": 350,
    "currency": "CNY",
    "peakHourMultiplier": 1.3,
    "minimumDuration": 120
  }
}
```

**响应格式**: 返回创建的场地详情（201 Created）

---

#### PATCH /api/venues/:id

**描述**: 更新场地信息

**认证**: 需要 admin 或 manager 角色

**响应格式**: 返回更新后的场地详情（200 OK）

---

#### DELETE /api/venues/:id

**描述**: 删除场地（软删除，状态改为 closed）

**认证**: 需要 admin 角色

**响应格式**: 确认消息（200 OK）

---

### 1.3 Booking Management API

#### GET /api/bookings

**描述**: 获取预约列表（支持分页、筛选、排序）

**认证**: 
- admin/manager: 可查看所有预约
- driver: 仅查看自己的预约

**请求参数**:
- `page` (number, optional): 页码
- `pageSize` (number, optional): 每页数量
- `status` (string, optional): 状态筛选（支持多个，逗号分隔）
- `userId` (string, optional): 用户 ID 筛选（仅 admin/manager）
- `vehicleId` (string, optional): 车辆 ID 筛选
- `venueId` (string, optional): 场地 ID 筛选
- `startDate` (string, optional): 开始日期筛选（ISO 8601 格式）
- `endDate` (string, optional): 结束日期筛选
- `sortBy` (string, optional): 排序字段
- `sortOrder` (string, optional): 排序方向

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking001",
        "bookingId": "BK20260127001",
        "userId": "user123",
        "vehicleId": "V001",
        "venueId": "A01",
        "status": "confirmed",
        "timeSlot": {
          "startTime": "2026-01-28T09:00:00Z",
          "endTime": "2026-01-28T11:00:00Z",
          "durationMinutes": 120
        },
        "purpose": "高速制动性能测试",
        "estimatedFee": 1500,
        "actualFee": null,
        "approval": {
          "reviewerId": "admin001",
          "reviewedAt": "2026-01-27T10:00:00Z",
          "decision": "approved",
          "comments": "资源充足，审批通过"
        },
        "metadata": {
          "createdBy": "user123",
          "source": "web"
        },
        "createdAt": "2026-01-27T09:00:00Z",
        "updatedAt": "2026-01-27T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "error": null
}
```

---

#### GET /api/bookings/:id

**描述**: 获取指定预约的详细信息

**路径参数**:
- `id` (string, required): 预约 ID

**响应格式**: 返回单个预约详情（200 OK）

---

#### POST /api/bookings

**描述**: 创建新预约

**认证**: 需要登录（driver 及以上）

**请求体**:
```json
{
  "vehicleId": "V001",
  "venueId": "A01",
  "startTime": "2026-01-28T09:00:00Z",
  "endTime": "2026-01-28T11:00:00Z",
  "purpose": "高速制动性能测试"
}
```

**业务规则**:
1. 系统自动校验车辆和场地的可用性
2. 检测时间段冲突
3. 调用 Zen Engine 进行准入校验
4. 计算预估费用
5. 根据金额决定是否需要审批

**响应格式 (成功 - 201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "booking002",
    "bookingId": "BK20260127002",
    "status": "pending",
    "estimatedFee": 1500,
    "requiresApproval": true,
    "message": "预约已创建，等待审批"
  },
  "error": null
}
```

**响应格式 (错误 - 400 Bad Request - 校验失败)**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "预约创建失败：资源冲突",
    "details": {
      "validationErrors": [
        {
          "rule": "hasConflict",
          "message": "该时段存在冲突，请选择其他时间"
        }
      ]
    }
  }
}
```

---

#### PATCH /api/bookings/:id

**描述**: 更新预约信息

**认证**: 
- 预约创建者可以更新状态为 draft/pending 的预约
- admin/manager 可以更新任何预约

**请求体**:
```json
{
  "startTime": "2026-01-28T10:00:00Z",
  "endTime": "2026-01-28T12:00:00Z",
  "purpose": "更新后的测试目的"
}
```

**响应格式**: 返回更新后的预约详情（200 OK）

---

#### POST /api/bookings/:id/approve

**描述**: 审批预约

**认证**: 需要 admin 或 manager 角色

**请求体**:
```json
{
  "decision": "approved",
  "comments": "资源充足，审批通过"
}
```

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "booking001",
    "status": "approved",
    "approval": {
      "reviewerId": "admin001",
      "reviewedAt": "2026-01-27T10:30:00Z",
      "decision": "approved",
      "comments": "资源充足，审批通过"
    }
  },
  "error": null
}
```

---

#### POST /api/bookings/:id/cancel

**描述**: 取消预约

**认证**: 
- 预约创建者可取消自己的预约
- admin/manager 可取消任何预约

**请求体**:
```json
{
  "reason": "计划变更，需要取消预约"
}
```

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "booking001",
    "status": "cancelled",
    "metadata": {
      "cancelledBy": "user123",
      "cancellationReason": "计划变更，需要取消预约"
    }
  },
  "error": null
}
```

---

#### POST /api/bookings/:id/complete

**描述**: 完成预约（附带反馈）

**认证**: 需要 admin 或 manager 角色

**请求体**:
```json
{
  "actualFee": 1500,
  "feedback": {
    "rating": 5,
    "comments": "测试顺利完成，设备运行良好",
    "issues": []
  }
}
```

**响应格式 (成功 - 200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "booking001",
    "status": "completed",
    "actualFee": 1500,
    "feedback": {
      "rating": 5,
      "comments": "测试顺利完成，设备运行良好",
      "issues": [],
      "submittedAt": "2026-01-28T11:30:00Z"
    }
  },
  "error": null
}
```

---

### 1.4 通用错误码定义 (Error Codes)

| 错误码 | HTTP 状态码 | 描述 | 示例场景 |
|--------|------------|------|----------|
| `VALIDATION_ERROR` | 400 | 请求参数校验失败 | 缺少必填字段、格式错误 |
| `INVALID_PARAMETER` | 400 | 参数值无效 | page < 0, pageSize > 100 |
| `VALIDATION_FAILED` | 400 | 业务规则校验失败 | Zen Engine 规则拒绝 |
| `UNAUTHORIZED` | 401 | 未认证 | Token 缺失或过期 |
| `FORBIDDEN` | 403 | 权限不足 | 普通用户尝试删除车辆 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 | 车辆 ID 不存在 |
| `DUPLICATE_RESOURCE` | 409 | 资源重复 | 车牌号已存在 |
| `CONFLICT` | 409 | 业务冲突 | 时间段冲突 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 数据库连接失败 |

---
## 2. XState 状态机流转图 (State Machine Diagrams)

### 2.1 Vehicle State Machine (车辆状态机)

#### 状态流转图

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
        守卫条件 (Guards):
        - 保险有效
        - 通过安全检查
        - 无维修记录中的重大问题
    end note
    
    note right of maintenance
        自动触发条件:
        - 里程达到保养阈值 (每 10,000 km)
        - 使用时长超限 (每 6 个月)
        - 安全检查不通过
    end note
    
    note right of in-use
        副作用动作 (Actions):
        - 记录使用开始时间
        - 锁定车辆资源
        - 发送通知给管理员
    end note
```

#### 状态定义 (States Definition)

| 状态 | 含义 | 允许的操作 | 备注 |
|------|------|-----------|------|
| `available` | 可用 | 预约、定期保养 | 车辆处于待命状态，可被预约 |
| `booked` | 已预约 | 开始使用、取消预约 | 车辆已被预约但尚未开始使用 |
| `in-use` | 使用中 | 完成使用、报告故障 | 车辆正在被使用，不可预约 |
| `maintenance` | 维护中 | 维修完成、报废 | 车辆正在维修或保养 |
| `retired` | 已报废 | 无 | 车辆生命周期结束，不可再使用 |

#### 事件定义 (Events Definition)

| 事件 | 含义 | 触发条件 | 参数 |
|------|------|---------|------|
| `BOOK` | 被预约 | 用户创建预约 | `bookingId` |
| `CANCEL` | 取消预约 | 用户取消预约 | `reason` |
| `START` | 开始使用 | 预约时间到达，开始使用 | `startTime` |
| `COMPLETE` | 使用完成 | 测试任务完成 | `endTime`, `mileage` |
| `REPORT_ISSUE` | 报告故障 | 使用中发现问题 | `issueDescription` |
| `SCHEDULE_MAINTENANCE` | 安排保养 | 管理员手动触发或系统自动触发 | `maintenanceType` |
| `FIX_COMPLETE` | 维修完成 | 维修人员确认 | `serviceRecord` |
| `RETIRE` | 报废 | 管理员决策 | `retireReason` |

#### 守卫条件 (Guards)

```typescript
// lib/state-machines/guards/vehicle.guards.ts
export const vehicleGuards = {
  // 检查保险是否有效
  hasValidInsurance: (context: VehicleContext) => {
    const { insurance } = context;
    return new Date(insurance.expiryDate) > new Date();
  },
  
  // 检查是否通过安全检查
  passedSafetyCheck: (context: VehicleContext) => {
    const { maintenance } = context;
    // 检查最近的维修记录中是否有安全问题
    const recentIssues = maintenance.serviceHistory
      .filter(record => record.type === 'inspection')
      .slice(-3);
    
    return !recentIssues.some(issue => 
      issue.description.includes('安全隐患')
    );
  },
  
  // 检查里程是否需要保养
  needsMileageMaintenance: (context: VehicleContext) => {
    const { usage, maintenance } = context;
    const lastServiceMileage = maintenance.lastServiceDate 
      ? usage.totalMileage 
      : 0;
    
    return usage.totalMileage - lastServiceMileage >= 10000;
  },
};
```

#### 副作用动作 (Actions)

```typescript
// lib/state-machines/actions/vehicle.actions.ts
export const vehicleActions = {
  // 记录预约信息
  recordBooking: (context: VehicleContext, event: BookEvent) => {
    console.log(`Vehicle ${context.vehicleId} booked for booking ${event.bookingId}`);
    // 可在此处调用 API 更新数据库
  },
  
  // 开始使用时锁定资源
  lockVehicle: (context: VehicleContext, event: StartEvent) => {
    console.log(`Vehicle ${context.vehicleId} started at ${event.startTime}`);
    // 发送通知、记录日志等
  },
  
  // 完成使用时释放资源
  releaseVehicle: (context: VehicleContext, event: CompleteEvent) => {
    console.log(`Vehicle ${context.vehicleId} completed. Mileage: +${event.mileage} km`);
    // 更新使用统计
  },
  
  // 安排保养时发送通知
  notifyMaintenance: (context: VehicleContext, event: MaintenanceEvent) => {
    console.log(`Maintenance scheduled for ${context.vehicleId}: ${event.maintenanceType}`);
    // 发送邮件或系统通知
  },
};
```

#### XState 实现代码

```typescript
// lib/state-machines/vehicle.machine.ts
import { createMachine, assign } from 'xstate';
import { vehicleGuards } from './guards/vehicle.guards';
import { vehicleActions } from './actions/vehicle.actions';

export interface VehicleContext {
  vehicleId: string;
  status: VehicleStatus;
  insurance: InsuranceInfo;
  maintenance: MaintenanceInfo;
  usage: UsageStatistics;
}

export const vehicleMachine = createMachine({
  id: 'vehicle',
  initial: 'available',
  context: {
    vehicleId: '',
    status: 'available',
    insurance: {} as InsuranceInfo,
    maintenance: {} as MaintenanceInfo,
    usage: {} as UsageStatistics,
  },
  states: {
    available: {
      on: {
        BOOK: {
          target: 'booked',
          guard: 'hasValidInsurance',
          actions: 'recordBooking',
        },
        SCHEDULE_MAINTENANCE: {
          target: 'maintenance',
          actions: 'notifyMaintenance',
        },
      },
    },
    booked: {
      on: {
        START: {
          target: 'in-use',
          guard: 'passedSafetyCheck',
          actions: 'lockVehicle',
        },
        CANCEL: {
          target: 'available',
          actions: 'cancelBooking',
        },
      },
    },
    'in-use': {
      on: {
        COMPLETE: {
          target: 'available',
          actions: 'releaseVehicle',
        },
        REPORT_ISSUE: {
          target: 'maintenance',
          actions: ['recordIssue', 'notifyMaintenance'],
        },
      },
    },
    maintenance: {
      on: {
        FIX_COMPLETE: {
          target: 'available',
          actions: 'recordService',
        },
        RETIRE: {
          target: 'retired',
          actions: 'recordRetirement',
        },
      },
    },
    retired: {
      type: 'final',
    },
  },
}, {
  guards: vehicleGuards,
  actions: vehicleActions,
});
```

---

### 2.2 Booking State Machine (预约状态机)

#### 状态流转图

```mermaid
stateDiagram-v2
    [*] --> draft: 创建草稿
    draft --> pending: 提交预约 (SUBMIT)
    draft --> [*]: 取消草稿 (DISCARD)
    
    pending --> reviewing: 进入审批 (SEND_TO_REVIEW)
    pending --> confirmed: 自动确认 (AUTO_CONFIRM)
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
        审批规则 (Approval Rules):
        - estimatedFee > 5000 需管理员审批
        - 特殊车辆 (sport, ev) 需技术审批
        - 高峰时段 (9:00-17:00) 需额外审批
        - VIP 用户金额 < 10000 自动通过
    end note
    
    note right of confirmed
        自动操作 (Automatic Actions):
        - 锁定车辆资源 (Vehicle.BOOK)
        - 锁定场地时段 (Venue.RESERVE)
        - 发送任务通知 (Email/SMS)
        - 生成任务清单
    end note
    
    note right of in-progress
        进度监控:
        - 记录实际开始时间
        - 跟踪任务进度
        - 监控资源使用情况
    end note
```

#### 状态定义 (States Definition)

| 状态 | 含义 | 允许的操作 | 备注 |
|------|------|-----------|------|
| `draft` | 草稿 | 提交、取消 | 用户正在创建预约，尚未提交 |
| `pending` | 待处理 | 进入审批、自动确认、取消 | 预约已提交，等待系统处理 |
| `reviewing` | 审批中 | 通过、拒绝、取消 | 需要人工审批 |
| `approved` | 已批准 | 确认、取消 | 审批通过，等待系统确认资源 |
| `rejected` | 已拒绝 | 无 | 审批未通过，预约结束 |
| `confirmed` | 已确认 | 开始执行、取消 | 资源已锁定，等待执行 |
| `in-progress` | 进行中 | 完成、失败 | 任务正在执行 |
| `completed` | 已完成 | 无 | 任务成功完成 |
| `cancelled` | 已取消 | 无 | 预约被取消 |
| `failed` | 失败 | 无 | 任务执行失败 |

#### 事件定义 (Events Definition)

| 事件 | 含义 | 触发条件 | 参数 |
|------|------|---------|------|
| `SUBMIT` | 提交预约 | 用户完成预约信息填写 | - |
| `DISCARD` | 取消草稿 | 用户放弃创建预约 | - |
| `SEND_TO_REVIEW` | 发送审批 | 系统判断需要审批 | `approvalReason` |
| `AUTO_CONFIRM` | 自动确认 | 系统判断无需审批 | - |
| `APPROVE` | 审批通过 | 审批人通过 | `reviewerId`, `comments` |
| `REJECT` | 审批拒绝 | 审批人拒绝 | `reviewerId`, `reason` |
| `CONFIRM` | 系统确认 | 资源锁定成功 | - |
| `START` | 开始执行 | 到达预约时间 | `actualStartTime` |
| `COMPLETE` | 完成 | 任务执行完成 | `actualEndTime`, `feedback` |
| `FAIL` | 失败 | 任务执行失败 | `failureReason` |
| `CANCEL` | 取消 | 用户或系统取消 | `cancellationReason` |

#### 守卫条件 (Guards)

```typescript
// lib/state-machines/guards/booking.guards.ts
export const bookingGuards = {
  // 检查是否需要审批
  requiresApproval: (context: BookingContext) => {
    const { estimatedFee, vehicle, timeSlot } = context;
    
    // 费用超过 5000 需要审批
    if (estimatedFee > 5000) return true;
    
    // 特殊车辆需要审批
    if (['sport', 'ev'].includes(vehicle.type)) return true;
    
    // 高峰时段需要审批
    const startHour = new Date(timeSlot.startTime).getHours();
    if (startHour >= 9 && startHour < 17) return true;
    
    return false;
  },
  
  // VIP 用户自动通过条件
  vipAutoApprove: (context: BookingContext) => {
    const { user, estimatedFee } = context;
    return user.level === 'VIP' && estimatedFee < 10000;
  },
  
  // 检查资源是否可用
  resourcesAvailable: (context: BookingContext) => {
    const { vehicle, venue, timeSlot } = context;
    
    // 检查车辆状态
    if (vehicle.status !== 'available') return false;
    
    // 检查场地状态
    if (venue.status !== 'active') return false;
    
    // 检查时间冲突（需查询数据库）
    // 这里简化处理，实际应调用 Service 层
    return true;
  },
};
```

#### 副作用动作 (Actions)

```typescript
// lib/state-machines/actions/booking.actions.ts
export const bookingActions = {
  // 锁定车辆资源
  lockVehicle: async (context: BookingContext) => {
    // 调用 VehicleMachine 的 BOOK 事件
    console.log(`Locking vehicle ${context.vehicleId} for booking ${context.bookingId}`);
    // await VehicleService.updateStatus(context.vehicleId, 'booked');
  },
  
  // 锁定场地资源
  lockVenue: async (context: BookingContext) => {
    console.log(`Locking venue ${context.venueId} for time slot ${context.timeSlot.startTime}`);
    // await VenueService.reserveTimeSlot(context.venueId, context.timeSlot);
  },
  
  // 发送通知
  sendNotification: async (context: BookingContext, event: any) => {
    console.log(`Sending notification for booking ${context.bookingId}`);
    // 根据事件类型发送不同的通知
    // await NotificationService.send({
    //   userId: context.userId,
    //   type: 'booking_confirmed',
    //   data: { bookingId: context.bookingId }
    // });
  },
  
  // 记录审批结果
  recordApproval: (context: BookingContext, event: ApproveEvent) => {
    console.log(`Booking ${context.bookingId} approved by ${event.reviewerId}`);
  },
  
  // 释放资源
  releaseResources: async (context: BookingContext) => {
    console.log(`Releasing resources for booking ${context.bookingId}`);
    // await VehicleService.updateStatus(context.vehicleId, 'available');
    // await VenueService.releaseTimeSlot(context.venueId, context.timeSlot);
  },
};
```

#### XState 实现代码

```typescript
// lib/state-machines/booking.machine.ts
import { createMachine, assign } from 'xstate';
import { bookingGuards } from './guards/booking.guards';
import { bookingActions } from './actions/booking.actions';

export interface BookingContext {
  bookingId: string;
  userId: string;
  vehicleId: string;
  venueId: string;
  status: BookingStatus;
  timeSlot: TimeSlot;
  estimatedFee: number;
  actualFee?: number;
  user: any;
  vehicle: any;
  venue: any;
}

export const bookingMachine = createMachine({
  id: 'booking',
  initial: 'draft',
  context: {} as BookingContext,
  states: {
    draft: {
      on: {
        SUBMIT: [
          {
            target: 'reviewing',
            guard: 'requiresApproval',
            actions: 'sendToReview',
          },
          {
            target: 'confirmed',
            guard: 'vipAutoApprove',
            actions: ['autoApprove', 'lockResources'],
          },
          {
            target: 'pending',
          },
        ],
        DISCARD: {
          target: 'cancelled',
        },
      },
    },
    pending: {
      on: {
        SEND_TO_REVIEW: {
          target: 'reviewing',
          actions: 'sendNotification',
        },
        AUTO_CONFIRM: {
          target: 'confirmed',
          guard: 'resourcesAvailable',
          actions: ['lockVehicle', 'lockVenue', 'sendNotification'],
        },
        CANCEL: {
          target: 'cancelled',
          actions: 'recordCancellation',
        },
      },
    },
    reviewing: {
      on: {
        APPROVE: {
          target: 'approved',
          actions: ['recordApproval', 'sendNotification'],
        },
        REJECT: {
          target: 'rejected',
          actions: ['recordRejection', 'sendNotification'],
        },
        CANCEL: {
          target: 'cancelled',
          actions: 'recordCancellation',
        },
      },
    },
    approved: {
      on: {
        CONFIRM: {
          target: 'confirmed',
          guard: 'resourcesAvailable',
          actions: ['lockVehicle', 'lockVenue', 'sendNotification'],
        },
        CANCEL: {
          target: 'cancelled',
          actions: 'recordCancellation',
        },
      },
    },
    rejected: {
      type: 'final',
    },
    confirmed: {
      on: {
        START: {
          target: 'in-progress',
          actions: ['recordStart', 'sendNotification'],
        },
        CANCEL: {
          target: 'cancelled',
          actions: ['releaseResources', 'recordCancellation'],
        },
      },
    },
    'in-progress': {
      on: {
        COMPLETE: {
          target: 'completed',
          actions: ['recordCompletion', 'releaseResources', 'sendNotification'],
        },
        FAIL: {
          target: 'failed',
          actions: ['recordFailure', 'releaseResources', 'sendNotification'],
        },
      },
    },
    completed: {
      type: 'final',
    },
    cancelled: {
      type: 'final',
    },
    failed: {
      type: 'final',
    },
  },
}, {
  guards: bookingGuards,
  actions: bookingActions,
});
```

---
## 3. Zen Engine 业务规则逻辑示例 (Business Rules Examples)

### 3.1 费用计算规则 (Fee Calculation Rules)

#### 业务需求 (Business Requirements)

SmartTrack 的预约费用计算涉及多个维度的复杂逻辑：

1. **基础费率** - 根据车型和场地类型确定基础费用
2. **时长折扣** - 预约时长越长，折扣越大
3. **高峰时段** - 工作日 9:00-17:00 加收 50%
4. **会员等级** - VIP 客户享受 8折，Gold 客户 9折

#### 规则文件

**位置**: `lib/rules/fee-calculation.rules.json`

**完整配置**: 详见文件内容（已创建）

**规则逻辑流程**:

```
输入参数
  ↓
基础费率表 (车型 × 场地类型)
  ↓
时长折扣表 (≤2h: 无折扣 | 2-4h: 9折 | >4h: 8折)
  ↓
高峰时段系数 (工作日白天: 1.5 | 其他: 1.0)
  ↓
会员折扣表 (VIP: 0.8 | Gold: 0.9 | Regular: 1.0)
  ↓
最终计算 (finalFee = baseFee × peakMultiplier × durationDiscount × userDiscount)
  ↓
输出结果
```

#### Service 层集成代码

**位置**: `lib/db/services/fee-calculator.service.ts`

```typescript
import { ZenEngine } from '@gorules/zen-engine';
import feeCalculationRules from '@/lib/rules/fee-calculation.rules.json';

export interface FeeCalculationInput {
  vehicleType: 'sedan' | 'suv' | 'truck' | 'sport' | 'ev' | 'other';
  venueType: 'track' | 'test-pad' | 'simulation' | 'inspection' | 'other';
  duration: number; // 小时
  isPeakHour: boolean;
  userLevel: 'VIP' | 'Gold' | 'Regular';
}

export interface FeeCalculationResult {
  finalFee: number;
  breakdown: {
    baseFee: number;
    peakMultiplier: number;
    durationDiscount: number;
    userDiscount: number;
    intermediateAmount: number;
  };
}

export class FeeCalculatorService {
  private static engine = new ZenEngine();
  private static decision = this.engine.createDecision(feeCalculationRules);

  /**
   * 计算预约费用
   * @param input 费用计算输入参数
   * @returns 计算结果，包含最终费用和详细明细
   */
  static async calculateBookingFee(
    input: FeeCalculationInput
  ): Promise<FeeCalculationResult> {
    try {
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
    } catch (error) {
      console.error('费用计算失败:', error);
      throw new Error('费用计算规则执行失败，请联系管理员');
    }
  }

  /**
   * 批量计算费用（用于预估场景）
   */
  static async calculateBulkFees(
    inputs: FeeCalculationInput[]
  ): Promise<FeeCalculationResult[]> {
    return Promise.all(inputs.map(input => this.calculateBookingFee(input)));
  }

  /**
   * 验证输入参数
   */
  private static validateInput(input: FeeCalculationInput): void {
    if (input.duration <= 0) {
      throw new Error('预约时长必须大于 0');
    }
    
    const validVehicleTypes = ['sedan', 'suv', 'truck', 'sport', 'ev', 'other'];
    if (!validVehicleTypes.includes(input.vehicleType)) {
      throw new Error('无效的车型类型');
    }
    
    const validVenueTypes = ['track', 'test-pad', 'simulation', 'inspection', 'other'];
    if (!validVenueTypes.includes(input.venueType)) {
      throw new Error('无效的场地类型');
    }
  }
}
```

#### 使用示例

```typescript
// 在 Booking Service 中调用
import { FeeCalculatorService } from './fee-calculator.service';

async function createBooking(bookingData: CreateBookingDTO) {
  // 1. 获取车辆和场地信息
  const vehicle = await VehicleService.findById(bookingData.vehicleId);
  const venue = await VenueService.findById(bookingData.venueId);
  const user = await UserService.findById(bookingData.userId);
  
  // 2. 计算预约时长
  const startTime = new Date(bookingData.startTime);
  const endTime = new Date(bookingData.endTime);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  
  // 3. 判断是否高峰时段
  const isPeakHour = isPeakHourTime(startTime);
  
  // 4. 调用费用计算规则
  const feeResult = await FeeCalculatorService.calculateBookingFee({
    vehicleType: vehicle.type,
    venueType: venue.type,
    duration: durationHours,
    isPeakHour,
    userLevel: user.level || 'Regular'
  });
  
  // 5. 创建预约记录
  const booking = await Booking.create({
    ...bookingData,
    estimatedFee: feeResult.finalFee,
    feeBreakdown: feeResult.breakdown
  });
  
  return booking;
}

function isPeakHourTime(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  // 工作日（周一到周五）且时间在 9:00-17:00 之间
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
```

---

### 3.2 准入校验规则 (Access Control Rules)

#### 业务需求 (Business Requirements)

在用户创建预约时，系统需要进行全面的准入校验，确保预约符合以下条件：

1. **用户资质** - 驾驶证有效且未过期
2. **车辆状态** - 车辆必须为 `available`，保险有效
3. **场地限制** - 特殊场地（如高速环道）需要一定驾驶经验
4. **时间冲突** - 车辆和场地在预约时段内无冲突
5. **预约额度** - 普通用户每月最多 5 次，Gold 用户 10 次，VIP 无限制

#### 规则文件

**位置**: `lib/rules/access-validation.rules.json`

**完整配置**: 详见文件内容（已创建）

**规则逻辑**:

```
输入 8 个参数
  ↓
校验规则表 (collect 策略，收集所有错误)
  ├─ 驾照校验
  ├─ 车辆状态校验
  ├─ 保险校验
  ├─ 驾驶经验校验
  ├─ 时间冲突校验
  ├─ Regular 用户额度校验
  └─ Gold 用户额度校验
  ↓
聚合结果 (canProceed = 无错误, validationErrors = 所有错误列表)
  ↓
输出
```

#### Service 层集成代码

**位置**: `lib/db/services/access-validator.service.ts`

```typescript
import { ZenEngine } from '@gorules/zen-engine';
import accessValidationRules from '@/lib/rules/access-validation.rules.json';

export interface AccessValidationInput {
  driverLicenseValid: boolean;
  vehicleStatus: string;
  vehicleInsuranceValid: boolean;
  venueRequiresExperience: boolean;
  driverExperienceYears: number;
  hasConflict: boolean;
  userLevel: 'VIP' | 'Gold' | 'Regular';
  monthlyBookingCount: number;
}

export interface AccessValidationResult {
  canProceed: boolean;
  validationErrors: string[];
}

export class AccessValidatorService {
  private static engine = new ZenEngine();
  private static decision = this.engine.createDecision(accessValidationRules);

  /**
   * 校验预约准入条件
   * @param input 校验输入参数
   * @returns 校验结果
   */
  static async validateBookingAccess(
    input: AccessValidationInput
  ): Promise<AccessValidationResult> {
    try {
      const result = await this.decision.evaluate(input);
      
      return {
        canProceed: result.canProceed === true,
        validationErrors: Array.isArray(result.validationErrors) 
          ? result.validationErrors.filter((err: any) => err !== null && err !== undefined)
          : []
      };
    } catch (error) {
      console.error('准入校验失败:', error);
      throw new Error('准入校验规则执行失败，请联系管理员');
    }
  }

  /**
   * 检查驾驶证是否有效
   */
  static async checkDriverLicense(userId: string): Promise<boolean> {
    const user = await UserService.findById(userId);
    
    if (!user.profile.licenseNumber || !user.profile.licenseExpiry) {
      return false;
    }
    
    const expiryDate = new Date(user.profile.licenseExpiry);
    return expiryDate > new Date();
  }

  /**
   * 检查车辆保险是否有效
   */
  static async checkVehicleInsurance(vehicleId: string): Promise<boolean> {
    const vehicle = await VehicleService.findById(vehicleId);
    
    if (!vehicle.insurance || !vehicle.insurance.expiryDate) {
      return false;
    }
    
    const expiryDate = new Date(vehicle.insurance.expiryDate);
    return expiryDate > new Date();
  }

  /**
   * 检查时间段冲突
   */
  static async checkTimeConflict(
    vehicleId: string,
    venueId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    // 查询车辆在该时段的预约
    const vehicleConflicts = await BookingService.findConflictingBookings({
      vehicleId,
      startTime,
      endTime,
      excludeBookingId,
      statuses: ['confirmed', 'in-progress']
    });
    
    // 查询场地在该时段的预约
    const venueConflicts = await BookingService.findConflictingBookings({
      venueId,
      startTime,
      endTime,
      excludeBookingId,
      statuses: ['confirmed', 'in-progress']
    });
    
    return vehicleConflicts.length > 0 || venueConflicts.length > 0;
  }

  /**
   * 获取用户本月预约次数
   */
  static async getMonthlyBookingCount(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const count = await BookingService.countUserBookings({
      userId,
      startDate: startOfMonth,
      endDate: endOfMonth,
      statuses: ['confirmed', 'in-progress', 'completed']
    });
    
    return count;
  }
}
```

#### 使用示例

```typescript
// 在创建预约的 API Route 中调用
import { AccessValidatorService } from '@/lib/db/services/access-validator.service';

export async function POST(request: Request) {
  const body = await request.json();
  
  // 1. 获取必要的信息
  const user = await UserService.findById(body.userId);
  const vehicle = await VehicleService.findById(body.vehicleId);
  const venue = await VenueService.findById(body.venueId);
  
  // 2. 构建校验输入
  const validationInput = {
    driverLicenseValid: await AccessValidatorService.checkDriverLicense(user.id),
    vehicleStatus: vehicle.status,
    vehicleInsuranceValid: await AccessValidatorService.checkVehicleInsurance(vehicle.id),
    venueRequiresExperience: venue.features.includes('高速测试'),
    driverExperienceYears: calculateExperienceYears(user.profile.licenseIssueDate),
    hasConflict: await AccessValidatorService.checkTimeConflict(
      vehicle.id,
      venue.id,
      new Date(body.startTime),
      new Date(body.endTime)
    ),
    userLevel: user.level || 'Regular',
    monthlyBookingCount: await AccessValidatorService.getMonthlyBookingCount(user.id)
  };
  
  // 3. 执行准入校验
  const validationResult = await AccessValidatorService.validateBookingAccess(validationInput);
  
  // 4. 处理校验结果
  if (!validationResult.canProceed) {
    return Response.json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_FAILED',
        message: '预约创建失败：不满足准入条件',
        details: {
          validationErrors: validationResult.validationErrors
        }
      }
    }, { status: 400 });
  }
  
  // 5. 校验通过，继续创建预约
  const booking = await BookingService.create(body);
  
  return Response.json({
    success: true,
    data: booking,
    error: null
  }, { status: 201 });
}

function calculateExperienceYears(issueDate: Date | undefined): number {
  if (!issueDate) return 0;
  
  const now = new Date();
  const issue = new Date(issueDate);
  const years = (now.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
}
```

---

## 4. 总结与最佳实践 (Summary & Best Practices)

### 4.1 API 设计原则

1. **统一响应格式** - 所有 API 必须使用 `APIResponse<T>` 标准格式
2. **明确的错误码** - 使用语义化的错误码而非 HTTP 状态码
3. **分页支持** - 列表接口必须支持分页，默认 20 条/页
4. **筛选和排序** - 提供灵活的筛选和排序参数
5. **权限控制** - 在路由层进行权限校验，使用 Middleware

### 4.2 XState 最佳实践

1. **状态最小化** - 只定义必要的状态，避免状态爆炸
2. **守卫条件清晰** - 每个守卫函数只做一件事，名称清晰
3. **副作用独立** - 将副作用抽离为 Actions，便于测试
4. **类型安全** - 为 Context、Events 定义完整的 TypeScript 类型
5. **可视化优先** - 先绘制 Mermaid 图，再实现代码

### 4.3 Zen Engine 最佳实践

1. **规则外部化** - 业务规则放在 JSON 文件中，代码只负责调用
2. **版本控制** - 规则文件纳入 Git 版本管理
3. **文档齐全** - 每个规则文件必须包含业务说明和示例
4. **错误处理** - 规则执行失败时提供友好的错误提示
5. **性能优化** - 复杂规则可以缓存 Decision 实例

### 4.4 开发工作流

```
1. 需求分析 → 更新本文档
2. 设计 API → 更新 API 契约章节
3. 绘制状态机 → 更新状态机章节
4. 定义规则 → 创建 Zen Engine JSON 文件
5. 实现 Service 层 → 集成状态机和规则引擎
6. 实现 API Routes → 调用 Service 层
7. 编写测试 → 覆盖核心逻辑
8. 前端集成 → 调用 API
```

---

## 5. 附录 (Appendix)

### 5.1 相关文档

- [SmartTrack AI Development Guide](/docs/AI_DEVELOPMENT.md)
- [Phase 1 Planning](/docs/PHASE1_PLANNING_COMPLETE.md)
- [数据模型定义](/types/models.ts)
- [API 类型定义](/types/api.ts)

### 5.2 外部资源

- [XState 官方文档](https://stately.ai/docs/xstate)
- [Zen Engine 官方文档](https://gorules.io/docs)
- [Next.js 15 API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MongoDB Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)

---

**文档结束** | End of Document

> 如有疑问或建议，请提交 Issue 或联系项目维护者。
