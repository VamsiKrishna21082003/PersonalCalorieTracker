import { z } from 'zod';

// Weight entry schema for creating/updating weight entries
export const WeightEntrySchema = z.object({
  weight: z.number().positive('Weight must be a positive number'),
  date: z.string().datetime('Date must be a valid ISO datetime string').optional(),
});

// Query parameters schema for filtering weight entries
export const WeightQuerySchema = z.object({
  startDate: z.string().datetime('Start date must be a valid ISO datetime string').optional(),
  endDate: z.string().datetime('End date must be a valid ISO datetime string').optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

// Type exports for TypeScript
export type WeightEntryInput = z.infer<typeof WeightEntrySchema>;
export type WeightQueryInput = z.infer<typeof WeightQuerySchema>;
