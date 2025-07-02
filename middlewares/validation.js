const { body, validationResult } = require('express-validator');

// Middleware to run after validation chains
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
exports.validateDocumentUpload = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('category').optional().isString(),
  validate,
];

exports.validateDocumentReview = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('comment').optional().isLength({ max: 1000 }),
  validate,
];

exports.validateResubmission = [
  body('title').optional().isString(),
  body('description').optional().isString(),
  body('category').optional().isString(),
  validate,
];

// ✅ User Registration
exports.validateUserRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

exports.validateVerifyEmail = [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').notEmpty().isLength({ min: 4, max: 6 }).withMessage('Invalid OTP'),
  validate,
];

exports.validateResendVerification = [
  body('email').isEmail().withMessage('Valid email required'),
  validate,
];


// ✅ User Login
exports.validateUserLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ✅ Forgot Password Request (OTP)
exports.validateForgotPassword = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  validate,
];

// ✅ Reset Password With OTP
exports.validateResetPassword = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];
