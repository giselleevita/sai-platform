import { PrismaClient } from '@prisma/client';

// Single Prisma client instance for raw queries (workaround for generation issues)
export const prisma = new PrismaClient();
