import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createGoal, getGoals, getCurrentGoal, updateGoal } from '../controllers/goalController';

const router = Router();

router.use(authenticate);

router.post('/', createGoal);
router.get('/', getGoals);
router.get('/current', getCurrentGoal);
router.put('/:id', updateGoal);

export default router;
