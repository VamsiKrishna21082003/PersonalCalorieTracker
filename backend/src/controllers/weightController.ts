import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { WeightEntrySchema, WeightQuerySchema } from '../schemas/weightValidationSchema';
import { createWeightEntry, getWeightEntries } from '../services/weightService';
import { prisma } from '../lib/prisma';

/**
 * POST /api/weight
 * Create a new weight entry
 */
export const addWeightEntry = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  // Validate input
  const validationResult = WeightEntrySchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors: validationResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const data = validationResult.data;

  // Create weight entry
  const weightEntry = await createWeightEntry(userId, data);

  res.status(201).json(weightEntry);
};

/**
 * GET /api/weight
 * Get weight entries with optional date range filtering and pagination
 */
export const getWeightEntriesController = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  // Validate query parameters
  const queryValidation = WeightQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    return res.status(400).json({
      message: 'Invalid query parameters',
      errors: queryValidation.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  const { startDate, endDate, page, limit } = queryValidation.data;

  // Parse pagination parameters
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10;

  // Parse date parameters
  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

  // Get weight entries
  const result = await getWeightEntries({
    userId,
    startDate: startDateObj,
    endDate: endDateObj,
    page: pageNum,
    limit: limitNum,
  });

  res.json(result);
};

/**
 * DELETE /api/weight/:id
 * Delete a weight entry
 */
export const deleteWeightEntry = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = req.params.id as string;

  // Check if weight entry exists and belongs to user
  const weightEntry = await prisma.weightEntry.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!weightEntry) {
    return res.status(404).json({ message: 'Weight entry not found' });
  }

  // Delete the weight entry
  await prisma.weightEntry.delete({
    where: { id },
  });

  res.json({ message: 'Weight entry deleted successfully' });
};
