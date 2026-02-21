import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWeeklyTrend,
  getMacroBreakdown,
  getMicroSummary,
  getGoalComparison,
} from '../controllers/reportController';

const router = Router();

router.use(authenticate);

router.get('/weekly', getWeeklyTrend);
router.get('/macros', getMacroBreakdown);
router.get('/micros', getMicroSummary);
router.get('/goal-comparison', getGoalComparison);

export default router;
