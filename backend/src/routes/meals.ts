import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createMeal,
  getMeals,
  getMeal,
  updateMeal,
  deleteMeal,
} from '../controllers/mealController';

const router = Router();

router.use(authenticate);

router.post('/', createMeal);
router.get('/', getMeals);
router.get('/:id', getMeal);
router.put('/:id', updateMeal);
router.delete('/:id', deleteMeal);

export default router;
