import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('OPENAI_API_KEY is not set. AI extraction functionality will not work.');
}

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
    if (!openai || !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Try multiple models for vision capabilities
    const models = ['gpt-4o', 'gpt-4-vision-preview', 'gpt-4'];
    let lastError: any = null;
    let response: OpenAI.Chat.Completions.ChatCompletion | null = null;

    for (const model of models) {
      try {
        response = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a nutrition expert. Analyze the provided image (which could be a nutrition label or a food plate) and extract nutritional information. 
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
              If information is not visible or unclear, use null for optional fields. Be as accurate as possible.`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract nutritional information from this image. Return only valid JSON, no additional text.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        });
        console.log(`Successfully used model: ${model} for image extraction`);
        break; // Success, exit loop
      } catch (modelError: any) {
        lastError = modelError;
        console.warn(`Model ${model} failed for image extraction:`, modelError?.message || modelError);
        // Continue to next model
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('All OpenAI models failed for image extraction');
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
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
    console.error('OpenAI extraction error:', error);
    console.error('Extraction error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      type: error?.type,
    });

    // Provide more specific error messages
    let errorMessage = 'Failed to extract nutrition information from image';
    if (error?.status === 429 || error?.code === 'rate_limit_exceeded' || error?.message?.includes('quota')) {
      errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and plan.';
    } else if (error?.status === 401 || error?.message?.includes('API key') || error?.code === 'invalid_api_key') {
      errorMessage = 'OpenAI API key is invalid or missing';
    } else if (error?.status === 429 || error?.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error?.message?.includes('model')) {
      errorMessage = 'OpenAI vision model is not available. Please check your API access.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};
