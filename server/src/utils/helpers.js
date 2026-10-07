// Wraps async route handlers so thrown errors / rejected promises are passed
// to Express's error middleware instead of crashing the request.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Runs express-validator's checks and returns a single 400 response if any fail,
// so controllers never have to repeat the same validation boilerplate.
const { validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Final error handler: catches anything the controllers didn't handle and
// always answers with JSON (never an HTML stack trace in production).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Something went wrong on the server' : err.message,
  });
};

// Fields that are safe to expose for another user in populated sub-documents.
// Email is intentionally excluded — it is only returned for your own profile.
const PUBLIC_USER_FIELDS = 'name avatar bio location experienceLevel availability rating ratingCount createdAt';

module.exports = { asyncHandler, validate, errorHandler, PUBLIC_USER_FIELDS };
