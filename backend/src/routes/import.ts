import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { importPDF, confirmImport } from '../controllers/importController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.use(authenticate);

// Use asyncHandler to catch async errors and pass to error middleware
router.post('/pdf', upload.single('pdf'), asyncHandler(importPDF));
router.post('/pdf/confirm', asyncHandler(confirmImport));

export default router;
