export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  unreadCount?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
