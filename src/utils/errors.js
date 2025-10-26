class AppError extends Error {
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Mark as operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation Failed', details = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication Required', details = {}) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Forbidden', details = {}) {
    super(message, 403, 'AUTHORIZATION_FAILED', details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found', details = {}) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests', details = {}) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External Service Error', details = {}) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database Error', details = {}) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
};
