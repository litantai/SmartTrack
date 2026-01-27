# Issue #T004: Vehicle 模型定义 (Vehicle Model Definition)

## 📋 Issue 元信息 (Metadata)

- **Issue Number**: #T004 (Phase 1.1)
- **Title**: Vehicle 模型定义 (Vehicle Model Definition)
- **Labels**: `data-layer`, `priority:P1`, `complexity:medium`, `parallel:yes`
- **Assignee**: 待分配
- **Estimated Time**: 1 day
- **Dependencies**: 
  - **Issue #0** - 详细设计规范文档与 TDD 基础环境搭建
  - **Issue #1** (未创建) - 类型定义与常量
- **Milestone**: Phase 1.1 - Data Models

---

## 🎯 任务目标 (Objective)

实现 **Vehicle (车辆)** 数据模型，包括：
1. Mongoose Schema 定义
2. 数据库索引优化
3. 字段验证规则
4. 模型方法和静态方法
5. 单元测试

---

## 📝 任务内容 (Task Details)

### Task 1: 创建 Mongoose Schema

**文件位置**: `lib/db/models/Vehicle.ts`

**实现要求**:

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IVehicle,
  VehicleType,
  VehicleStatus,
  VehicleSpecifications,
  InsuranceInfo,
  MaintenanceInfo,
  UsageStatistics
} from '@/types/models';

// ==================== Schema 定义 ====================

const VehicleSpecificationsSchema = new Schema<VehicleSpecifications>(
  {
    year: {
      type: Number,
      required: [true, '生产年份不能为空'],
      min: [1900, '生产年份不能早于1900年'],
      max: [new Date().getFullYear() + 1, '生产年份不能晚于明年']
    },
    color: {
      type: String,
      required: [true, '颜色不能为空'],
      trim: true
    },
    engine: {
      type: String,
      trim: true
    },
    transmission: {
      type: String,
      enum: {
        values: ['manual', 'automatic'],
        message: '变速箱类型只能是 manual 或 automatic'
      }
    }
  },
  { _id: false }
);

const InsuranceInfoSchema = new Schema<InsuranceInfo>(
  {
    provider: {
      type: String,
      required: [true, '保险公司不能为空'],
      trim: true
    },
    policyNumber: {
      type: String,
      required: [true, '保单号不能为空'],
      trim: true,
      unique: true
    },
    expiryDate: {
      type: Date,
      required: [true, '保险到期日不能为空'],
      validate: {
        validator: function (date: Date) {
          return date > new Date();
        },
        message: '保险已过期，请更新'
      }
    },
    coverageAmount: {
      type: Number,
      required: [true, '保额不能为空'],
      min: [0, '保额不能为负数']
    }
  },
  { _id: false }
);

const ServiceRecordSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      required: true,
      enum: ['routine', 'repair', 'inspection']
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const MaintenanceInfoSchema = new Schema<MaintenanceInfo>(
  {
    lastServiceDate: Date,
    nextServiceDate: Date,
    serviceHistory: {
      type: [ServiceRecordSchema],
      default: []
    }
  },
  { _id: false }
);

const UsageStatisticsSchema = new Schema<UsageStatistics>(
  {
    totalMileage: {
      type: Number,
      default: 0,
      min: 0
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

// ==================== 主 Schema ====================

const VehicleSchema = new Schema<IVehicle>(
  {
    vehicleId: {
      type: String,
      required: [true, '车辆编号不能为空'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^V\d{3,6}$/, '车辆编号格式错误（如 V001）']
    },
    plateNumber: {
      type: String,
      required: [true, '车牌号不能为空'],
      unique: true,
      trim: true,
      uppercase: true
    },
    brand: {
      type: String,
      required: [true, '品牌不能为空'],
      trim: true,
      index: true
    },
    model: {
      type: String,
      required: [true, '型号不能为空'],
      trim: true
    },
    type: {
      type: String,
      required: [true, '车型不能为空'],
      enum: {
        values: ['sedan', 'suv', 'truck', 'sport', 'ev', 'other'],
        message: '车型类型无效'
      },
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['available', 'booked', 'in-use', 'maintenance', 'retired'],
        message: '车辆状态无效'
      },
      default: 'available',
      index: true
    },
    specifications: {
      type: VehicleSpecificationsSchema,
      required: true
    },
    insurance: {
      type: InsuranceInfoSchema,
      required: true
    },
    maintenance: {
      type: MaintenanceInfoSchema,
      default: () => ({})
    },
    usage: {
      type: UsageStatisticsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    collection: 'vehicles',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== 索引定义 ====================

// 复合索引：用于查询可用车辆
VehicleSchema.index({ status: 1, type: 1 });

// 复合索引：用于按品牌和状态查询
VehicleSchema.index({ brand: 1, status: 1 });

// 文本搜索索引：用于全文搜索
VehicleSchema.index({
  vehicleId: 'text',
  plateNumber: 'text',
  brand: 'text',
  model: 'text'
});

// ==================== 虚拟字段 ====================

// 虚拟字段：车辆全名
VehicleSchema.virtual('fullName').get(function () {
  return `${this.brand} ${this.model} (${this.plateNumber})`;
});

// 虚拟字段：保险是否有效
VehicleSchema.virtual('isInsuranceValid').get(function () {
  return this.insurance.expiryDate > new Date();
});

// 虚拟字段：是否需要保养
VehicleSchema.virtual('needsMaintenance').get(function () {
  if (!this.maintenance.nextServiceDate) return false;
  return this.maintenance.nextServiceDate <= new Date();
});

// ==================== 实例方法 ====================

/**
 * 更新车辆状态
 */
VehicleSchema.methods.updateStatus = async function (
  newStatus: VehicleStatus
): Promise<void> {
  this.status = newStatus;
  await this.save();
};

/**
 * 添加维修记录
 */
VehicleSchema.methods.addServiceRecord = async function (record: {
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  cost: number;
}): Promise<void> {
  this.maintenance.serviceHistory.push({
    date: new Date(),
    ...record
  });
  this.maintenance.lastServiceDate = new Date();
  await this.save();
};

/**
 * 更新使用统计
 */
VehicleSchema.methods.updateUsage = async function (stats: {
  mileage?: number;
  hours?: number;
  bookings?: number;
}): Promise<void> {
  if (stats.mileage) this.usage.totalMileage += stats.mileage;
  if (stats.hours) this.usage.totalHours += stats.hours;
  if (stats.bookings) this.usage.totalBookings += stats.bookings;
  await this.save();
};

// ==================== 静态方法 ====================

/**
 * 查找所有可用车辆
 */
VehicleSchema.statics.findAvailable = function (
  type?: VehicleType
): Promise<IVehicle[]> {
  const query: any = { status: 'available' };
  if (type) query.type = type;
  return this.find(query).exec();
};

/**
 * 检查车辆是否可预约
 */
VehicleSchema.statics.isBookable = async function (
  vehicleId: string
): Promise<{ bookable: boolean; reason?: string }> {
  const vehicle = await this.findOne({ vehicleId }).exec();
  
  if (!vehicle) {
    return { bookable: false, reason: '车辆不存在' };
  }
  
  if (vehicle.status !== 'available') {
    return { bookable: false, reason: `车辆当前状态为 ${vehicle.status}` };
  }
  
  if (!vehicle.isInsuranceValid) {
    return { bookable: false, reason: '保险已过期' };
  }
  
  return { bookable: true };
};

/**
 * 按品牌统计车辆数量
 */
VehicleSchema.statics.countByBrand = function (): Promise<
  Array<{ _id: string; count: number }>
> {
  return this.aggregate([
    { $group: { _id: '$brand', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).exec();
};

// ==================== 中间件 Hooks ====================

// 保存前验证
VehicleSchema.pre('save', async function (next) {
  // 确保退役车辆不能回到其他状态
  if (this.isModified('status')) {
    const previousStatus = (this as any)._original?.status;
    if (previousStatus === 'retired' && this.status !== 'retired') {
      throw new Error('退役车辆不能恢复到其他状态');
    }
  }
  
  next();
});

// ==================== 导出模型 ====================

export interface IVehicleDocument extends IVehicle, Document {
  fullName: string;
  isInsuranceValid: boolean;
  needsMaintenance: boolean;
  
  updateStatus(newStatus: VehicleStatus): Promise<void>;
  addServiceRecord(record: {
    type: 'routine' | 'repair' | 'inspection';
    description: string;
    cost: number;
  }): Promise<void>;
  updateUsage(stats: {
    mileage?: number;
    hours?: number;
    bookings?: number;
  }): Promise<void>;
}

export interface IVehicleModel extends Model<IVehicleDocument> {
  findAvailable(type?: VehicleType): Promise<IVehicleDocument[]>;
  isBookable(vehicleId: string): Promise<{ bookable: boolean; reason?: string }>;
  countByBrand(): Promise<Array<{ _id: string; count: number }>>;
}

const Vehicle = mongoose.models.Vehicle || 
  mongoose.model<IVehicleDocument, IVehicleModel>('Vehicle', VehicleSchema);

export default Vehicle;
```

---

### Task 2: 编写单元测试

**文件位置**: `__tests__/unit/models/vehicle.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../utils/test-db';
import Vehicle from '@/lib/db/models/Vehicle';
import type { VehicleType, VehicleStatus } from '@/types/models';

describe('Vehicle Model', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('Schema Validation', () => {
    it('应该成功创建有效的车辆', async () => {
      const vehicleData = {
        vehicleId: 'V001',
        plateNumber: '京A12345',
        brand: 'Tesla',
        model: 'Model 3',
        type: 'ev' as VehicleType,
        specifications: {
          year: 2023,
          color: '白色',
          transmission: 'automatic'
        },
        insurance: {
          provider: '中国人保',
          policyNumber: 'INS20260001',
          expiryDate: new Date('2027-12-31'),
          coverageAmount: 500000
        }
      };

      const vehicle = await Vehicle.create(vehicleData);
      
      expect(vehicle.vehicleId).toBe('V001');
      expect(vehicle.plateNumber).toBe('京A12345');
      expect(vehicle.status).toBe('available'); // 默认值
      expect(vehicle.brand).toBe('Tesla');
    });

    it('应该拒绝缺少必填字段的车辆', async () => {
      const vehicleData = {
        vehicleId: 'V002',
        // 缺少 plateNumber
        brand: 'BMW',
        model: 'X5'
      };

      await expect(Vehicle.create(vehicleData)).rejects.toThrow();
    });

    it('应该拒绝无效的车辆编号格式', async () => {
      const vehicleData = {
        vehicleId: 'INVALID',
        plateNumber: '京B54321',
        brand: 'Audi',
        model: 'A6',
        type: 'sedan' as VehicleType,
        specifications: { year: 2023, color: '黑色' },
        insurance: {
          provider: '平安保险',
          policyNumber: 'INS20260002',
          expiryDate: new Date('2027-12-31'),
          coverageAmount: 300000
        }
      };

      await expect(Vehicle.create(vehicleData)).rejects.toThrow(/车辆编号格式错误/);
    });

    it('应该拒绝过期的保险', async () => {
      const vehicleData = {
        vehicleId: 'V003',
        plateNumber: '京C11111',
        brand: 'Mercedes',
        model: 'C200',
        type: 'sedan' as VehicleType,
        specifications: { year: 2022, color: '银色' },
        insurance: {
          provider: '太平洋保险',
          policyNumber: 'INS20260003',
          expiryDate: new Date('2020-01-01'), // 已过期
          coverageAmount: 400000
        }
      };

      await expect(Vehicle.create(vehicleData)).rejects.toThrow(/保险已过期/);
    });
  });

  describe('Indexes', () => {
    it('应该强制 vehicleId 唯一性', async () => {
      const vehicleData1 = {
        vehicleId: 'V100',
        plateNumber: '京D12345',
        brand: 'Tesla',
        model: 'Model Y',
        type: 'suv' as VehicleType,
        specifications: { year: 2024, color: '蓝色' },
        insurance: {
          provider: '中国人保',
          policyNumber: 'INS20260101',
          expiryDate: new Date('2027-12-31'),
          coverageAmount: 600000
        }
      };

      await Vehicle.create(vehicleData1);

      const vehicleData2 = {
        ...vehicleData1,
        plateNumber: '京D54321', // 不同车牌
        insurance: {
          ...vehicleData1.insurance,
          policyNumber: 'INS20260102' // 不同保单号
        }
      };

      await expect(Vehicle.create(vehicleData2)).rejects.toThrow();
    });

    it('应该强制 plateNumber 唯一性', async () => {
      const vehicleData1 = {
        vehicleId: 'V200',
        plateNumber: '京E88888',
        brand: 'BYD',
        model: '汉 EV',
        type: 'ev' as VehicleType,
        specifications: { year: 2024, color: '红色' },
        insurance: {
          provider: '中国人寿',
          policyNumber: 'INS20260201',
          expiryDate: new Date('2027-12-31'),
          coverageAmount: 350000
        }
      };

      await Vehicle.create(vehicleData1);

      const vehicleData2 = {
        ...vehicleData1,
        vehicleId: 'V201', // 不同车辆ID
        insurance: {
          ...vehicleData1.insurance,
          policyNumber: 'INS20260202' // 不同保单号
        }
      };

      await expect(Vehicle.create(vehicleData2)).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    let vehicle: any;

    beforeEach(async () => {
      vehicle = await Vehicle.create({
        vehicleId: 'V300',
        plateNumber: '京F99999',
        brand: 'Porsche',
        model: '911',
        type: 'sport' as VehicleType,
        specifications: { year: 2024, color: '黄色' },
        insurance: {
          provider: '中国太平',
          policyNumber: 'INS20260301',
          expiryDate: new Date('2027-06-30'),
          coverageAmount: 1000000
        }
      });
    });

    it('应该返回正确的 fullName', () => {
      expect(vehicle.fullName).toBe('Porsche 911 (京F99999)');
    });

    it('应该正确判断保险有效性', () => {
      expect(vehicle.isInsuranceValid).toBe(true);
    });
  });

  describe('Instance Methods', () => {
    let vehicle: any;

    beforeEach(async () => {
      vehicle = await Vehicle.create({
        vehicleId: 'V400',
        plateNumber: '京G12345',
        brand: 'Volvo',
        model: 'XC90',
        type: 'suv' as VehicleType,
        specifications: { year: 2023, color: '灰色' },
        insurance: {
          provider: '阳光保险',
          policyNumber: 'INS20260401',
          expiryDate: new Date('2027-12-31'),
          coverageAmount: 700000
        }
      });
    });

    it('应该能够更新车辆状态', async () => {
      await vehicle.updateStatus('maintenance' as VehicleStatus);
      expect(vehicle.status).toBe('maintenance');
    });

    it('应该能够添加维修记录', async () => {
      await vehicle.addServiceRecord({
        type: 'routine',
        description: '常规保养',
        cost: 1500
      });

      expect(vehicle.maintenance.serviceHistory).toHaveLength(1);
      expect(vehicle.maintenance.serviceHistory[0].description).toBe('常规保养');
      expect(vehicle.maintenance.lastServiceDate).toBeDefined();
    });

    it('应该能够更新使用统计', async () => {
      await vehicle.updateUsage({
        mileage: 100,
        hours: 5,
        bookings: 1
      });

      expect(vehicle.usage.totalMileage).toBe(100);
      expect(vehicle.usage.totalHours).toBe(5);
      expect(vehicle.usage.totalBookings).toBe(1);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // 创建测试数据
      await Vehicle.create([
        {
          vehicleId: 'V501',
          plateNumber: '京H11111',
          brand: 'Toyota',
          model: 'Camry',
          type: 'sedan' as VehicleType,
          status: 'available' as VehicleStatus,
          specifications: { year: 2023, color: '白色' },
          insurance: {
            provider: '中国人保',
            policyNumber: 'INS20260501',
            expiryDate: new Date('2027-12-31'),
            coverageAmount: 300000
          }
        },
        {
          vehicleId: 'V502',
          plateNumber: '京H22222',
          brand: 'Honda',
          model: 'CR-V',
          type: 'suv' as VehicleType,
          status: 'available' as VehicleStatus,
          specifications: { year: 2023, color: '黑色' },
          insurance: {
            provider: '平安保险',
            policyNumber: 'INS20260502',
            expiryDate: new Date('2027-12-31'),
            coverageAmount: 350000
          }
        },
        {
          vehicleId: 'V503',
          plateNumber: '京H33333',
          brand: 'Toyota',
          model: 'Highlander',
          type: 'suv' as VehicleType,
          status: 'maintenance' as VehicleStatus,
          specifications: { year: 2022, color: '银色' },
          insurance: {
            provider: '太平洋保险',
            policyNumber: 'INS20260503',
            expiryDate: new Date('2027-12-31'),
            coverageAmount: 400000
          }
        }
      ]);
    });

    it('应该能够查找所有可用车辆', async () => {
      const available = await Vehicle.findAvailable();
      expect(available).toHaveLength(2);
    });

    it('应该能够按车型查找可用车辆', async () => {
      const suvs = await Vehicle.findAvailable('suv');
      expect(suvs).toHaveLength(1);
      expect(suvs[0].type).toBe('suv');
    });

    it('应该能够检查车辆是否可预约', async () => {
      const result = await Vehicle.isBookable('V501');
      expect(result.bookable).toBe(true);
    });

    it('应该拒绝不可用车辆的预约', async () => {
      const result = await Vehicle.isBookable('V503');
      expect(result.bookable).toBe(false);
      expect(result.reason).toContain('maintenance');
    });

    it('应该能够按品牌统计车辆数量', async () => {
      const stats = await Vehicle.countByBrand();
      expect(stats).toHaveLength(2); // Toyota 和 Honda
      expect(stats[0]._id).toBe('Toyota');
      expect(stats[0].count).toBe(2);
    });
  });

  describe('Middleware Hooks', () => {
    it('应该阻止退役车辆恢复到其他状态', async () => {
      const vehicle = await Vehicle.create({
        vehicleId: 'V600',
        plateNumber: '京J12345',
        brand: 'Mazda',
        model: 'CX-5',
        type: 'suv' as VehicleType,
        status: 'retired' as VehicleStatus,
        specifications: { year: 2015, color: '红色' },
        insurance: {
          provider: '中国人保',
          policyNumber: 'INS20260601',
          expiryDate: new Date('2027-12-31'),
          coverageAmount: 200000
        }
      });

      vehicle.status = 'available';
      await expect(vehicle.save()).rejects.toThrow(/退役车辆不能恢复/);
    });
  });
});
```

---

## ✅ 验收标准 (Acceptance Criteria)

- [ ] Vehicle Schema 完全符合 `docs/AI_DEVELOPMENT.md` 和 `docs/DETAILED_DESIGN.md` 规范
- [ ] 所有字段验证规则完整且有效
- [ ] 所有索引正确配置，包括唯一索引和复合索引
- [ ] 虚拟字段、实例方法、静态方法正确实现
- [ ] 中间件 Hooks 正常工作
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 所有测试通过（`npm run test`）
- [ ] TypeScript 严格模式下无错误
- [ ] 模型可正确导出并在其他模块使用

---

## 📚 参考资料 (References)

- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB Indexing Best Practices](https://www.mongodb.com/docs/manual/indexes/)
- [SmartTrack AI Development Guide](../AI_DEVELOPMENT.md)

---

## 🔗 相关 Issue (Related Issues)

- **Depends on**: Issue #0 - 详细设计规范文档与 TDD 基础环境搭建
- **Parallel with**: 
  - Issue #T005 - Venue 模型定义
  - Issue #T006 - Booking 模型定义
- **Blocks**: Issue #7 - Vehicle Service 层实现

---

**Last Updated**: 2026-01-26  
**Version**: 1.0  
**Priority**: P1 (高优先级)
