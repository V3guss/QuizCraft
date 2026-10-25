import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import subjectRoutes from './routes/subject.routes';
import documentRoutes from './routes/document.routes';
import summaryRoutes from './routes/summary.routes';
import flashcardRoutes from './routes/flashcard.routes';
import quizRoutes from './routes/quiz.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(uploadDir)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Public client configuration (max upload size is configurable via MAX_FILE_SIZE)
app.get('/api/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '209715200', 10),
      allowedExtensions: ['.pdf', '.docx', '.pptx', '.txt'],
    },
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'QuizCraft AI Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to QuizCraft AI API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      subjects: '/api/subjects',
      documents: '/api/documents',
      summaries: '/api/summaries',
      flashcards: '/api/flashcards',
      quiz: '/api/quiz',
      dashboard: '/api/dashboard',
      admin: '/api/admin',
      health: '/api/health',
    },
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      error: `File too large. Maximum size is ${Math.round(parseInt(process.env.MAX_FILE_SIZE || '209715200', 10) / 1048576)}MB.`,
    });
    return;
  }

  // Multer file type error
  if (err.message && err.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ðŸš€ QuizCraft AI Backend running on http://localhost:${PORT}`);
  console.log(`ðŸ“š API Documentation: http://localhost:${PORT}/`);
  console.log(`ðŸ’š Health Check: http://localhost:${PORT}/api/health`);
});

export default app;

