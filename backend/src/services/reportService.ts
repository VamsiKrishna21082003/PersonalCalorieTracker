import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { ReportSummaryQueryInput } from '../schemas/reportValidationSchema';

export interface GroupedReportData {
  period: string; // ISO date string for the period
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Get nutrition summary grouped by day or week using raw SQL for efficient aggregation
 */
export const getNutritionSummary = async (
  userId: string,
  params: ReportSummaryQueryInput
): Promise<GroupedReportData[]> => {
  const { startDate, endDate, groupBy } = params;

  // Determine the date_trunc interval based on groupBy
  const interval = groupBy === 'week' ? 'week' : 'day';
  const periodExpr =
    interval === 'week'
      ? Prisma.sql`DATE_TRUNC('week', "date")`
      : Prisma.sql`DATE_TRUNC('day', "date")`;

  // Use Prisma.sql for safe parameterized queries.
  const result = await prisma.$queryRaw<Array<{
    period: Date;
    calories: Prisma.Decimal;
    protein: Prisma.Decimal;
    carbs: Prisma.Decimal;
    fat: Prisma.Decimal;
  }>>(
    Prisma.sql`
      SELECT
        ${periodExpr} as period,
        COALESCE(SUM(calories), 0)::float as calories,
        COALESCE(SUM(protein), 0)::float as protein,
        COALESCE(SUM(carbs), 0)::float as carbs,
        COALESCE(SUM(fat), 0)::float as fat
      FROM meal_entries
      WHERE 
        "userId" = ${userId}
        AND "date" >= ${new Date(startDate)}::timestamp
        AND "date" <= ${new Date(endDate)}::timestamp
      GROUP BY ${periodExpr}
      ORDER BY period ASC
    `
  );

  // Transform the result to match our interface
  return result.map((row) => ({
    period: row.period.toISOString(),
    calories: parseFloat(row.calories.toString()),
    protein: parseFloat(row.protein.toString()),
    carbs: parseFloat(row.carbs.toString()),
    fat: parseFloat(row.fat.toString()),
  }));
};

export interface MicronutrientData {
  period: string; // ISO date string for the period
  micronutrients: Record<string, number>; // Key-value pairs of micronutrient names and values
}

/**
 * Get micronutrients summary grouped by day or week
 * Aggregates micronutrients from JSON field and groups by date period
 */
export const getMicronutrientsSummary = async (
  userId: string,
  params: ReportSummaryQueryInput
): Promise<MicronutrientData[]> => {
  const { startDate, endDate, groupBy } = params;

  // Determine the date_trunc interval based on groupBy
  const interval = groupBy === 'week' ? 'week' : 'day';
  const periodExpr =
    interval === 'week'
      ? Prisma.sql`DATE_TRUNC('week', "date")`
      : Prisma.sql`DATE_TRUNC('day', "date")`;

  // Fetch meal entries with date and micronutrients grouped by period
  // We'll use raw SQL to group by date, then aggregate JSON in JavaScript
  const meals = await prisma.$queryRaw<Array<{
    period: Date;
    micronutrients: Prisma.JsonValue;
  }>>(
    Prisma.sql`
      SELECT
        ${periodExpr} as period,
        micronutrients
      FROM meal_entries
      WHERE 
        "userId" = ${userId}
        AND "date" >= ${new Date(startDate)}::timestamp
        AND "date" <= ${new Date(endDate)}::timestamp
        AND micronutrients IS NOT NULL
        AND micronutrients::text != 'null'
        AND micronutrients::text != '{}'
      ORDER BY period ASC
    `
  );

  // Group meals by period and aggregate micronutrients
  const groupedData = new Map<string, Record<string, number>>();

  meals.forEach((meal) => {
    const periodKey = meal.period.toISOString();

    // Initialize period if not exists
    if (!groupedData.has(periodKey)) {
      groupedData.set(periodKey, {});
    }

    const periodMicronutrients = groupedData.get(periodKey)!;

    // Aggregate micronutrients from JSON
    if (meal.micronutrients && typeof meal.micronutrients === 'object') {
      const micronutrients = meal.micronutrients as Record<string, any>;
      Object.entries(micronutrients).forEach(([key, value]) => {
        // Only sum numeric values
        if (typeof value === 'number' && !isNaN(value)) {
          periodMicronutrients[key] = (periodMicronutrients[key] || 0) + value;
        }
      });
    }
  });

  // Convert Map to array format
  return Array.from(groupedData.entries())
    .map(([period, micronutrients]) => ({
      period,
      micronutrients,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
};
