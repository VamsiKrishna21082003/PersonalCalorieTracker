import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, weightGoal, startDate, endDate } = req.body;

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

    const goal = await prisma.goal.create({
      data: {
        userId,
        dailyCalories: parseInt(dailyCalories),
        dailyProtein: dailyProtein ? parseFloat(dailyProtein) : null,
        dailyCarbs: dailyCarbs ? parseFloat(dailyCarbs) : null,
        dailyFat: dailyFat ? parseFloat(dailyFat) : null,
        weightGoal: weightGoal ? parseFloat(weightGoal) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
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
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, weightGoal, startDate, endDate, isActive } = req.body;

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

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        dailyCalories: dailyCalories ? parseInt(dailyCalories) : undefined,
        dailyProtein: dailyProtein !== undefined ? (dailyProtein ? parseFloat(dailyProtein) : null) : undefined,
        dailyCarbs: dailyCarbs !== undefined ? (dailyCarbs ? parseFloat(dailyCarbs) : null) : undefined,
        dailyFat: dailyFat !== undefined ? (dailyFat ? parseFloat(dailyFat) : null) : undefined,
        weightGoal: weightGoal !== undefined ? (weightGoal ? parseFloat(weightGoal) : null) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
