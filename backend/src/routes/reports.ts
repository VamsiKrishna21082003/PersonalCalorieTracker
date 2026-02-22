import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWeeklyTrend,
  getMacroBreakdown,
  getMicroSummary,
  getGoalComparison,
  getSummary,
  getMicronutrients,
} from '../controllers/reportController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/summary', asyncHandler(getSummary));
router.get('/micronutrients', asyncHandler(getMicronutrients));
router.get('/weekly', getWeeklyTrend);
router.get('/macros', getMacroBreakdown);
router.get('/micros', getMicroSummary);
router.get('/goal-comparison', getGoalComparison);

export default router;
