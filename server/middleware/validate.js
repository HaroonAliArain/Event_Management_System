const mongoose = require('mongoose');
const AppError = require('../utils/appError');

// Validate MongoDB ObjectId parameter
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid ObjectId format for parameter '${paramName}': '${id}'`, 400));
    }
    next();
  };
};

// Sanitize request payload strings
const sanitizePayload = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  validateObjectId,
  sanitizePayload,
};
