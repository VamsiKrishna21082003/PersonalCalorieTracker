import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables - try multiple locations
const envPaths = [
  path.join(__dirname, '../.env'), // When running from dist/
  path.join(process.cwd(), '.env'), // When running from backend/
  '.env', // Fallback
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    if (process.env.GEMINI_API_KEY) {
      console.log(`✓ Loaded .env from: ${envPath}`);
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

// Log environment status (without exposing the keys)
if (process.env.GEMINI_API_KEY) {
  console.log('✓ Gemini API key is configured');
} else {
  console.warn('⚠ GEMINI_API_KEY is not set. Chat and AI features will not work.');
  console.warn('   Make sure .env file exists in the backend directory with GEMINI_API_KEY');
}

if (process.env.JWT_SECRET) {
  console.log('✓ JWT_SECRET is configured');
} else {
  console.warn('⚠ JWT_SECRET is not set. Using default secret (not recommended for production).');
  console.warn('   Make sure .env file exists in the backend directory with JWT_SECRET');
}

if (process.env.DATABASE_URL) {
  console.log('✓ DATABASE_URL is configured');
} else {
  console.error('✗ DATABASE_URL is not set. Database operations will fail.');
  console.error('   Make sure .env file exists in the backend directory with DATABASE_URL');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import mealRoutes from './routes/meals';
import uploadRoutes from './routes/upload';
import aiRoutes from './routes/ai';
import reportRoutes from './routes/reports';
import chatRoutes from './routes/chat';
import importRoutes from './routes/import';
import weightRoutes from './routes/weight';
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/import', importRoutes);
app.use('/api/weight', weightRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
