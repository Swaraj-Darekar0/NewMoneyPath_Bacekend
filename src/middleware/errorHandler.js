const logger = require('../config/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.message, {
    requestId: req.id,
    stack: err.stack,
    details: err.details,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
  }

  // For non-operational errors, send a generic message in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong on our end.',
      },
    });
  }

  // In development, send more details
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message,
      stack: err.stack,
    },
  });
};

module.exports = errorHandler;
