import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to get or initialize Gemini client
const getGeminiClient = (): GoogleGenerativeAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Utility function to list available models (for debugging)
export const listAvailableModels = async (): Promise<string[]> => {
  try {
    const genAI = getGeminiClient();
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    // Use the SDK's internal method to list models if available
    // Note: The SDK may not expose this directly, so we'll log a helpful message
    console.log('To check available models, visit: https://aistudio.google.com/app/apikey');
    console.log('Or use the REST API: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY');
    
    // Return a default list for now
    return ['gemini-2.5-flash'];
  } catch (error: any) {
    console.error('Error listing models:', error);
    return [];
  }
};

interface ExtractedNutrition {
  foodName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  quantity?: number;
  micronutrients?: Record<string, any>;
}

export const extractNutritionFromImage = async (imageUrl: string): Promise<ExtractedNutrition> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      throw new Error('Failed to initialize Gemini client');
    }

    const prompt = `You are a nutrition expert. Analyze the provided image (which could be a nutrition label or a food plate) and extract ALL nutritional information visible.

IMPORTANT: You MUST always include a "micronutrients" object in your response, even if it's empty. If you see a nutrition facts label, extract ALL micronutrients that are listed (vitamins and minerals).

Return a JSON object with the following EXACT structure:
{
  "foodName": "name of the food item",
  "calories": number (calories per serving or total - estimate if not visible on label, optional),
  "protein": number (grams, optional),
  "carbs": number (grams, optional),
  "fat": number (grams, optional),
  "quantity": number (serving size in grams or units, optional),
  "micronutrients": {
    "vitaminA": number (micrograms/mcg, only if visible),
    "vitaminC": number (milligrams/mg, only if visible),
    "iron": number (milligrams/mg, only if visible),
    "calcium": number (milligrams/mg, only if visible),
    "vitaminD": number (International Units/IU, only if visible),
    "vitaminE": number (milligrams/mg, only if visible),
    "vitaminK": number (micrograms/mcg, only if visible),
    "magnesium": number (milligrams/mg, only if visible),
    "zinc": number (milligrams/mg, only if visible),
    "potassium": number (milligrams/mg, only if visible),
    "sodium": number (milligrams/mg, only if visible),
    "phosphorus": number (milligrams/mg, only if visible)
  }
}

CRITICAL RULES:
1. ALWAYS include the "micronutrients" field in your response, even if it's an empty object {}
2. If you see a nutrition facts label, extract ALL visible micronutrients (vitamins and minerals) using the exact field names above
3. Use the exact field names: vitaminA, vitaminC, iron, calcium, vitaminD, vitaminE, vitaminK, magnesium, zinc, potassium, sodium, phosphorus
4. Convert units to match: mcg for Vitamin A and K, mg for most others, IU for Vitamin D
5. Only include micronutrients that are actually visible in the image - do not guess or estimate
6. If no micronutrients are visible, return an empty object: "micronutrients": {}
7. For calories: If you see a nutrition label, extract the exact calories. If it's a food plate image without a label, provide a reasonable estimate based on the food items visible. If you cannot determine calories at all, you may omit it.

If information is not visible or unclear for other fields, use null for optional fields. Be as accurate as possible. Return ONLY valid JSON, no additional text or explanations.`;

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Use Gemini models for vision - current stable version
    const visionModels = [
      'gemini-2.5-flash',  // Current stable: supports vision, widely available
      // Alternative: 'gemini-flash-latest' (automatic alias to latest stable)
    ];
    
    let lastError: any = null;
    let result: any = null;
    
    for (const modelName of visionModels) {
      try {
        console.log(`Attempting to use Gemini vision model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
        ]);
        console.log(`✓ Successfully used vision model: ${modelName}`);
        break;
      } catch (modelError: any) {
        lastError = modelError;
        console.error(`✗ Vision model ${modelName} failed:`, {
          message: modelError?.message,
          code: modelError?.code,
          status: modelError?.status,
        });
        continue;
      }
    }
    
    if (!result) {
      throw lastError || new Error('All Gemini vision models failed');
    }

    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Log raw response for debugging
    console.log('Gemini raw response:', content);

    // Try to parse JSON from the response
    let nutritionData: ExtractedNutrition;
    try {
      // Remove any markdown code blocks if present
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      nutritionData = JSON.parse(jsonContent);
      console.log('Parsed nutrition data:', JSON.stringify(nutritionData, null, 2));
      console.log('Micronutrients in parsed data:', nutritionData.micronutrients);
    } catch (parseError: any) {
      console.error('First parse attempt failed:', parseError.message);
      console.error('Content that failed to parse:', content.substring(0, 500));
      
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          nutritionData = JSON.parse(jsonMatch[0]);
          console.log('Parsed nutrition data (from regex match):', JSON.stringify(nutritionData, null, 2));
          console.log('Micronutrients in parsed data:', nutritionData.micronutrients);
        } catch (secondParseError: any) {
          console.error('Second parse attempt also failed:', secondParseError.message);
          console.error('Extracted JSON string:', jsonMatch[0].substring(0, 500));
          throw new Error(`Failed to parse nutrition data from response. Parse error: ${secondParseError.message}`);
        }
      } else {
        console.error('No JSON object found in response');
        console.error('Full response content:', content);
        throw new Error('Failed to parse nutrition data from response. No valid JSON found.');
      }
    }
    
    // Ensure micronutrients is always an object (even if empty)
    if (!nutritionData.micronutrients || typeof nutritionData.micronutrients !== 'object') {
      console.log('Micronutrients missing or invalid, setting to empty object');
      nutritionData.micronutrients = {};
    }

    // Validate required fields with better error messages
    if (!nutritionData.foodName) {
      console.error('Missing foodName in parsed data:', nutritionData);
      throw new Error('Missing required field: foodName. The image might not contain clear food information.');
    }
    
    // Handle calories - make it optional, default to 0 if missing
    if (nutritionData.calories === undefined || nutritionData.calories === null) {
      console.warn('Calories not provided, setting to 0. User can edit manually.');
      nutritionData.calories = 0;
    } else if (typeof nutritionData.calories !== 'number') {
      console.warn('Calories is not a number, attempting to convert:', nutritionData.calories);
      const caloriesNum = parseFloat(String(nutritionData.calories));
      if (isNaN(caloriesNum)) {
        console.warn('Could not convert calories to number, setting to 0');
        nutritionData.calories = 0;
      } else {
        nutritionData.calories = caloriesNum;
      }
    }

    // Ensure calories is always a number in the return value
    const extractedNutrition: ExtractedNutrition = {
      ...nutritionData,
      calories: nutritionData.calories ?? 0,
    };

    return extractedNutrition;
  } catch (error: any) {
    console.error('Gemini extraction error:', error);
    console.error('Extraction error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });

    // Provide more specific error messages
    let errorMessage = 'Failed to extract nutrition information from image';
    const errorMsg = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    const errorStatus = error?.status;
    
    if (errorStatus === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
      errorMessage = 'Gemini API quota exceeded. Please check your Google Cloud account billing and plan.';
    } else if (errorStatus === 401 || errorStatus === 403 || errorMsg.includes('api key') || errorMsg.includes('invalid') || errorMsg.includes('unauthorized')) {
      errorMessage = 'Gemini API key is invalid or missing. Please verify your GEMINI_API_KEY in the .env file.';
    } else if (errorMsg.includes('model') || errorMsg.includes('not found') || errorCode === 'NOT_FOUND') {
      errorMessage = `Gemini model not available. Your API key may not have access to the requested model. Please check: 1) Verify your API key at https://aistudio.google.com/app/apikey, 2) Ensure the Generative Language API is enabled in Google Cloud Console, 3) Check if your API key has access to gemini-2.5-flash model. Error: ${error?.message || 'Unknown error'}`;
    } else if (error?.message) {
      errorMessage = `Gemini API error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};

export default getGeminiClient;
