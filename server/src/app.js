import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import operatorRoutes from './routes/operatorRoutes.js';
import engineerRoutes from './routes/engineerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import { sendError } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or tests)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev mode
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body and Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(uploadsDir));

// Rate limiting on sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Mount Routes with /api/v1 prefix
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1', citizenRoutes);
app.use('/api/v1/operator', operatorRoutes);
app.use('/api/v1/engineer', engineerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', translationRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'JanShikayat Municipal Complaint Engine',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  sendError(res, { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` }, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);

  // Multer file size / type error
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, { code: 'FILE_TOO_LARGE', message: 'File size exceeds 5MB limit' }, 400);
    }
    return sendError(res, { code: 'UPLOAD_ERROR', message: err.message }, 400);
  }

  if (err.message && err.message.includes('Only JPG, PNG, and WEBP formats are allowed')) {
    return sendError(res, { code: 'INVALID_FILE_TYPE', message: err.message }, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  sendError(res, { code, message }, statusCode);
});
