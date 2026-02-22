import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { addWeightEntry, getWeightEntriesController, deleteWeightEntry } from '../controllers/weightController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply JWT authentication middleware to all routes
router.use(authenticate);

// POST /api/weight - Add new weight entry
router.post('/', asyncHandler(addWeightEntry));

// GET /api/weight - Get weight entries with filtering and pagination
router.get('/', asyncHandler(getWeightEntriesController));

// DELETE /api/weight/:id - Delete a weight entry
router.delete('/:id', asyncHandler(deleteWeightEntry));

export default router;
