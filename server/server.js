const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Load environment configuration
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Set HTTP security response headers
app.use(helmet());

// Cross-Origin Resource Sharing setup
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
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

// Health verification endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Eventify API Server is operational',
    uptime: `${Math.round(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount application REST routes
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// 404 route not found handler
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

// Start HTTP server
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`[Server] Eventify REST API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[Health] Check endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Fatal]: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception Fatal]: ${err.message}`);
  process.exit(1);
});

// Handle termination signals for clean shutdown
process.on('SIGTERM', () => {
  console.log('[System] SIGTERM received. Gracefully closing HTTP server...');
  server.close(() => {
    console.log('[System] HTTP server closed cleanly.');
  });
});

module.exports = app;
