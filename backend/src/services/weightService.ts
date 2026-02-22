import { prisma } from '../lib/prisma';
import { WeightEntryInput } from '../schemas/weightValidationSchema';

export interface WeightQueryParams {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedWeightEntries {
  entries: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a new weight entry for a user
 */
export const createWeightEntry = async (
  userId: string,
  data: WeightEntryInput
): Promise<any> => {
  const weightEntry = await prisma.weightEntry.create({
    data: {
      userId,
      weight: data.weight,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  return weightEntry;
};

/**
 * Get weight entries for a user with filtering and pagination
 */
export const getWeightEntries = async (
  params: WeightQueryParams
): Promise<PaginatedWeightEntries> => {
  const { userId, startDate, endDate, page = 1, limit = 10 } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = startDate;
    }
    if (endDate) {
      where.date.lte = endDate;
    }
  }

  // Fetch entries and total count in parallel
  const [entries, total] = await Promise.all([
    prisma.weightEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.weightEntry.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
