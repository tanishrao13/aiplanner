import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';

// Import Routes
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import quizRoutes from './routes/quiz.js';
import planRoutes from './routes/plan.js';
import progressRoutes from './routes/progress.js';
import codingRoutes from './routes/coding.js';

// Import Middleware
import { requireAuth } from './middleware/authMiddleware.js';

const app = express();

// Middleware
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/progress', progressRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(config.port, () => {
  console.log(`StudyOS server running on port ${config.port}`);
  
  // Mongoose Connection after server starts
  mongoose.connect(config.mongodbUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      // We don't exit(1) here so the server stays up and we can see health/errors
    });
});
