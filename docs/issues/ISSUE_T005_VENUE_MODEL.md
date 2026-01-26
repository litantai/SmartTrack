# Issue #T005: Venue 模型定义 (Venue Model Definition)

## 📋 Issue 元信息 (Metadata)

- **Issue Number**: #T005 (Phase 1.1)
- **Title**: Venue 模型定义 (Venue Model Definition)
- **Labels**: `data-layer`, `priority:P1`, `complexity:medium`, `parallel:yes`
- **Assignee**: 待分配
- **Estimated Time**: 1 day
- **Dependencies**: 
  - **Issue #0** - 详细设计规范文档与 TDD 基础环境搭建
  - **Issue #1** (未创建) - 类型定义与常量
- **Milestone**: Phase 1.1 - Data Models

---

## 🎯 任务目标 (Objective)

实现 **Venue (场地)** 数据模型，包括：
1. Mongoose Schema 定义
2. 数据库索引优化
3. 场地可用性和定价规则
4. 模型方法和静态方法
5. 单元测试

---

## 📝 任务内容 (Task Details)

### Task 1: 创建 Mongoose Schema

**文件位置**: `lib/db/models/Venue.ts`

**实现要求**:

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IVenue,
  VenueType,
  VenueStatus,
  VenueLocation,
  VenuePricing,
  AvailabilitySchedule,
  MaintenanceBlock
} from '@/types/models';

// ==================== Sub-Schemas ====================

const VenueLocationSchema = new Schema<VenueLocation>(
  {
    building: {
      type: String,
      trim: true
    },
    floor: {
      type: String,
      trim: true
    },
    area: {
      type: String,
      required: [true, '区域不能为空'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, '纬度范围：-90 到 90'],
        max: [90, '纬度范围：-90 到 90']
      },
      longitude: {
        type: Number,
        min: [-180, '经度范围：-180 到 180'],
        max: [180, '经度范围：-180 到 180']
      }
    }
  },
  { _id: false }
);

const VenuePricingSchema = new Schema<VenuePricing>(
  {
    baseRate: {
      type: Number,
      required: [true, '基础费率不能为空'],
      min: [0, '费率不能为负数']
    },
    currency: {
      type: String,
      required: true,
      default: 'CNY',
      enum: {
        values: ['CNY', 'USD', 'EUR'],
        message: '不支持的货币类型'
      }
    },
    peakHourMultiplier: {
      type: Number,
      required: true,
      default: 1.5,
      min: [1, '高峰时段倍数不能小于1']
    },
    minimumDuration: {
      type: Number,
      required: true,
      default: 60,
      min: [30, '最小预约时长不能少于30分钟']
    }
  },
  { _id: false }
);

const MaintenanceBlockSchema = new Schema<MaintenanceBlock>(
  {
    startDate: {
      type: Date,
      required: [true, '维护开始时间不能为空']
    },
    endDate: {
      type: Date,
      required: [true, '维护结束时间不能为空'],
      validate: {
        validator: function (this: MaintenanceBlock, endDate: Date) {
          return endDate > this.startDate;
        },
        message: '维护结束时间必须晚于开始时间'
      }
    },
    reason: {
      type: String,
      required: [true, '维护原因不能为空'],
      trim: true
    }
  },
  { _id: false }
);

const AvailabilityScheduleSchema = new Schema<AvailabilitySchedule>(
  {
    workingHours: {
      start: {
        type: String,
        required: true,
        default: '08:00',
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, '时间格式错误（如 08:00）']
      },
      end: {
        type: String,
        required: true,
        default: '18:00',
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, '时间格式错误（如 18:00）']
      }
    },
    workingDays: {
      type: [Number],
      required: true,
      default: [1, 2, 3, 4, 5], // 周一到周五
      validate: {
        validator: function (days: number[]) {
          return days.every((d) => d >= 0 && d <= 6);
        },
        message: '工作日必须在 0-6 之间（0=周日，6=周六）'
      }
    },
    maintenanceBlocks: {
      type: [MaintenanceBlockSchema],
      default: []
    }
  },
  { _id: false }
);

// ==================== 主 Schema ====================

const VenueSchema = new Schema<IVenue>(
  {
    venueId: {
      type: String,
      required: [true, '场地编号不能为空'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]\d{2,4}$/, '场地编号格式错误（如 A01）']
    },
    name: {
      type: String,
      required: [true, '场地名称不能为空'],
      trim: true,
      index: true
    },
    type: {
      type: String,
      required: [true, '场地类型不能为空'],
      enum: {
        values: ['track', 'test-pad', 'simulation', 'inspection', 'other'],
        message: '场地类型无效'
      },
      index: true
    },
    location: {
      type: VenueLocationSchema,
      required: true
    },
    capacity: {
      type: Number,
      required: [true, '容量不能为空'],
      min: [1, '容量至少为1'],
      default: 1
    },
    features: {
      type: [String],
      default: [],
      validate: {
        validator: function (features: string[]) {
          return features.length <= 20;
        },
        message: '特性标签最多20个'
      }
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['active', 'maintenance', 'closed'],
        message: '场地状态无效'
      },
      default: 'active',
      index: true
    },
    pricing: {
      type: VenuePricingSchema,
      required: true
    },
    availability: {
      type: AvailabilityScheduleSchema,
      required: true,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    collection: 'venues',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== 索引定义 ====================

// 复合索引：用于查询可用场地
VenueSchema.index({ status: 1, type: 1 });

// 复合索引：用于按名称和状态查询
VenueSchema.index({ name: 1, status: 1 });

// 地理位置索引（如果需要按距离查询）
VenueSchema.index({ 'location.coordinates': '2dsphere' });

// 文本搜索索引
VenueSchema.index({
  venueId: 'text',
  name: 'text',
  'location.area': 'text'
});

// ==================== 虚拟字段 ====================

// 虚拟字段：完整地址
VenueSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.location.building,
    this.location.floor,
    this.location.area
  ].filter(Boolean);
  return parts.join(' - ');
});

// 虚拟字段：当前是否在维护
VenueSchema.virtual('isUnderMaintenance').get(function () {
  const now = new Date();
  return this.availability.maintenanceBlocks.some(
    (block) => block.startDate <= now && block.endDate >= now
  );
});

// 虚拟字段：是否可用
VenueSchema.virtual('isAvailable').get(function () {
  return this.status === 'active' && !this.isUnderMaintenance;
});

// ==================== 实例方法 ====================

/**
 * 更新场地状态
 */
VenueSchema.methods.updateStatus = async function (
  newStatus: VenueStatus
): Promise<void> {
  this.status = newStatus;
  await this.save();
};

/**
 * 添加维护计划
 */
VenueSchema.methods.addMaintenanceBlock = async function (block: {
  startDate: Date;
  endDate: Date;
  reason: string;
}): Promise<void> {
  // 检查是否与现有维护计划冲突
  const hasConflict = this.availability.maintenanceBlocks.some(
    (existing) =>
      (block.startDate >= existing.startDate && block.startDate < existing.endDate) ||
      (block.endDate > existing.startDate && block.endDate <= existing.endDate) ||
      (block.startDate <= existing.startDate && block.endDate >= existing.endDate)
  );

  if (hasConflict) {
    throw new Error('维护计划与现有计划冲突');
  }

  this.availability.maintenanceBlocks.push(block);
  await this.save();
};

/**
 * 检查指定时间段是否可用
 */
VenueSchema.methods.isAvailableDuring = function (
  startTime: Date,
  endTime: Date
): boolean {
  // 检查场地状态
  if (this.status !== 'active') {
    return false;
  }

  // 检查是否在维护期
  const isDuringMaintenance = this.availability.maintenanceBlocks.some(
    (block) =>
      (startTime >= block.startDate && startTime < block.endDate) ||
      (endTime > block.startDate && endTime <= block.endDate) ||
      (startTime <= block.startDate && endTime >= block.endDate)
  );

  if (isDuringMaintenance) {
    return false;
  }

  // 检查工作日和工作时间
  const dayOfWeek = startTime.getDay();
  if (!this.availability.workingDays.includes(dayOfWeek)) {
    return false;
  }

  // TODO: 进一步检查工作时间范围（需要解析 workingHours）

  return true;
};

/**
 * 计算指定时段的费用
 */
VenueSchema.methods.calculateFee = function (
  startTime: Date,
  endTime: Date,
  isPeakHour: boolean = false
): number {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const hours = Math.ceil(durationMinutes / 60);
  
  let fee = this.pricing.baseRate * hours;
  
  if (isPeakHour) {
    fee *= this.pricing.peakHourMultiplier;
  }
  
  return Math.round(fee * 100) / 100;
};

// ==================== 静态方法 ====================

/**
 * 查找所有可用场地
 */
VenueSchema.statics.findAvailable = function (
  type?: VenueType
): Promise<IVenue[]> {
  const query: any = { status: 'active' };
  if (type) query.type = type;
  return this.find(query).exec();
};

/**
 * 查找指定时间段可用的场地
 */
VenueSchema.statics.findAvailableDuring = async function (
  startTime: Date,
  endTime: Date,
  type?: VenueType
): Promise<IVenue[]> {
  const query: any = { status: 'active' };
  if (type) query.type = type;
  
  const venues = await this.find(query).exec();
  
  // 过滤出在指定时间段可用的场地
  return venues.filter((venue: any) => venue.isAvailableDuring(startTime, endTime));
};

/**
 * 按类型统计场地数量
 */
VenueSchema.statics.countByType = function (): Promise<
  Array<{ _id: VenueType; count: number }>
> {
  return this.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).exec();
};

/**
 * 获取场地使用率统计
 */
VenueSchema.statics.getUtilizationStats = async function (
  venueId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalHours: number;
  bookedHours: number;
  utilizationRate: number;
}> {
  // TODO: 实现场地使用率统计（需要结合 Booking 模型）
  return {
    totalHours: 0,
    bookedHours: 0,
    utilizationRate: 0
  };
};

// ==================== 中间件 Hooks ====================

// 保存前验证
VenueSchema.pre('save', async function (next) {
  // 确保关闭的场地不能直接变为活跃状态
  if (this.isModified('status')) {
    const previousStatus = (this as any)._original?.status;
    if (previousStatus === 'closed' && this.status === 'active') {
      // 需要先经过维护状态
      throw new Error('关闭的场地必须先进入维护状态后才能重新开放');
    }
  }
  
  next();
});

// ==================== 导出模型 ====================

export interface IVenueDocument extends IVenue, Document {
  fullAddress: string;
  isUnderMaintenance: boolean;
  isAvailable: boolean;
  
  updateStatus(newStatus: VenueStatus): Promise<void>;
  addMaintenanceBlock(block: {
    startDate: Date;
    endDate: Date;
    reason: string;
  }): Promise<void>;
  isAvailableDuring(startTime: Date, endTime: Date): boolean;
  calculateFee(startTime: Date, endTime: Date, isPeakHour?: boolean): number;
}

export interface IVenueModel extends Model<IVenueDocument> {
  findAvailable(type?: VenueType): Promise<IVenueDocument[]>;
  findAvailableDuring(
    startTime: Date,
    endTime: Date,
    type?: VenueType
  ): Promise<IVenueDocument[]>;
  countByType(): Promise<Array<{ _id: VenueType; count: number }>>;
  getUtilizationStats(
    venueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalHours: number;
    bookedHours: number;
    utilizationRate: number;
  }>;
}

const Venue = mongoose.models.Venue || 
  mongoose.model<IVenueDocument, IVenueModel>('Venue', VenueSchema);

export default Venue;
```

---

### Task 2: 编写单元测试

**文件位置**: `__tests__/unit/models/venue.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../utils/test-db';
import Venue from '@/lib/db/models/Venue';
import type { VenueType, VenueStatus } from '@/types/models';

describe('Venue Model', () => {
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
    it('应该成功创建有效的场地', async () => {
      const venueData = {
        venueId: 'A01',
        name: '高速环道',
        type: 'track' as VenueType,
        location: {
          building: 'Building A',
          floor: '1F',
          area: '北区'
        },
        capacity: 5,
        features: ['高速测试', '耐久测试'],
        pricing: {
          baseRate: 500,
          currency: 'CNY',
          peakHourMultiplier: 1.5,
          minimumDuration: 60
        },
        availability: {
          workingHours: {
            start: '08:00',
            end: '18:00'
          },
          workingDays: [1, 2, 3, 4, 5],
          maintenanceBlocks: []
        }
      };

      const venue = await Venue.create(venueData);
      
      expect(venue.venueId).toBe('A01');
      expect(venue.name).toBe('高速环道');
      expect(venue.status).toBe('active'); // 默认值
      expect(venue.type).toBe('track');
    });

    it('应该拒绝缺少必填字段的场地', async () => {
      const venueData = {
        venueId: 'A02',
        // 缺少 name
        type: 'test-pad' as VenueType
      };

      await expect(Venue.create(venueData)).rejects.toThrow();
    });

    it('应该拒绝无效的场地编号格式', async () => {
      const venueData = {
        venueId: 'INVALID',
        name: '测试场地',
        type: 'test-pad' as VenueType,
        location: { area: '南区' },
        capacity: 3,
        pricing: {
          baseRate: 300,
          currency: 'CNY'
        }
      };

      await expect(Venue.create(venueData)).rejects.toThrow(/场地编号格式错误/);
    });

    it('应该拒绝维护结束时间早于开始时间', async () => {
      const venueData = {
        venueId: 'A03',
        name: '模拟测试场',
        type: 'simulation' as VenueType,
        location: { area: '东区' },
        capacity: 2,
        pricing: {
          baseRate: 400,
          currency: 'CNY'
        },
        availability: {
          workingHours: { start: '09:00', end: '17:00' },
          workingDays: [1, 2, 3, 4, 5],
          maintenanceBlocks: [
            {
              startDate: new Date('2026-02-01'),
              endDate: new Date('2026-01-31'), // 早于开始时间
              reason: '设备升级'
            }
          ]
        }
      };

      await expect(Venue.create(venueData)).rejects.toThrow(/维护结束时间必须晚于开始时间/);
    });
  });

  describe('Indexes', () => {
    it('应该强制 venueId 唯一性', async () => {
      const venueData1 = {
        venueId: 'B01',
        name: '场地1',
        type: 'track' as VenueType,
        location: { area: '西区' },
        capacity: 3,
        pricing: { baseRate: 350, currency: 'CNY' }
      };

      await Venue.create(venueData1);

      const venueData2 = {
        ...venueData1,
        name: '场地2' // 不同名称
      };

      await expect(Venue.create(venueData2)).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    let venue: any;

    beforeEach(async () => {
      venue = await Venue.create({
        venueId: 'C01',
        name: '综合测试区',
        type: 'test-pad' as VenueType,
        location: {
          building: 'Building C',
          floor: '2F',
          area: '中心区'
        },
        capacity: 4,
        pricing: {
          baseRate: 450,
          currency: 'CNY'
        }
      });
    });

    it('应该返回正确的 fullAddress', () => {
      expect(venue.fullAddress).toBe('Building C - 2F - 中心区');
    });

    it('应该正确判断是否在维护', async () => {
      expect(venue.isUnderMaintenance).toBe(false);

      // 添加一个当前时间的维护计划
      await venue.addMaintenanceBlock({
        startDate: new Date(Date.now() - 60 * 60 * 1000), // 1小时前
        endDate: new Date(Date.now() + 60 * 60 * 1000), // 1小时后
        reason: '紧急维修'
      });

      expect(venue.isUnderMaintenance).toBe(true);
    });

    it('应该正确判断场地可用性', () => {
      expect(venue.isAvailable).toBe(true);

      venue.status = 'maintenance';
      expect(venue.isAvailable).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    let venue: any;

    beforeEach(async () => {
      venue = await Venue.create({
        venueId: 'D01',
        name: '专业赛道',
        type: 'track' as VenueType,
        location: { area: '北区' },
        capacity: 10,
        pricing: {
          baseRate: 800,
          currency: 'CNY',
          peakHourMultiplier: 1.5
        },
        availability: {
          workingHours: { start: '08:00', end: '20:00' },
          workingDays: [1, 2, 3, 4, 5]
        }
      });
    });

    it('应该能够更新场地状态', async () => {
      await venue.updateStatus('maintenance' as VenueStatus);
      expect(venue.status).toBe('maintenance');
    });

    it('应该能够添加维护计划', async () => {
      await venue.addMaintenanceBlock({
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-07'),
        reason: '年度大保养'
      });

      expect(venue.availability.maintenanceBlocks).toHaveLength(1);
      expect(venue.availability.maintenanceBlocks[0].reason).toBe('年度大保养');
    });

    it('应该检测维护计划冲突', async () => {
      await venue.addMaintenanceBlock({
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-07'),
        reason: '设备升级'
      });

      // 尝试添加冲突的维护计划
      await expect(
        venue.addMaintenanceBlock({
          startDate: new Date('2026-04-05'),
          endDate: new Date('2026-04-10'),
          reason: '冲突的维护'
        })
      ).rejects.toThrow(/维护计划与现有计划冲突/);
    });

    it('应该能够检查时间段可用性', () => {
      // 工作日时间段应该可用
      const startTime = new Date('2026-02-02T10:00:00'); // 周一
      const endTime = new Date('2026-02-02T12:00:00');
      
      expect(venue.isAvailableDuring(startTime, endTime)).toBe(true);
    });

    it('应该能够计算费用', () => {
      const startTime = new Date('2026-02-02T10:00:00');
      const endTime = new Date('2026-02-02T12:00:00'); // 2小时
      
      // 非高峰时段
      const normalFee = venue.calculateFee(startTime, endTime, false);
      expect(normalFee).toBe(1600); // 800 * 2
      
      // 高峰时段
      const peakFee = venue.calculateFee(startTime, endTime, true);
      expect(peakFee).toBe(2400); // 800 * 2 * 1.5
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // 创建测试数据
      await Venue.create([
        {
          venueId: 'E01',
          name: '环道A',
          type: 'track' as VenueType,
          status: 'active' as VenueStatus,
          location: { area: '北区' },
          capacity: 5,
          pricing: { baseRate: 500, currency: 'CNY' }
        },
        {
          venueId: 'E02',
          name: '测试场B',
          type: 'test-pad' as VenueType,
          status: 'active' as VenueStatus,
          location: { area: '南区' },
          capacity: 3,
          pricing: { baseRate: 300, currency: 'CNY' }
        },
        {
          venueId: 'E03',
          name: '环道C',
          type: 'track' as VenueType,
          status: 'maintenance' as VenueStatus,
          location: { area: '东区' },
          capacity: 4,
          pricing: { baseRate: 450, currency: 'CNY' }
        }
      ]);
    });

    it('应该能够查找所有可用场地', async () => {
      const available = await Venue.findAvailable();
      expect(available).toHaveLength(2);
    });

    it('应该能够按类型查找可用场地', async () => {
      const tracks = await Venue.findAvailable('track');
      expect(tracks).toHaveLength(1);
      expect(tracks[0].type).toBe('track');
    });

    it('应该能够按类型统计场地数量', async () => {
      const stats = await Venue.countByType();
      expect(stats).toHaveLength(2); // track 和 test-pad
      expect(stats[0]._id).toBe('track');
      expect(stats[0].count).toBe(2);
    });
  });

  describe('Middleware Hooks', () => {
    it('应该阻止关闭的场地直接变为活跃状态', async () => {
      const venue = await Venue.create({
        venueId: 'F01',
        name: '已关闭场地',
        type: 'track' as VenueType,
        status: 'closed' as VenueStatus,
        location: { area: '废弃区' },
        capacity: 2,
        pricing: { baseRate: 200, currency: 'CNY' }
      });

      venue.status = 'active';
      await expect(venue.save()).rejects.toThrow(/关闭的场地必须先进入维护状态/);
    });
  });
});
```

---

## ✅ 验收标准 (Acceptance Criteria)

- [ ] Venue Schema 完全符合 `docs/AI_DEVELOPMENT.md` 和 `docs/DETAILED_DESIGN.md` 规范
- [ ] 所有字段验证规则完整且有效
- [ ] 所有索引正确配置，包括地理位置索引和文本索引
- [ ] 虚拟字段、实例方法、静态方法正确实现
- [ ] 维护计划冲突检测逻辑正确
- [ ] 可用性检查和费用计算方法正常工作
- [ ] 中间件 Hooks 正常工作
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 所有测试通过（`npm run test`）
- [ ] TypeScript 严格模式下无错误
- [ ] 模型可正确导出并在其他模块使用

---

## 📚 参考资料 (References)

- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [SmartTrack AI Development Guide](../AI_DEVELOPMENT.md)

---

## 🔗 相关 Issue (Related Issues)

- **Depends on**: Issue #0 - 详细设计规范文档与 TDD 基础环境搭建
- **Parallel with**: 
  - Issue #T004 - Vehicle 模型定义
  - Issue #T006 - Booking 模型定义
- **Blocks**: Issue #8 - Venue Service 层实现

---

**Last Updated**: 2026-01-26  
**Version**: 1.0  
**Priority**: P1 (高优先级)
