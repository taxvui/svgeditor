import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './api.js';

export const app = express();

// Body parsing and cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Same-origin API. Auth responses and protected data must never be cached.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (/\/(auth|admin)(\/|$)/.test(req.path)) res.setHeader('Cache-Control', 'no-store');
  next();
});

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount Backend REST API router
// In serverless environments (like Vercel), the route might arrive as /api/... or as /...
// Mounting at both paths guarantees that all endpoints are reachable.
app.use('/api', apiRouter);
// Only serverless API entry points may need the stripped /api prefix.
if (process.env.VERCEL) app.use('/', apiRouter);

export default app;
