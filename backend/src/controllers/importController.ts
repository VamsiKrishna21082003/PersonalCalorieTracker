import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { importMealsFromPDF } from '../services/pdfImportService';

/**
 * Handle PDF upload and meal extraction
 */
export const importPDF = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }

    const userId = req.userId!;
    const { mealType, date } = req.body;

    console.log(`Processing PDF upload for user ${userId}, file size: ${req.file.size} bytes`);

    // Validate file
    if (req.file.size === 0) {
      return res.status(400).json({ message: 'PDF file is empty' });
    }

    // Import meals from PDF
    let extractedMeals;
    try {
      extractedMeals = await importMealsFromPDF(req.file.buffer);
    } catch (importError: any) {
      console.error('PDF import failed:', importError);
      return res.status(400).json({ 
        message: importError.message || 'Failed to import meals from PDF',
        error: process.env.NODE_ENV === 'development' ? importError.message : undefined
      });
    }

    if (extractedMeals.length === 0) {
      return res.status(400).json({ 
        message: 'No nutrition data found in PDF. Please ensure the PDF contains nutrition labels or calorie information.',
        suggestion: 'The PDF should contain text with nutrition facts, calories, or food information.'
      });
    }

    // Get active goal if exists
    const goal = await prisma.goal.findFirst({
      where: { userId, isActive: true },
    });

    // Prepare meals for preview (don't save yet)
    const mealsPreview = extractedMeals.map((meal) => ({
      ...meal,
      mealType: meal.mealType || mealType || 'Lunch',
      date: meal.date || date || new Date().toISOString(),
    }));

    res.json({
      meals: mealsPreview,
      count: mealsPreview.length,
    });
  } catch (error: any) {
    console.error('PDF import controller error:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to process PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Confirm and save imported meals
 */
export const confirmImport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { meals } = req.body;

    if (!Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ message: 'Meals array is required' });
    }

    // Get active goal if exists
    const goal = await prisma.goal.findFirst({
      where: { userId, isActive: true },
    });

    // Create meal entries
    const createdMeals = await Promise.all(
      meals.map((meal: any) =>
        prisma.mealEntry.create({
          data: {
            userId,
            goalId: goal?.id || null,
            foodName: meal.foodName,
            quantity: meal.quantity || 100,
            mealType: meal.mealType || 'Lunch',
            calories: meal.calories,
            protein: meal.protein || null,
            carbs: meal.carbs || null,
            fat: meal.fat || null,
            date: meal.date ? new Date(meal.date) : new Date(),
            micronutrients: meal.micronutrients || {},
          },
        })
      )
    );

    res.json({
      message: `Successfully imported ${createdMeals.length} meals`,
      meals: createdMeals,
    });
  } catch (error: any) {
    console.error('Confirm import error:', error);
    res.status(500).json({ message: error.message || 'Failed to import meals' });
  }
};
