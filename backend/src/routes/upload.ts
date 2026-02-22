import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../services/cloudinaryService';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticate);

router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
      console.error('Cloudinary is not configured');
      return res.status(500).json({ 
        message: 'Image upload service is not configured. Please contact the administrator.',
        error: 'Missing Cloudinary configuration'
      });
    }

    const imageUrl = await uploadImage(req.file);
    res.json({ url: imageUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Upload error details:', {
      message: error?.message,
      http_code: error?.http_code,
      name: error?.name,
    });

    let errorMessage = 'Failed to upload image';
    if (error?.message?.includes('Cloudinary')) {
      errorMessage = 'Image upload service error. Please try again.';
    } else if (error?.http_code) {
      errorMessage = `Upload failed: ${error.message || 'Unknown error'}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
