import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ReportSummaryQuerySchema } from '../schemas/reportValidationSchema';
import { getNutritionSummary, getMicronutrientsSummary } from '../services/reportService';

export const getWeeklyTrend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Default to last 7 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 7);
    }

    const meals = await prisma.mealEntry.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by date
    const dailyTotals = meals.reduce((acc, meal) => {
      const dateKey = meal.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }
      acc[dateKey].calories += meal.calories;
      acc[dateKey].protein += meal.protein || 0;
      acc[dateKey].carbs += meal.carbs || 0;
      acc[dateKey].fat += meal.fat || 0;
      return acc;
    }, {} as Record<string, any>);

    const trend = Object.values(dailyTotals).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    res.json(trend);
  } catch (error) {
    console.error('Get weekly trend error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMacroBreakdown = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const meals = await prisma.mealEntry.findMany({
      where,
    });

    const totals = meals.reduce(
      (acc, meal) => {
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        acc.calories += meal.calories;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );

    res.json({
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      calories: totals.calories,
      percentages: {
        protein: totals.calories > 0 ? (totals.protein * 4 / totals.calories) * 100 : 0,
        carbs: totals.calories > 0 ? (totals.carbs * 4 / totals.calories) * 100 : 0,
        fat: totals.calories > 0 ? (totals.fat * 9 / totals.calories) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get macro breakdown error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMicroSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const meals = await prisma.mealEntry.findMany({
      where,
      select: {
        micronutrients: true,
      },
    });

    // Aggregate micronutrients
    const microTotals: Record<string, number> = {};
    meals.forEach((meal) => {
      if (meal.micronutrients && typeof meal.micronutrients === 'object') {
        Object.entries(meal.micronutrients as Record<string, any>).forEach(([key, value]) => {
          if (typeof value === 'number') {
            microTotals[key] = (microTotals[key] || 0) + value;
          }
        });
      }
    });

    res.json(microTotals);
  } catch (error) {
    console.error('Get micro summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getGoalComparison = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    // Get current active goal
    const goal = await prisma.goal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!goal) {
      return res.json({
        hasGoal: false,
        message: 'No active goal found',
      });
    }

    // Get actual consumption
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.date = {
        gte: today,
        lt: tomorrow,
      };
    }

    const meals = await prisma.mealEntry.findMany({
      where,
    });

    const actual = meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Aggregate micronutrients from meals
    const actualMicronutrients: Record<string, number> = {};
    meals.forEach((meal) => {
      if (meal.micronutrients && typeof meal.micronutrients === 'object') {
        const micronutrients = meal.micronutrients as Record<string, any>;
        Object.entries(micronutrients).forEach(([key, value]) => {
          if (typeof value === 'number' && !isNaN(value)) {
            actualMicronutrients[key] = (actualMicronutrients[key] || 0) + value;
          }
        });
      }
    });

    res.json({
      hasGoal: true,
      goal: {
        calories: goal.dailyCalories,
        protein: goal.dailyProtein || 0,
        carbs: goal.dailyCarbs || 0,
        fat: goal.dailyFat || 0,
        weightGoal: goal.weightGoal || null,
        micronutrients: goal.micronutrients && typeof goal.micronutrients === 'object' 
          ? (goal.micronutrients as Record<string, number>)
          : {},
      },
      actual: {
        ...actual,
        micronutrients: actualMicronutrients,
      },
      difference: {
        calories: actual.calories - goal.dailyCalories,
        protein: actual.protein - (goal.dailyProtein || 0),
        carbs: actual.carbs - (goal.dailyCarbs || 0),
        fat: actual.fat - (goal.dailyFat || 0),
      },
    });
  } catch (error) {
    console.error('Get goal comparison error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/reports/summary
 * Get nutrition summary grouped by day or week
 */
export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Validate query parameters
    const validationResult = ReportSummaryQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const params = validationResult.data;

    // Get nutrition summary from service
    const summary = await getNutritionSummary(userId, params);

    // Return structured JSON ready for charts
    res.json({
      groupBy: params.groupBy,
      startDate: params.startDate,
      endDate: params.endDate,
      data: summary,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/reports/micronutrients
 * Get micronutrients summary grouped by day or week
 */
export const getMicronutrients = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Validate query parameters
    const validationResult = ReportSummaryQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const params = validationResult.data;

    // Get micronutrients summary from service
    const summary = await getMicronutrientsSummary(userId, params);

    // Return structured JSON ready for charts
    res.json({
      groupBy: params.groupBy,
      startDate: params.startDate,
      endDate: params.endDate,
      data: summary,
    });
  } catch (error) {
    console.error('Get micronutrients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
