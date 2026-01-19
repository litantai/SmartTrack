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
