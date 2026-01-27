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
