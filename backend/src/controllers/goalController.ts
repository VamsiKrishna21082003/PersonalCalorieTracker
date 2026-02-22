import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const normalizeMicronutrients = (
  input: unknown
): Record<string, number> | null | undefined => {
  if (input === undefined) return undefined;
  if (input === null) return null;

  let raw: Record<string, unknown> | null = null;

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        raw = parsed as Record<string, unknown>;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  } else if (typeof input === 'object' && !Array.isArray(input)) {
    raw = input as Record<string, unknown>;
  } else {
    return null;
  }

  const normalized = Object.fromEntries(
    Object.entries(raw).flatMap(([key, value]) => {
      const num =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && value.trim() !== ''
          ? Number(value)
          : NaN;
      return Number.isFinite(num) ? [[key, num]] : [];
    })
  ) as Record<string, number>;

  return Object.keys(normalized).length > 0 ? normalized : null;
};

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, weightGoal, startDate, endDate, micronutrients } = req.body;

    if (!dailyCalories) {
      return res.status(400).json({ message: 'Daily calories are required' });
    }

    // Deactivate existing active goals
    await prisma.goal.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const normalizedMicronutrients = normalizeMicronutrients(micronutrients);

    const goalData: any = {
      userId,
      dailyCalories: parseInt(dailyCalories),
      dailyProtein: dailyProtein ? parseFloat(dailyProtein) : null,
      dailyCarbs: dailyCarbs ? parseFloat(dailyCarbs) : null,
      dailyFat: dailyFat ? parseFloat(dailyFat) : null,
      weightGoal: weightGoal ? parseFloat(weightGoal) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
    };

    // Only include micronutrients when valid numeric values are provided.
    if (normalizedMicronutrients && Object.keys(normalizedMicronutrients).length > 0) {
      goalData.micronutrients = normalizedMicronutrients;
    }

    const goal = await prisma.goal.create({
      data: goalData,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const goal = await prisma.goal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!goal) {
      return res.status(404).json({ message: 'No active goal found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Get current goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, weightGoal, startDate, endDate, isActive, micronutrients } = req.body;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // If activating this goal, deactivate others
    if (isActive === true) {
      await prisma.goal.updateMany({
        where: {
          userId,
          isActive: true,
          id: { not: id },
        },
        data: {
          isActive: false,
        },
      });
    }

    const normalizedMicronutrients = normalizeMicronutrients(micronutrients);

    const updateData: any = {
      dailyCalories: dailyCalories ? parseInt(dailyCalories) : undefined,
      dailyProtein: dailyProtein !== undefined ? (dailyProtein ? parseFloat(dailyProtein) : null) : undefined,
      dailyCarbs: dailyCarbs !== undefined ? (dailyCarbs ? parseFloat(dailyCarbs) : null) : undefined,
      dailyFat: dailyFat !== undefined ? (dailyFat ? parseFloat(dailyFat) : null) : undefined,
      weightGoal: weightGoal !== undefined ? (weightGoal ? parseFloat(weightGoal) : null) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    };

    // Only include micronutrients if explicitly provided (not undefined).
    // `null` means clear field, object means set values.
    if (normalizedMicronutrients !== undefined) {
      updateData.micronutrients = normalizedMicronutrients;
    }

    // Debug logging
    console.log('Updating goal:', {
      id,
      updateData,
      micronutrientsInRequest: micronutrients,
      normalizedMicronutrients,
    });

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    // Debug logging
    console.log('Updated goal response:', {
      id: updatedGoal.id,
      hasMicronutrients: !!updatedGoal.micronutrients,
      micronutrients: updatedGoal.micronutrients,
    });

    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
