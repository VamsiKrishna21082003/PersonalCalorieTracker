import { extractTextFromPDF } from './pdfParserService';
import { extractMealsFromText } from './geminiMealExtractionService';
import { MealsArraySchema, MealInput } from '../schemas/mealValidationSchema';

export interface ImportedMeal extends MealInput {
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  date?: string;
}

/**
 * Orchestrates the PDF import process:
 * 1. Extract text from PDF
 * 2. Use Gemini AI to extract meals
 * 3. Parse and validate JSON
 * 4. Return validated meals
 */
export const importMealsFromPDF = async (pdfBuffer: Buffer): Promise<ImportedMeal[]> => {
  try {
    // Step 1: Extract text from PDF
    console.log('Step 1: Extracting text from PDF...');
    const { text } = await extractTextFromPDF(pdfBuffer);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from PDF');
    }

    // Step 2: Use Gemini AI to extract meals
    console.log('Step 2: Using Gemini AI to extract meals...');
    const jsonString = await extractMealsFromText(text);

    // Step 3: Parse JSON
    console.log('Step 3: Parsing JSON response...');
    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError: any) {
      console.error('JSON parsing error:', parseError);
      console.error('JSON string:', jsonString.substring(0, 500));
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}. The AI may have returned invalid JSON.`);
    }

    // Validate that it's an array
    if (!Array.isArray(parsedData)) {
      throw new Error(`AI response is not an array. Received: ${typeof parsedData}`);
    }

    // Step 4: Validate with zod schema
    console.log('Step 4: Validating meals with zod schema...');
    let validatedMeals: ImportedMeal[];
    try {
      validatedMeals = MealsArraySchema.parse(parsedData);
    } catch (validationError: any) {
      console.error('Zod validation error:', validationError);
      
      // Provide detailed validation errors
      if (validationError.errors) {
        const errorDetails = validationError.errors.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${errorDetails}`);
      }
      
      throw new Error(`Meal validation failed: ${validationError.message || 'Unknown validation error'}`);
    }

    if (validatedMeals.length === 0) {
      throw new Error('No valid meals found in PDF. Please ensure the PDF contains nutrition information.');
    }

    console.log(`Successfully imported ${validatedMeals.length} meals from PDF`);
    return validatedMeals;
  } catch (error: any) {
    console.error('PDF import service error:', error);
    
    // Re-throw with context
    if (error.message) {
      throw error;
    }
    
    throw new Error(`Failed to import meals from PDF: ${error?.message || 'Unknown error'}`);
  }
};
