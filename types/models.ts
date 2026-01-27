import { Types } from 'mongoose';

type ObjectId = Types.ObjectId;

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
