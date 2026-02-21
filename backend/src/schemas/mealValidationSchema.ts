import { z } from 'zod';

// Single meal schema
export const MealSchema = z.object({
  foodName: z.string().min(1, 'Food name is required'),
  calories: z.number().positive('Calories must be a positive number'),
  protein: z.number().nonnegative('Protein must be a non-negative number').optional(),
  carbs: z.number().nonnegative('Carbs must be a non-negative number').optional(),
  fat: z.number().nonnegative('Fat must be a non-negative number').optional(),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks']).optional(),
  quantity: z.number().positive('Quantity must be a positive number').optional(),
  date: z.string().datetime('Date must be a valid ISO datetime string').optional(),
});

// Array schema for multiple meals
export const MealsArraySchema = z.array(MealSchema).min(1, 'At least one meal is required');

// Type exports for TypeScript
export type MealInput = z.infer<typeof MealSchema>;
export type MealsArrayInput = z.infer<typeof MealsArraySchema>;
