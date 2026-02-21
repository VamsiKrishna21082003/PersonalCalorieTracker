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
  calories: number;
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

    const prompt = `You are a nutrition expert. Analyze the provided image (which could be a nutrition label or a food plate) and extract nutritional information. 
Return a JSON object with the following structure:
{
  "foodName": "name of the food item",
  "calories": number (calories per serving or total),
  "protein": number (grams, optional),
  "carbs": number (grams, optional),
  "fat": number (grams, optional),
  "quantity": number (serving size in grams or units, optional),
  "micronutrients": object (optional, with vitamins/minerals if visible)
}
If information is not visible or unclear, use null for optional fields. Be as accurate as possible. Return only valid JSON, no additional text.`;

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

    // Try to parse JSON from the response
    let nutritionData: ExtractedNutrition;
    try {
      // Remove any markdown code blocks if present
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      nutritionData = JSON.parse(jsonContent);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse nutrition data from response');
      }
    }

    // Validate required fields
    if (!nutritionData.foodName || !nutritionData.calories) {
      throw new Error('Missing required nutrition data');
    }

    return nutritionData;
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
