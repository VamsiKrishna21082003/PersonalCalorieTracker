import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to get or initialize Gemini client
const getGeminiClient = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Extracts meal information from PDF text using Gemini AI
 * Returns strict JSON array only (no markdown, no explanations)
 * @param extractedText Text content extracted from PDF
 * @returns Raw JSON string containing array of meals
 */
export const extractMealsFromText = async (extractedText: string): Promise<string> => {
  try {
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('Extracted text is empty');
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Strict prompt that forces JSON-only response
    const prompt = `Extract all meal/nutrition information from the following PDF text and return ONLY a valid JSON array. 

CRITICAL RULES:
- Return ONLY valid JSON array, no markdown, no explanations, no code blocks, no backticks
- Return an array of meal objects, even if only one meal is found
- Each meal object must have: "foodName" (string), "calories" (number)
- Optional fields: "protein", "carbs", "fat" (numbers), "mealType" (Breakfast/Lunch/Dinner/Snacks), "quantity" (number), "date" (ISO string)
- If information is missing, omit the field entirely (don't use null or undefined)
- Extract ALL meals found in the document
- Numbers must be actual numbers, not strings
- If no meals are found, return an empty array: []

PDF Text:
${extractedText}

Return ONLY the JSON array, nothing else:`;

    console.log('Sending text to Gemini for meal extraction...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Gemini AI');
    }

    console.log('Received response from Gemini (length:', content.length, 'chars)');

    // Clean the response - remove any markdown code blocks if present
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Remove any leading/trailing whitespace or newlines
    cleanedContent = cleanedContent.trim();

    // Try to extract JSON array if wrapped in other text
    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    // Validate that it looks like JSON
    if (!cleanedContent.startsWith('[') || !cleanedContent.endsWith(']')) {
      throw new Error(`AI response is not a valid JSON array. Response: ${cleanedContent.substring(0, 200)}`);
    }

    return cleanedContent;
  } catch (error: any) {
    console.error('Gemini meal extraction error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });

    // Provide more specific error messages
    let errorMessage = 'Failed to extract meals from PDF using AI';
    const errorMsg = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    const errorStatus = error?.status;

    if (errorStatus === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
      errorMessage = 'Gemini API quota exceeded. Please check your Google Cloud account billing and plan.';
    } else if (errorStatus === 401 || errorStatus === 403 || errorMsg.includes('api key') || errorMsg.includes('invalid') || errorMsg.includes('unauthorized')) {
      errorMessage = 'Gemini API key is invalid or missing. Please verify your GEMINI_API_KEY in the .env file.';
    } else if (errorMsg.includes('model') || errorMsg.includes('not found') || errorCode === 'NOT_FOUND') {
      errorMessage = `Gemini model not available. Please check: 1) Verify your API key at https://aistudio.google.com/app/apikey, 2) Ensure the Generative Language API is enabled in Google Cloud Console. Error: ${error?.message || 'Unknown error'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};
