/**
 * Pagination utility functions
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
}

/**
 * Calculate skip and take for Prisma pagination
 */
export function calculatePagination(params: PaginationParams): PaginationResult {
  const { page, limit } = params;

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Parse pagination params from query
 */
export function parsePaginationParams(
  page?: string | number,
  limit?: string | number
): PaginationParams {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  return {
    page: parsedPage && parsedPage > 0 ? parsedPage : 1,
    limit: parsedLimit && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 20,
  };
}
