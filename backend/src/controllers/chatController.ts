import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to get or initialize Gemini client
const getGeminiClient = (): GoogleGenerativeAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Function definitions for Gemini Function Calling
// Using 'as any' for type compatibility with Gemini SDK's strict types
const functionDefinitions: any[] = [
  {
    name: 'log_meal',
    description: 'Log a meal entry with food name, calories, and optional macros (protein, carbs, fat). Use this when user wants to add or record a meal.',
    parameters: {
      type: 'object' as const,
      properties: {
        foodName: { type: 'string' as const, description: 'Name of the food item' },
        calories: { type: 'number' as const, description: 'Calories in the meal' },
        protein: { type: 'number' as const, description: 'Protein in grams (optional)' },
        carbs: { type: 'number' as const, description: 'Carbs in grams (optional)' },
        fat: { type: 'number' as const, description: 'Fat in grams (optional)' },
        mealType: { type: 'string' as const, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], description: 'Type of meal' },
        quantity: { type: 'number' as const, description: 'Quantity/serving size (default: 100)' },
        date: { type: 'string' as const, description: 'Date in ISO format (optional, defaults to today)' },
      },
      required: ['foodName', 'calories', 'mealType'],
    },
  },
  {
    name: 'get_weekly_summary',
    description: 'Get a weekly summary of nutrition data including total calories, macros, and progress towards goals.',
    parameters: {
      type: 'object' as const,
      properties: {
        startDate: { type: 'string' as const, description: 'Start date in ISO format (optional, defaults to 7 days ago)' },
        endDate: { type: 'string' as const, description: 'End date in ISO format (optional, defaults to today)' },
      },
    },
  },
  {
    name: 'check_goal_progress',
    description: 'Check progress towards current active goals including calories, macros, and weight goals.',
    parameters: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'create_goal',
    description: 'Create a new nutrition goal. Deactivates existing active goals.',
    parameters: {
      type: 'object' as const,
      properties: {
        dailyCalories: { type: 'number' as const, description: 'Daily calorie target' },
        dailyProtein: { type: 'number' as const, description: 'Daily protein target in grams (optional)' },
        dailyCarbs: { type: 'number' as const, description: 'Daily carbs target in grams (optional)' },
        dailyFat: { type: 'number' as const, description: 'Daily fat target in grams (optional)' },
        weightGoal: { type: 'number' as const, description: 'Weight goal in kg (optional)' },
      },
      required: ['dailyCalories'],
    },
  },
  {
    name: 'get_meal_history',
    description: 'Get meal history for a specific date range or meal type.',
    parameters: {
      type: 'object' as const,
      properties: {
        startDate: { type: 'string' as const, description: 'Start date in ISO format' },
        endDate: { type: 'string' as const, description: 'End date in ISO format' },
        mealType: { type: 'string' as const, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], description: 'Filter by meal type (optional)' },
      },
    },
  },
];

// Function handlers that execute the actual operations
const functionHandlers: Record<string, (userId: string, args: any) => Promise<any>> = {
  async log_meal(userId: string, args: any) {
    const goal = await prisma.goal.findFirst({ where: { userId, isActive: true } });
    const meal = await prisma.mealEntry.create({
      data: {
        userId,
        goalId: goal?.id || null,
        foodName: args.foodName,
        calories: args.calories,
        protein: args.protein || null,
        carbs: args.carbs || null,
        fat: args.fat || null,
        mealType: args.mealType,
        quantity: args.quantity || 100,
        date: args.date ? new Date(args.date) : new Date(),
      },
    });
    return {
      success: true,
      message: `Successfully logged ${args.foodName} (${args.calories} kcal) for ${args.mealType}`,
      meal,
    };
  },

  async get_weekly_summary(userId: string, args: any) {
    const startDate = args.startDate ? new Date(args.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate ? new Date(args.endDate) : new Date();
    
    const meals = await prisma.mealEntry.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);

    const goal = await prisma.goal.findFirst({ where: { userId, isActive: true } });
    
    return {
      success: true,
      summary: {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        mealCount: meals.length,
        goal: goal ? {
          dailyCalories: goal.dailyCalories,
          dailyProtein: goal.dailyProtein,
          dailyCarbs: goal.dailyCarbs,
          dailyFat: goal.dailyFat,
        } : null,
      },
    };
  },

  async check_goal_progress(userId: string, args: any) {
    const goal = await prisma.goal.findFirst({ where: { userId, isActive: true } });
    if (!goal) {
      return { success: false, message: 'No active goal found. Please create a goal first.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeals = await prisma.mealEntry.findMany({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    });

    const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const totalFat = todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0);

    return {
      success: true,
      progress: {
        calories: { current: totalCalories, goal: goal.dailyCalories, remaining: goal.dailyCalories - totalCalories },
        protein: goal.dailyProtein ? { current: totalProtein, goal: goal.dailyProtein, remaining: goal.dailyProtein - totalProtein } : null,
        carbs: goal.dailyCarbs ? { current: totalCarbs, goal: goal.dailyCarbs, remaining: goal.dailyCarbs - totalCarbs } : null,
        fat: goal.dailyFat ? { current: totalFat, goal: goal.dailyFat, remaining: goal.dailyFat - totalFat } : null,
      },
    };
  },

  async create_goal(userId: string, args: any) {
    await prisma.goal.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const goal = await prisma.goal.create({
      data: {
        userId,
        dailyCalories: args.dailyCalories,
        dailyProtein: args.dailyProtein || null,
        dailyCarbs: args.dailyCarbs || null,
        dailyFat: args.dailyFat || null,
        weightGoal: args.weightGoal || null,
        isActive: true,
      },
    });

    return {
      success: true,
      message: `Goal created: ${args.dailyCalories} kcal/day${args.dailyProtein ? `, ${args.dailyProtein}g protein` : ''}${args.dailyCarbs ? `, ${args.dailyCarbs}g carbs` : ''}${args.dailyFat ? `, ${args.dailyFat}g fat` : ''}`,
      goal,
    };
  },

  async get_meal_history(userId: string, args: any) {
    const where: any = { userId };
    if (args.startDate || args.endDate) {
      where.date = {};
      if (args.startDate) where.date.gte = new Date(args.startDate);
      if (args.endDate) where.date.lte = new Date(args.endDate);
    }
    if (args.mealType) {
      where.mealType = args.mealType;
    }

    const meals = await prisma.mealEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 50,
    });

    return {
      success: true,
      meals: meals.map(m => ({
        foodName: m.foodName,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        mealType: m.mealType,
        date: m.date.toISOString(),
      })),
      count: meals.length,
    };
  },
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
      return res.status(500).json({ 
        message: 'Gemini API key is not configured. Please contact the administrator.',
        error: 'Missing API key'
      });
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      console.error('Failed to initialize Gemini client');
      return res.status(500).json({ 
        message: 'Failed to initialize Gemini client. Please check your API key.',
        error: 'Client initialization failed'
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
      },
    });

    // Get conversation history (last 10 messages)
    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get user's goals and recent meals for context
    const [goal, recentMeals] = await Promise.all([
      prisma.goal.findFirst({
        where: { userId, isActive: true },
      }),
      prisma.mealEntry.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    // Build context
    let context = 'You are a helpful nutrition assistant. Help users with their calorie tracking and nutrition goals.\n\n';
    
    if (goal) {
      context += `User's current goal:\n`;
      context += `- Daily calories: ${goal.dailyCalories} kcal\n`;
      if (goal.dailyProtein) context += `- Protein: ${goal.dailyProtein}g\n`;
      if (goal.dailyCarbs) context += `- Carbs: ${goal.dailyCarbs}g\n`;
      if (goal.dailyFat) context += `- Fat: ${goal.dailyFat}g\n`;
      if (goal.weightGoal) context += `- Weight goal: ${goal.weightGoal}kg\n`;
      context += '\n';
    }

    if (recentMeals.length > 0) {
      context += 'Recent meals:\n';
      recentMeals.forEach((meal) => {
        context += `- ${meal.foodName}: ${meal.calories} kcal`;
        if (meal.protein) context += `, ${meal.protein}g protein`;
        if (meal.carbs) context += `, ${meal.carbs}g carbs`;
        if (meal.fat) context += `, ${meal.fat}g fat`;
        context += '\n';
      });
      context += '\n';
    }

    // Build system instruction with context
    const systemInstruction = context + `
You are a helpful nutrition assistant with the ability to perform actions in the app.

When users want to:
- Log a meal: Use the log_meal function
- Check their progress: Use check_goal_progress function
- Get weekly summary: Use get_weekly_summary function
- Create/update goals: Use create_goal function
- View meal history: Use get_meal_history function

Always confirm actions before executing them if the user's intent is unclear. Be conversational and friendly.
Provide helpful, accurate nutrition advice. Be concise and friendly.`;

    // Build conversation history for Gemini chat
    // Gemini requires that the first content must have role 'user'
    const chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    
    // Add conversation history (reverse to get chronological order, exclude the last user message we just saved)
    const reversedHistory = history.reverse().slice(1);
    
    // Filter to ensure history starts with 'user' role (Gemini requirement)
    // Remove any leading 'model' messages
    let startIndex = 0;
    for (let i = 0; i < reversedHistory.length; i++) {
      if (reversedHistory[i].role === 'user') {
        startIndex = i;
        break;
      }
    }
    
    // Only include history if we found a 'user' message to start with
    if (startIndex < reversedHistory.length && reversedHistory[startIndex].role === 'user') {
      reversedHistory.slice(startIndex).forEach((msg) => {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      });
    }

    // Use Gemini models - current stable version
    const models = [
      'gemini-2.5-flash',  // Current stable: best balance of speed and cost
      // Alternative: 'gemini-flash-latest' (automatic alias to latest stable)
    ];
    let lastError: any = null;
    let aiResponse: string = 'Sorry, I could not generate a response.';

    for (const modelName of models) {
      try {
        console.log(`Attempting to use Gemini model: ${modelName}`);
        
        // Convert function definitions to Gemini tools format
        // Type assertion needed because SDK types are strict
        const tools = [{
          functionDeclarations: functionDefinitions.map(fn => ({
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters as any, // SDK expects specific SchemaType, but our format is compatible
          })),
        }] as any;

        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction,
          tools,
        });

        // Start a chat session with history
        // Ensure history is valid: must be empty or start with 'user' role
        const validHistory = chatHistory.length === 0 || chatHistory[0].role === 'user' 
          ? chatHistory 
          : [];
        
        const chat = model.startChat({
          history: validHistory,
        });

        // Send the current message and handle function calls
        let result = await chat.sendMessage(message);
        let response = await result.response;
        
        // Check for function calls in the response
        const functionCalls = response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0) {
          console.log(`Function calls detected: ${functionCalls.map((fc: any) => fc.name).join(', ')}`);
          
          // Execute function calls
          const functionResults: any[] = [];
          for (const functionCall of functionCalls) {
            const functionName = functionCall.name;
            const functionArgs = functionCall.args as any;
            
            console.log(`Executing function: ${functionName}`, functionArgs);
            
            if (functionHandlers[functionName]) {
              try {
                const handlerResult = await functionHandlers[functionName](userId, functionArgs);
                // Format function response for Gemini SDK
                functionResults.push({
                  functionResponse: {
                    name: functionName,
                    response: handlerResult,
                  },
                });
                console.log(`Function ${functionName} executed successfully`);
              } catch (funcError: any) {
                console.error(`Function ${functionName} error:`, funcError);
                functionResults.push({
                  functionResponse: {
                    name: functionName,
                    response: {
                      success: false,
                      error: funcError.message || 'Function execution failed',
                    },
                  },
                });
              }
            } else {
              console.error(`Unknown function: ${functionName}`);
              functionResults.push({
                functionResponse: {
                  name: functionName,
                  response: {
                    success: false,
                    error: `Unknown function: ${functionName}`,
                  },
                },
              });
            }
          }
          
          // Send function results back to the model for final response
          // Format: array of function response parts
          const functionResponseParts = functionResults.map(fr => ({
            functionResponse: fr.functionResponse,
          }));
          
          result = await chat.sendMessage(functionResponseParts);
          response = await result.response;
        }
        
        aiResponse = response.text() || 'Sorry, I could not generate a response.';
        console.log(`✓ Successfully used model: ${modelName}`);
        break; // Success, exit loop
      } catch (modelError: any) {
        lastError = modelError;
        console.error(`✗ Model ${modelName} failed:`, {
          message: modelError?.message,
          code: modelError?.code,
          status: modelError?.status,
          statusText: modelError?.statusText,
          cause: modelError?.cause,
        });
        // Continue to next model
        continue;
      }
    }

    if (aiResponse === 'Sorry, I could not generate a response.') {
      // Log detailed error information
      if (lastError) {
        console.error('All Gemini models failed. Last error details:', {
          message: lastError?.message,
          code: lastError?.code,
          status: lastError?.status,
          statusText: lastError?.statusText,
          response: lastError?.response,
        });
      }
      throw lastError || new Error('All Gemini models failed. Please check your API key and model access in Google Cloud Console.');
    }

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponse,
      },
    });

    res.json({ message: aiResponse });
  } catch (error: any) {
    console.error('Chat error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      type: error?.type,
    });

    // Provide more specific error messages
    let errorMessage = 'Failed to process chat message';
    let statusCode = 500;
    
    // Check for specific Gemini API errors
    const errorMsg = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';
    const errorStatus = error?.status;
    
    if (errorStatus === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'Gemini API quota exceeded. Please check your Google Cloud account billing and plan. You may need to add credits or upgrade your plan.';
    } else if (errorStatus === 401 || errorStatus === 403 || errorMsg.includes('api key') || errorMsg.includes('invalid') || errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
      statusCode = 500;
      errorMessage = 'Gemini API key is invalid or missing. Please verify your GEMINI_API_KEY in the .env file and ensure it has proper permissions.';
    } else if (errorMsg.includes('model') || errorMsg.includes('not found') || errorCode === 'NOT_FOUND') {
      statusCode = 500;
      errorMessage = `Gemini model not available. Your API key may not have access to the requested model. Please check: 1) Verify your API key at https://aistudio.google.com/app/apikey, 2) Ensure the Generative Language API is enabled in Google Cloud Console, 3) Check if your API key has access to gemini-2.5-flash model. Error: ${error?.message || 'Unknown error'}`;
    } else if (errorMsg.includes('permission denied') || errorMsg.includes('access denied')) {
      statusCode = 403;
      errorMessage = 'Access denied. Please check your API key permissions in Google Cloud Console.';
    } else if (error?.message) {
      errorMessage = `Gemini API error: ${error.message}`;
    }

    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error?.code,
      status: error?.status
    });
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit = '50' } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit as string),
    });

    res.json(messages);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    // Verify message belongs to user
    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this message' });
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

export const clearChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Delete all messages for the user
    await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    res.json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ message: 'Failed to clear chat' });
  }
};
