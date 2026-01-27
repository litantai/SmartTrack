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
