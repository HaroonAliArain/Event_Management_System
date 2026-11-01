const AppError = require('../utils/appError');

// 404 Route Not Found middleware
const notFound = (req, res, next) => {
  const message = `Route '${req.originalUrl}' with method [${req.method}] was not found on this server.`;
  next(new AppError(message, 404));
};

module.exports = notFound;
