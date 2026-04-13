import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import pinoHttp from 'pino-http';
import { Pool } from 'pg';

import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { taskRoutes } from './routes/tasks.js';
import { errorHandler } from './middleware/errorHandler.js';
import { verifyToken } from './middleware/auth.js';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(pinoHttp());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/projects', verifyToken, projectRoutes);
app.use('/tasks', verifyToken, taskRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✓ API running on http://0.0.0.0:${port}`);
});

export default app;
