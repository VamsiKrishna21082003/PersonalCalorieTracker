import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const createMeal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { foodName, quantity, mealType, calories, protein, carbs, fat, date, micronutrients, goalId } = req.body;

    if (!foodName || !quantity || !mealType || !calories) {
      return res.status(400).json({ message: 'Food name, quantity, meal type, and calories are required' });
    }

    const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({ message: 'Invalid meal type. Must be Breakfast, Lunch, Dinner, or Snacks' });
    }

    const meal = await prisma.mealEntry.create({
      data: {
        userId,
        goalId: goalId || null,
        foodName,
        quantity: parseFloat(quantity),
        mealType,
        calories: parseFloat(calories),
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        date: date ? new Date(date) : new Date(),
        micronutrients: micronutrients || {},
      },
    });

    res.status(201).json(meal);
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMeals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate, mealType, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    if (mealType) {
      where.mealType = mealType;
    }

    const [meals, total] = await Promise.all([
      prisma.mealEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
        include: {
          goal: {
            select: {
              id: true,
              dailyCalories: true,
            },
          },
        },
      }),
      prisma.mealEntry.count({ where }),
    ]);

    res.json({
      meals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMeal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const meal = await prisma.mealEntry.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        goal: {
          select: {
            id: true,
            dailyCalories: true,
          },
        },
      },
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json(meal);
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMeal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { foodName, quantity, mealType, calories, protein, carbs, fat, date, micronutrients, goalId } = req.body;

    const meal = await prisma.mealEntry.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    if (mealType) {
      const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
      if (!validMealTypes.includes(mealType)) {
        return res.status(400).json({ message: 'Invalid meal type' });
      }
    }

    const updatedMeal = await prisma.mealEntry.update({
      where: { id },
      data: {
        foodName: foodName || undefined,
        quantity: quantity ? parseFloat(quantity) : undefined,
        mealType: mealType || undefined,
        calories: calories ? parseFloat(calories) : undefined,
        protein: protein !== undefined ? (protein ? parseFloat(protein) : null) : undefined,
        carbs: carbs !== undefined ? (carbs ? parseFloat(carbs) : null) : undefined,
        fat: fat !== undefined ? (fat ? parseFloat(fat) : null) : undefined,
        date: date ? new Date(date) : undefined,
        micronutrients: micronutrients !== undefined ? micronutrients : undefined,
        goalId: goalId !== undefined ? (goalId || null) : undefined,
      },
    });

    res.json(updatedMeal);
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMeal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const meal = await prisma.mealEntry.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    await prisma.mealEntry.delete({
      where: { id },
    });

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
