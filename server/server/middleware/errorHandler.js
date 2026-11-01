const AppError = require('../utils/appError');

// Handle Mongoose Invalid ObjectId CastError
const handleCastErrorDB = (err) => {
  const message = `Invalid resource identifier: '${err.value}' for field '${err.path}'.`;
  return new AppError(message, 400);
};

// Handle Mongoose Duplicate Unique Key Error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : 'value';
  const message = `A record with ${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 409);
};

// Handle Mongoose Schema Validation Errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failure: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Log error message in console
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  // Catch Mongoose CastError for invalid ObjectIDs
  if (err.name === 'CastError') error = handleCastErrorDB(err);

  // Catch Mongoose duplicate unique key errors
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);

  // Catch Mongoose validation constraint errors
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

  // Catch malformed JSON payload errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload received.', 400);
  }

  const isDev = process.env.NODE_ENV === 'development';

  return res.status(error.statusCode || 500).json({
    success: false,
    status: error.status,
    message: error.message || 'An unexpected internal server error occurred.',
    ...(isDev && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
