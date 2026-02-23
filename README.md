
# Personal Calorie Tracker

A full-stack calorie tracking application with goal setting, meal entry, nutrition reports, AI-powered calorie extraction, authentication, and LLM chat interface.
heres the demo video: https://www.youtube.com/watch?v=RRAPx-MO-FA

## Features

### Core Features
- ✅ Goal Setting (daily calorie/macro targets, weight goals)
- ✅ Meal Entry (Breakfast/Lunch/Dinner/Snacks with full nutrition data)
- ✅ Time-Range Listing (filter by date range, meal type, pagination)
- ✅ Nutrition Reports & Graphs (weekly trends, macro breakdown, goal comparison)
- ✅ AI-Powered Calorie Extraction (from nutrition labels or food images)
- ✅ Multi-user Authentication (JWT-based)

### Bonus Features
- ✅ Conversational LLM Chat Interface
- ✅ PDF Bulk Import

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (via Prisma ORM)
- JWT Authentication
- Google Gemini API (for chat and image analysis)
- Cloudinary (image storage)

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (graphs)
- React Query

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or Neon)
- Google Gemini API key (get from https://aistudio.google.com/apikey)
- Cloudinary account

### Getting a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to your `.env` file as `GEMINI_API_KEY`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/calorie_tracker?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
GEMINI_API_KEY="your-gemini-api-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
PORT=5000
NODE_ENV=development
```

4. Setup database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

## Deployment

### Backend (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NODE_ENV=production`

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` (your Render backend URL)

### Database (Neon PostgreSQL)

1. Create a Neon PostgreSQL database
2. Copy the connection string to `DATABASE_URL` in backend environment variables
3. Run migrations: `npx prisma migrate deploy`

## Project Structure

```
PersonalCalorieTracker/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── lib/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── contexts/
│   │   ├── dashboard/
│   │   ├── meals/
│   │   ├── goals/
│   │   └── chat/
│   ├── components/
│   │   ├── charts/
│   │   └── ...
│   └── lib/
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Goals
- `POST /api/goals` - Create goal
- `GET /api/goals` - Get user's goals
- `GET /api/goals/current` - Get active goal
- `PUT /api/goals/:id` - Update goal

### Meals
- `POST /api/meals` - Create meal entry
- `GET /api/meals` - List meals (with filters & pagination)
- `PUT /api/meals/:id` - Update meal entry
- `DELETE /api/meals/:id` - Delete meal entry

### Reports
- `GET /api/reports/weekly` - Weekly calorie trend
- `GET /api/reports/macros` - Macro breakdown
- `GET /api/reports/micros` - Micronutrient summary
- `GET /api/reports/goal-comparison` - Goal vs Actual

### AI & Upload
- `POST /api/upload/image` - Upload image to Cloudinary
- `POST /api/ai/extract-nutrition` - Extract nutrition from image

### Chat
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history` - Get chat history

### Import
- `POST /api/import/pdf` - Parse PDF and preview meals
- `POST /api/import/pdf/confirm` - Confirm and import meals

## License

MIT
