export interface PaginatedResponse<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
} 