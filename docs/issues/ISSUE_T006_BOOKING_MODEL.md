# Issue #T006: Booking 模型定义 (Booking Model Definition)

## 📋 Issue 元信息 (Metadata)

- **Issue Number**: #T006 (Phase 1.1)
- **Title**: Booking 模型定义 (Booking Model Definition)
- **Labels**: `data-layer`, `priority:P1`, `complexity:high`, `parallel:yes`
- **Assignee**: 待分配
- **Estimated Time**: 1 day
- **Dependencies**: 
  - **Issue #0** - 详细设计规范文档与 TDD 基础环境搭建
  - **Issue #1** (未创建) - 类型定义与常量
- **Milestone**: Phase 1.1 - Data Models

---

## 🎯 任务目标 (Objective)

实现 **Booking (预约)** 数据模型，包括：
1. Mongoose Schema 定义（核心业务模型，最复杂）
2. 外键关联和引用完整性
3. 复杂的验证逻辑和业务规则
4. 模型方法和静态方法
5. 单元测试

---

## 📝 任务内容 (Task Details)

### Task 1: 创建 Mongoose Schema

**文件位置**: `lib/db/models/Booking.ts`

**实现要求**:

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IBooking,
  BookingStatus,
  TimeSlot,
  ApprovalInfo,
  BookingFeedback,
  BookingMetadata
} from '@/types/models';

// ==================== Sub-Schemas ====================

const TimeSlotSchema = new Schema<TimeSlot>(
  {
    startTime: {
      type: Date,
      required: [true, '开始时间不能为空'],
      validate: {
        validator: function (startTime: Date) {
          return startTime > new Date();
        },
        message: '开始时间必须晚于当前时间'
      }
    },
    endTime: {
      type: Date,
      required: [true, '结束时间不能为空'],
      validate: {
        validator: function (this: TimeSlot, endTime: Date) {
          return endTime > this.startTime;
        },
        message: '结束时间必须晚于开始时间'
      }
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [30, '预约时长至少30分钟']
    }
  },
  { _id: false }
);

const ApprovalInfoSchema = new Schema<ApprovalInfo>(
  {
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '审批决策无效'
      },
      default: 'pending'
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, '审批意见不能超过500字']
    }
  },
  { _id: false }
);

const BookingFeedbackSchema = new Schema<BookingFeedback>(
  {
    rating: {
      type: Number,
      required: [true, '评分不能为空'],
      min: [1, '评分最低为1'],
      max: [5, '评分最高为5']
    },
    comments: {
      type: String,
      required: [true, '反馈内容不能为空'],
      trim: true,
      maxlength: [1000, '反馈内容不能超过1000字']
    },
    issues: {
      type: [String],
      default: []
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  { _id: false }
);

const BookingMetadataSchema = new Schema<BookingMetadata>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      required: true,
      enum: {
        values: ['web', 'mobile', 'api'],
        message: '来源类型无效'
      },
      default: 'web'
    }
  },
  { _id: false }
);

// ==================== 主 Schema ====================

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: [true, '预约编号不能为空'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^BK\d{8,10}$/, '预约编号格式错误（如 BK20260126001）']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '用户ID不能为空'],
      index: true
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, '车辆ID不能为空'],
      index: true
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, '场地ID不能为空'],
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          'draft',
          'pending',
          'reviewing',
          'approved',
          'rejected',
          'confirmed',
          'in-progress',
          'completed',
          'cancelled',
          'failed'
        ],
        message: '预约状态无效'
      },
      default: 'draft',
      index: true
    },
    timeSlot: {
      type: TimeSlotSchema,
      required: true
    },
    purpose: {
      type: String,
      required: [true, '预约目的不能为空'],
      trim: true,
      maxlength: [500, '预约目的不能超过500字']
    },
    estimatedFee: {
      type: Number,
      required: [true, '预估费用不能为空'],
      min: [0, '费用不能为负数']
    },
    actualFee: {
      type: Number,
      min: [0, '费用不能为负数']
    },
    approval: {
      type: ApprovalInfoSchema,
      default: () => ({ decision: 'pending' })
    },
    feedback: BookingFeedbackSchema,
    metadata: {
      type: BookingMetadataSchema,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'bookings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== 索引定义 ====================

// 复合索引：用于查询用户的预约列表
BookingSchema.index({ userId: 1, status: 1 });

// 复合索引：用于查询车辆的预约列表
BookingSchema.index({ vehicleId: 1, 'timeSlot.startTime': 1 });

// 复合索引：用于查询场地的预约列表
BookingSchema.index({ venueId: 1, 'timeSlot.startTime': 1 });

// 复合索引：用于冲突检测
BookingSchema.index({
  vehicleId: 1,
  venueId: 1,
  'timeSlot.startTime': 1,
  'timeSlot.endTime': 1,
  status: 1
});

// 时间范围索引：用于按时间查询
BookingSchema.index({ 'timeSlot.startTime': 1, 'timeSlot.endTime': 1 });

// 文本搜索索引
BookingSchema.index({
  bookingId: 'text',
  purpose: 'text'
});

// ==================== 虚拟字段 ====================

// 虚拟字段：预约时长（小时）
BookingSchema.virtual('durationHours').get(function () {
  return this.timeSlot.durationMinutes / 60;
});

// 虚拟字段：是否已过期
BookingSchema.virtual('isExpired').get(function () {
  return this.timeSlot.endTime < new Date() && this.status !== 'completed';
});

// 虚拟字段：是否可取消
BookingSchema.virtual('isCancellable').get(function () {
  const cancellableStatuses: BookingStatus[] = [
    'draft',
    'pending',
    'reviewing',
    'approved',
    'confirmed'
  ];
  return cancellableStatuses.includes(this.status);
});

// 虚拟字段：是否需要审批
BookingSchema.virtual('requiresApproval').get(function () {
  // 根据业务规则判断（如：金额超过阈值、特殊车辆等）
  return this.estimatedFee > 5000;
});

// ==================== 实例方法 ====================

/**
 * 更新预约状态
 */
BookingSchema.methods.updateStatus = async function (
  newStatus: BookingStatus
): Promise<void> {
  this.status = newStatus;
  await this.save();
};

/**
 * 取消预约
 */
BookingSchema.methods.cancel = async function (
  cancelledBy: mongoose.Types.ObjectId,
  reason: string
): Promise<void> {
  if (!this.isCancellable) {
    throw new Error('当前状态不允许取消');
  }

  this.status = 'cancelled';
  this.metadata.cancelledBy = cancelledBy;
  this.metadata.cancellationReason = reason;
  await this.save();
};

/**
 * 审批预约
 */
BookingSchema.methods.approve = async function (
  reviewerId: mongoose.Types.ObjectId,
  comments?: string
): Promise<void> {
  if (this.status !== 'reviewing') {
    throw new Error('只能审批状态为 reviewing 的预约');
  }

  this.approval!.decision = 'approved';
  this.approval!.reviewerId = reviewerId;
  this.approval!.reviewedAt = new Date();
  this.approval!.comments = comments;
  this.status = 'approved';
  await this.save();
};

/**
 * 拒绝预约
 */
BookingSchema.methods.reject = async function (
  reviewerId: mongoose.Types.ObjectId,
  comments: string
): Promise<void> {
  if (this.status !== 'reviewing') {
    throw new Error('只能审批状态为 reviewing 的预约');
  }

  if (!comments || comments.trim().length === 0) {
    throw new Error('拒绝预约必须提供理由');
  }

  this.approval!.decision = 'rejected';
  this.approval!.reviewerId = reviewerId;
  this.approval!.reviewedAt = new Date();
  this.approval!.comments = comments;
  this.status = 'rejected';
  await this.save();
};

/**
 * 提交反馈
 */
BookingSchema.methods.submitFeedback = async function (feedback: {
  rating: number;
  comments: string;
  issues?: string[];
}): Promise<void> {
  if (this.status !== 'completed') {
    throw new Error('只能对已完成的预约提交反馈');
  }

  this.feedback = {
    ...feedback,
    submittedAt: new Date()
  };
  await this.save();
};

/**
 * 计算实际费用
 */
BookingSchema.methods.calculateActualFee = async function (): Promise<number> {
  // TODO: 集成 Zen Engine 费用计算规则
  // 这里暂时返回预估费用
  return this.estimatedFee;
};

// ==================== 静态方法 ====================

/**
 * 生成唯一的预约编号
 */
BookingSchema.statics.generateBookingId = async function (): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // 查找今天的最后一个预约编号
  const lastBooking = await this.findOne({
    bookingId: new RegExp(`^BK${dateStr}`)
  })
    .sort({ bookingId: -1 })
    .exec();

  let sequence = 1;
  if (lastBooking) {
    const lastSequence = parseInt(lastBooking.bookingId.slice(-3));
    sequence = lastSequence + 1;
  }

  return `BK${dateStr}${sequence.toString().padStart(3, '0')}`;
};

/**
 * 检查时间段冲突
 */
BookingSchema.statics.checkConflict = async function (
  vehicleId: mongoose.Types.ObjectId,
  venueId: mongoose.Types.ObjectId,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: IBooking[] }> {
  const query: any = {
    $or: [{ vehicleId }, { venueId }],
    status: {
      $in: ['pending', 'reviewing', 'approved', 'confirmed', 'in-progress']
    },
    $or: [
      // 新预约的开始时间在现有预约范围内
      {
        'timeSlot.startTime': { $lte: startTime },
        'timeSlot.endTime': { $gt: startTime }
      },
      // 新预约的结束时间在现有预约范围内
      {
        'timeSlot.startTime': { $lt: endTime },
        'timeSlot.endTime': { $gte: endTime }
      },
      // 现有预约完全在新预约范围内
      {
        'timeSlot.startTime': { $gte: startTime },
        'timeSlot.endTime': { $lte: endTime }
      }
    ]
  };

  if (excludeBookingId) {
    query.bookingId = { $ne: excludeBookingId };
  }

  const conflictingBookings = await this.find(query)
    .populate('vehicleId', 'vehicleId plateNumber')
    .populate('venueId', 'venueId name')
    .exec();

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings
  };
};

/**
 * 查询用户的预约列表
 */
BookingSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  status?: BookingStatus
): Promise<IBooking[]> {
  const query: any = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('vehicleId', 'vehicleId plateNumber brand model')
    .populate('venueId', 'venueId name type')
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * 查询车辆的预约列表
 */
BookingSchema.statics.findByVehicle = function (
  vehicleId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<IBooking[]> {
  const query: any = { vehicleId };
  
  if (startDate || endDate) {
    query['timeSlot.startTime'] = {};
    if (startDate) query['timeSlot.startTime'].$gte = startDate;
    if (endDate) query['timeSlot.startTime'].$lte = endDate;
  }
  
  return this.find(query)
    .populate('userId', 'username profile.fullName')
    .populate('venueId', 'venueId name')
    .sort({ 'timeSlot.startTime': 1 })
    .exec();
};

/**
 * 查询场地的预约列表
 */
BookingSchema.statics.findByVenue = function (
  venueId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<IBooking[]> {
  const query: any = { venueId };
  
  if (startDate || endDate) {
    query['timeSlot.startTime'] = {};
    if (startDate) query['timeSlot.startTime'].$gte = startDate;
    if (endDate) query['timeSlot.startTime'].$lte = endDate;
  }
  
  return this.find(query)
    .populate('userId', 'username profile.fullName')
    .populate('vehicleId', 'vehicleId plateNumber')
    .sort({ 'timeSlot.startTime': 1 })
    .exec();
};

/**
 * 统计用户当月预约次数
 */
BookingSchema.statics.countUserMonthlyBookings = async function (
  userId: mongoose.Types.ObjectId,
  year: number,
  month: number
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return this.countDocuments({
    userId,
    createdAt: { $gte: startDate, $lt: endDate },
    status: { $nin: ['cancelled', 'rejected'] }
  }).exec();
};

/**
 * 获取预约统计信息
 */
BookingSchema.statics.getStatistics = async function (
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  byStatus: Array<{ _id: BookingStatus; count: number }>;
  byVehicle: Array<{ _id: string; count: number }>;
  byVenue: Array<{ _id: string; count: number }>;
  totalRevenue: number;
}> {
  const [total, byStatus, byVehicle, byVenue, revenue] = await Promise.all([
    this.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }).exec(),
    
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).exec(),
    
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$vehicleId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).exec(),
    
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$venueId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).exec(),
    
    this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$actualFee' } } }
    ]).exec()
  ]);

  return {
    total,
    byStatus,
    byVehicle,
    byVenue,
    totalRevenue: revenue[0]?.total || 0
  };
};

// ==================== 中间件 Hooks ====================

// 保存前自动计算时长
BookingSchema.pre('save', function (next) {
  if (this.isModified('timeSlot')) {
    const duration =
      (this.timeSlot.endTime.getTime() - this.timeSlot.startTime.getTime()) /
      (1000 * 60);
    this.timeSlot.durationMinutes = Math.round(duration);
  }
  next();
});

// 保存前验证状态转换
BookingSchema.pre('save', async function (next) {
  if (this.isModified('status')) {
    const previousStatus = (this as any)._original?.status;
    
    // 定义允许的状态转换
    const allowedTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
      draft: ['pending', 'cancelled'],
      pending: ['reviewing', 'cancelled'],
      reviewing: ['approved', 'rejected', 'cancelled'],
      approved: ['confirmed', 'cancelled'],
      confirmed: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'failed']
    };

    if (previousStatus && allowedTransitions[previousStatus]) {
      const allowed = allowedTransitions[previousStatus]!;
      if (!allowed.includes(this.status)) {
        throw new Error(
          `不允许从 ${previousStatus} 状态转换到 ${this.status} 状态`
        );
      }
    }
  }
  
  next();
});

// 保存后触发通知（预留）
BookingSchema.post('save', function (doc) {
  // TODO: 集成通知系统
  // 例如：发送邮件、短信、推送通知
});

// ==================== 导出模型 ====================

export interface IBookingDocument extends IBooking, Document {
  durationHours: number;
  isExpired: boolean;
  isCancellable: boolean;
  requiresApproval: boolean;
  
  updateStatus(newStatus: BookingStatus): Promise<void>;
  cancel(cancelledBy: mongoose.Types.ObjectId, reason: string): Promise<void>;
  approve(reviewerId: mongoose.Types.ObjectId, comments?: string): Promise<void>;
  reject(reviewerId: mongoose.Types.ObjectId, comments: string): Promise<void>;
  submitFeedback(feedback: {
    rating: number;
    comments: string;
    issues?: string[];
  }): Promise<void>;
  calculateActualFee(): Promise<number>;
}

export interface IBookingModel extends Model<IBookingDocument> {
  generateBookingId(): Promise<string>;
  checkConflict(
    vehicleId: mongoose.Types.ObjectId,
    venueId: mongoose.Types.ObjectId,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{ hasConflict: boolean; conflictingBookings: IBooking[] }>;
  findByUser(
    userId: mongoose.Types.ObjectId,
    status?: BookingStatus
  ): Promise<IBookingDocument[]>;
  findByVehicle(
    vehicleId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<IBookingDocument[]>;
  findByVenue(
    venueId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<IBookingDocument[]>;
  countUserMonthlyBookings(
    userId: mongoose.Types.ObjectId,
    year: number,
    month: number
  ): Promise<number>;
  getStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    byStatus: Array<{ _id: BookingStatus; count: number }>;
    byVehicle: Array<{ _id: string; count: number }>;
    byVenue: Array<{ _id: string; count: number }>;
    totalRevenue: number;
  }>;
}

const Booking = mongoose.models.Booking || 
  mongoose.model<IBookingDocument, IBookingModel>('Booking', BookingSchema);

export default Booking;
```

---

### Task 2: 编写单元测试

**文件位置**: `__tests__/unit/models/booking.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { connectTestDB, clearTestDB, disconnectTestDB } from '../../utils/test-db';
import Booking from '@/lib/db/models/Booking';
import mongoose from 'mongoose';
import type { BookingStatus } from '@/types/models';

describe('Booking Model', () => {
  let testUserId: mongoose.Types.ObjectId;
  let testVehicleId: mongoose.Types.ObjectId;
  let testVenueId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectTestDB();
    
    // 创建测试用的 ObjectId
    testUserId = new mongoose.Types.ObjectId();
    testVehicleId = new mongoose.Types.ObjectId();
    testVenueId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('Schema Validation', () => {
    it('应该成功创建有效的预约', async () => {
      const bookingData = {
        bookingId: 'BK2026012600001',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        timeSlot: {
          startTime: new Date('2026-02-01T09:00:00'),
          endTime: new Date('2026-02-01T11:00:00'),
          durationMinutes: 120
        },
        purpose: '车辆性能测试',
        estimatedFee: 1000,
        metadata: {
          createdBy: testUserId,
          source: 'web'
        }
      };

      const booking = await Booking.create(bookingData);
      
      expect(booking.bookingId).toBe('BK20260126001');
      expect(booking.status).toBe('draft'); // 默认值
      expect(booking.timeSlot.durationMinutes).toBe(120);
    });

    it('应该拒绝缺少必填字段的预约', async () => {
      const bookingData = {
        bookingId: 'BK20260126002',
        userId: testUserId,
        // 缺少 vehicleId
        venueId: testVenueId
      };

      await expect(Booking.create(bookingData)).rejects.toThrow();
    });

    it('应该拒绝过去的开始时间', async () => {
      const bookingData = {
        bookingId: 'BK20260126003',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        timeSlot: {
          startTime: new Date('2020-01-01T09:00:00'), // 过去时间
          endTime: new Date('2020-01-01T11:00:00'),
          durationMinutes: 120
        },
        purpose: '测试',
        estimatedFee: 500,
        metadata: {
          createdBy: testUserId,
          source: 'web'
        }
      };

      await expect(Booking.create(bookingData)).rejects.toThrow(/开始时间必须晚于当前时间/);
    });

    it('应该拒绝结束时间早于开始时间', async () => {
      const bookingData = {
        bookingId: 'BK20260126004',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        timeSlot: {
          startTime: new Date('2026-02-01T11:00:00'),
          endTime: new Date('2026-02-01T09:00:00'), // 早于开始时间
          durationMinutes: 120
        },
        purpose: '测试',
        estimatedFee: 500,
        metadata: {
          createdBy: testUserId,
          source: 'web'
        }
      };

      await expect(Booking.create(bookingData)).rejects.toThrow(/结束时间必须晚于开始时间/);
    });
  });

  describe('Virtual Fields', () => {
    let booking: any;

    beforeEach(async () => {
      booking = await Booking.create({
        bookingId: 'BK20260126100',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        timeSlot: {
          startTime: new Date('2026-02-01T09:00:00'),
          endTime: new Date('2026-02-01T12:00:00'),
          durationMinutes: 180
        },
        purpose: '综合测试',
        estimatedFee: 1500,
        metadata: {
          createdBy: testUserId,
          source: 'web'
        }
      });
    });

    it('应该返回正确的预约时长（小时）', () => {
      expect(booking.durationHours).toBe(3);
    });

    it('应该正确判断是否可取消', () => {
      expect(booking.isCancellable).toBe(true);

      booking.status = 'completed';
      expect(booking.isCancellable).toBe(false);
    });

    it('应该根据金额判断是否需要审批', () => {
      expect(booking.requiresApproval).toBe(false);

      booking.estimatedFee = 6000;
      expect(booking.requiresApproval).toBe(true);
    });
  });

  describe('Instance Methods', () => {
    let booking: any;
    let reviewerId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      reviewerId = new mongoose.Types.ObjectId();
      
      booking = await Booking.create({
        bookingId: 'BK20260126200',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        status: 'reviewing' as BookingStatus,
        timeSlot: {
          startTime: new Date('2026-02-05T10:00:00'),
          endTime: new Date('2026-02-05T14:00:00'),
          durationMinutes: 240
        },
        purpose: '耐久测试',
        estimatedFee: 2000,
        metadata: {
          createdBy: testUserId,
          source: 'web'
        }
      });
    });

    it('应该能够更新预约状态', async () => {
      await booking.updateStatus('approved' as BookingStatus);
      expect(booking.status).toBe('approved');
    });

    it('应该能够取消预约', async () => {
      await booking.cancel(testUserId, '计划变更');
      
      expect(booking.status).toBe('cancelled');
      expect(booking.metadata.cancelledBy).toEqual(testUserId);
      expect(booking.metadata.cancellationReason).toBe('计划变更');
    });

    it('应该能够审批通过预约', async () => {
      await booking.approve(reviewerId, '资源充足，审批通过');
      
      expect(booking.status).toBe('approved');
      expect(booking.approval.decision).toBe('approved');
      expect(booking.approval.reviewerId).toEqual(reviewerId);
      expect(booking.approval.reviewedAt).toBeDefined();
    });

    it('应该能够拒绝预约', async () => {
      await booking.reject(reviewerId, '场地维护中，暂不可用');
      
      expect(booking.status).toBe('rejected');
      expect(booking.approval.decision).toBe('rejected');
      expect(booking.approval.comments).toBe('场地维护中，暂不可用');
    });

    it('应该拒绝不提供理由的拒绝操作', async () => {
      await expect(
        booking.reject(reviewerId, '')
      ).rejects.toThrow(/拒绝预约必须提供理由/);
    });

    it('应该能够提交反馈', async () => {
      // 先将状态改为 completed
      booking.status = 'completed';
      await booking.save();

      await booking.submitFeedback({
        rating: 5,
        comments: '测试顺利完成，场地条件优秀',
        issues: []
      });

      expect(booking.feedback).toBeDefined();
      expect(booking.feedback.rating).toBe(5);
      expect(booking.feedback.submittedAt).toBeDefined();
    });

    it('应该拒绝未完成预约的反馈提交', async () => {
      await expect(
        booking.submitFeedback({
          rating: 4,
          comments: '测试中'
        })
      ).rejects.toThrow(/只能对已完成的预约提交反馈/);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // 创建测试数据
      await Booking.create([
        {
          bookingId: 'BK20260126301',
          userId: testUserId,
          vehicleId: testVehicleId,
          venueId: testVenueId,
          status: 'confirmed' as BookingStatus,
          timeSlot: {
            startTime: new Date('2026-02-10T09:00:00'),
            endTime: new Date('2026-02-10T11:00:00'),
            durationMinutes: 120
          },
          purpose: '测试1',
          estimatedFee: 800,
          metadata: { createdBy: testUserId, source: 'web' }
        },
        {
          bookingId: 'BK20260126302',
          userId: testUserId,
          vehicleId: testVehicleId,
          venueId: new mongoose.Types.ObjectId(),
          status: 'confirmed' as BookingStatus,
          timeSlot: {
            startTime: new Date('2026-02-10T14:00:00'),
            endTime: new Date('2026-02-10T16:00:00'),
            durationMinutes: 120
          },
          purpose: '测试2',
          estimatedFee: 900,
          metadata: { createdBy: testUserId, source: 'web' }
        }
      ]);
    });

    it('应该能够生成唯一的预约编号', async () => {
      const bookingId = await Booking.generateBookingId();
      expect(bookingId).toMatch(/^BK\d{8}\d{3}$/);
    });

    it('应该能够检测时间段冲突', async () => {
      const result = await Booking.checkConflict(
        testVehicleId,
        testVenueId,
        new Date('2026-02-10T10:00:00'), // 与第一个预约重叠
        new Date('2026-02-10T12:00:00')
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingBookings).toHaveLength(1);
    });

    it('应该能够查询用户的预约列表', async () => {
      const bookings = await Booking.findByUser(testUserId);
      expect(bookings).toHaveLength(2);
    });

    it('应该能够查询车辆的预约列表', async () => {
      const bookings = await Booking.findByVehicle(testVehicleId);
      expect(bookings).toHaveLength(2);
    });

    it('应该能够统计用户当月预约次数', async () => {
      const count = await Booking.countUserMonthlyBookings(
        testUserId,
        2026,
        1 // 1月
      );
      expect(count).toBe(2);
    });
  });

  describe('Middleware Hooks', () => {
    it('应该自动计算预约时长', async () => {
      const booking = await Booking.create({
        bookingId: 'BK20260126400',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        timeSlot: {
          startTime: new Date('2026-02-15T09:00:00'),
          endTime: new Date('2026-02-15T12:30:00'),
          durationMinutes: 0 // 故意设为0，测试自动计算
        },
        purpose: '自动计算测试',
        estimatedFee: 1200,
        metadata: { createdBy: testUserId, source: 'web' }
      });

      expect(booking.timeSlot.durationMinutes).toBe(210); // 3.5小时 = 210分钟
    });

    it('应该验证状态转换', async () => {
      const booking = await Booking.create({
        bookingId: 'BK20260126401',
        userId: testUserId,
        vehicleId: testVehicleId,
        venueId: testVenueId,
        status: 'draft' as BookingStatus,
        timeSlot: {
          startTime: new Date('2026-02-20T10:00:00'),
          endTime: new Date('2026-02-20T12:00:00'),
          durationMinutes: 120
        },
        purpose: '状态转换测试',
        estimatedFee: 800,
        metadata: { createdBy: testUserId, source: 'web' }
      });

      // 允许的转换：draft -> pending
      booking.status = 'pending';
      await booking.save();
      expect(booking.status).toBe('pending');

      // 不允许的转换：pending -> completed
      booking.status = 'completed';
      await expect(booking.save()).rejects.toThrow(/不允许从 pending 状态转换到 completed 状态/);
    });
  });
});
```

---

## ✅ 验收标准 (Acceptance Criteria)

- [ ] Booking Schema 完全符合 `docs/AI_DEVELOPMENT.md` 和 `docs/DETAILED_DESIGN.md` 规范
- [ ] 所有字段验证规则完整且有效，包括复杂的时间验证
- [ ] 所有索引正确配置，特别是用于冲突检测的复合索引
- [ ] 外键关联（userId, vehicleId, venueId）正确配置
- [ ] 虚拟字段、实例方法、静态方法正确实现
- [ ] 审批流程方法（approve/reject）逻辑正确
- [ ] 冲突检测算法准确且高效
- [ ] 状态转换中间件正常工作，防止非法状态转换
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 所有测试通过（`npm run test`）
- [ ] TypeScript 严格模式下无错误
- [ ] 模型可正确导出并在其他模块使用

---

## 📚 参考资料 (References)

- [Mongoose Documentation - Population](https://mongoosejs.com/docs/populate.html)
- [Mongoose Documentation - Middleware](https://mongoosejs.com/docs/middleware.html)
- [MongoDB Aggregation Framework](https://www.mongodb.com/docs/manual/aggregation/)
- [SmartTrack AI Development Guide](../AI_DEVELOPMENT.md)

---

## 🔗 相关 Issue (Related Issues)

- **Depends on**: Issue #0 - 详细设计规范文档与 TDD 基础环境搭建
- **Parallel with**: 
  - Issue #T004 - Vehicle 模型定义
  - Issue #T005 - Venue 模型定义
- **Blocks**: Issue #9 - Booking Service 层实现（基础版）

---

**Last Updated**: 2026-01-26  
**Version**: 1.0  
**Priority**: P1 (高优先级)
