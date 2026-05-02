import "dotenv/config";

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { getPool } from './config/db.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import errorHandler from'./middleware/errorHandler.js';

// dotenv.config();
const app  = express();
const PORT = process.env.PORT || 3001;

// ── Rate limiting (general) ───────────────────────────────────
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed! Unauthorized CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '200'),
  message:  { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await getPool();
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── API routes ────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const start = async () => {
  try {
    await getPool();
    logger.info('Database connected.');
    app.listen(PORT, () => {
      logger.info(`KUKAT API running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
