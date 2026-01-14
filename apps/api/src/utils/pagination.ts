export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasNext: boolean;
    limit: number;
  };
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginatedResponse<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get skip value for offset-based pagination
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
