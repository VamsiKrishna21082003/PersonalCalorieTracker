import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { extractNutritionFromImage } from '../services/geminiService';
import { Response } from 'express';

const router = Router();

router.use(authenticate);

router.post('/extract-nutrition', async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ message: 'Invalid image URL format' });
    }

    const nutritionData = await extractNutritionFromImage(imageUrl);
    res.json(nutritionData);
  } catch (error: any) {
    console.error('AI extraction error:', error);
    console.error('AI extraction error details:', {
      message: error?.message,
      code: error?.code,
    });

    const errorMessage = error.message || 'Failed to extract nutrition information';
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
