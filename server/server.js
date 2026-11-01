const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Load environment configuration from server directory or root
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Asynchronous non-blocking initial database connection
connectDB().catch((err) => {
  console.warn('[Database] Initial connection deferred:', err.message);
});

const app = express();

// Set HTTP security response headers
app.use(helmet());

// Cross-Origin Resource Sharing setup
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === 'development' ||
        (typeof origin === 'string' && origin.endsWith('.vercel.app'))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global API rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 500,
  message: {
    success: false,
    message: 'Too many requests received from this IP address, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request body parsers with payload limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Root welcome endpoint (always responds, never crashes)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Eventify REST API Service is online and operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    endpoints: {
      health: '/api/health',
      events: '/api/events',
      customers: '/api/customers',
      bookings: '/api/bookings',
      stats: '/api/stats',
    },
    timestamp: new Date().toISOString(),
  });
});

// Root API directory endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Eventify API Root Directory',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    endpoints: {
      health: '/api/health',
      events: '/api/events',
      customers: '/api/customers',
      bookings: '/api/bookings',
      stats: '/api/stats',
    },
  });
});

// Health verification endpoint (always responds 200 with DB status)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Eventify API Server is operational',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    uptime: `${Math.round(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Middleware to ensure database connection before executing CRUD queries
const ensureDbConnected = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState < 1) {
      const conn = await connectDB();
      if (!conn) {
        return res.status(503).json({
          success: false,
          message: 'Database connection is temporarily unavailable. Please verify MONGODB_URI on Vercel.',
        });
      }
    }
    next();
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Database connection error: ' + err.message,
    });
  }
};

// Mount application REST routes with safe database middleware
app.use('/api/events', ensureDbConnected, require('./routes/eventRoutes'));
app.use('/api/customers', ensureDbConnected, require('./routes/customerRoutes'));
app.use('/api/bookings', ensureDbConnected, require('./routes/bookingRoutes'));
app.use('/api/stats', ensureDbConnected, require('./routes/statsRoutes'));

// 404 route not found handler
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

// Start HTTP server (in standalone / non-serverless environments)
const PORT = process.env.PORT || 5001;
let server;

if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`[Server] Eventify REST API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Health] Check endpoint: http://localhost:${PORT}/api/health`);
  });
}

// Handle unhandled Promise rejections safely
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  if (server && !process.env.VERCEL) {
    server.close(() => process.exit(1));
  }
});

// Handle uncaught exceptions safely
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception]: ${err.message}`);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// Handle termination signals for clean shutdown
process.on('SIGTERM', () => {
  console.log('[System] SIGTERM received. Gracefully closing HTTP server...');
  if (server) {
    server.close(() => {
      console.log('[System] HTTP server closed cleanly.');
    });
  }
});

module.exports = app;
