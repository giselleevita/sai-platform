/**
 * Build search filter for Prisma queries
 */
export function buildSearchFilter(
  searchTerm: string | undefined,
  searchFields: string[]
): any {
  if (!searchTerm || searchTerm.trim() === '') {
    return undefined;
  }

  const term = searchTerm.trim();
  
  // If multiple fields, use OR condition
  if (searchFields.length > 1) {
    return {
      OR: searchFields.map((field) => ({
        [field]: {
          contains: term,
          mode: 'insensitive',
        },
      })),
    };
  }

  // Single field search
  return {
    [searchFields[0]]: {
      contains: term,
      mode: 'insensitive',
    },
  };
}

/**
 * Build sort order for Prisma queries
 */
export function buildSortOrder(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<string, 'asc' | 'desc'> {
  if (!sortBy) {
    return { createdAt: 'desc' };
  }

  return {
    [sortBy]: sortOrder,
  };
}
