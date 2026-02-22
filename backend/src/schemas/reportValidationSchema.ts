import { z } from 'zod';

// Report summary query parameters schema
export const ReportSummaryQuerySchema = z.object({
  startDate: z.string().datetime('Start date must be a valid ISO datetime string'),
  endDate: z.string().datetime('End date must be a valid ISO datetime string'),
  groupBy: z.enum(['day', 'week']),
});

// Type exports for TypeScript
export type ReportSummaryQueryInput = z.infer<typeof ReportSummaryQuerySchema>;
