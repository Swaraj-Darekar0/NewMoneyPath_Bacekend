const Joi = require('joi');
const { ValidationError } = require('./errors');

// Schemas
const onboardingSchema = Joi.object({
  daily_expenses: Joi.number().integer().min(0).max(1000000).required(), // Max ₹10,000
  average_monthly_income: Joi.number().integer().min(0).max(100000000).required(), // Max ₹10,00,000
  timezone: Joi.string().required(), // Added timezone as it's part of user creation
});

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/) // At least one uppercase, one lowercase, one number
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    }),
  onboardingData: onboardingSchema.required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createMissionSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  target_amount: Joi.number().integer().min(100).max(10000000000).required(), // ₹1 to ₹1 crore
  duration_days: Joi.number().integer().min(1).max(365).required(),
  priority: Joi.string().valid('non_negotiable', 'big_moves', 'flex_goals').required(),
});

const updateMissionSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  target_amount: Joi.number().integer().min(100).max(10000000000),
  duration_days: Joi.number().integer().min(1).max(365),
  priority: Joi.string().valid('non_negotiable', 'big_moves', 'flex_goals'),
}).min(1); // Require at least one field to be updated

const reorderMissionsSchema = Joi.object({
  priority: Joi.string().valid('non_negotiable', 'big_moves', 'flex_goals').required(),
  order: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const syncTransactionsSchema = Joi.object({
  source: Joi.string().valid('sms_android', 'aa_ios').required(),
  transactions: Joi.array().items(Joi.object({
    amount: Joi.number().integer().min(1).required(),
    type: Joi.string().valid('credit', 'expense').required(), // Changed from debit to expense to match enum
    category: Joi.string().allow(null, ''),
    transaction_date: Joi.date().iso().required(),
    source_identifier: Joi.string().required(),
    metadata: Joi.object().allow(null),
  })).min(1).required(),
});

const manualTransactionSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  type: Joi.string().valid('credit', 'expense').required(), // Changed from debit to expense to match enum
  category: Joi.string().allow(null, ''),
  transaction_date: Joi.date().iso().required(),
  metadata: Joi.object().allow(null),
});

const createOrderSchema = Joi.object({
  amount: Joi.number().integer().min(100).required(), // Minimum 1 INR (100 paise)
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.path.join('.'),
      issue: err.message,
    }));
    return next(new ValidationError('Validation failed', { details: errors }));
  }

  req.validatedBody = value; // Attach validated data to request
  next();
};

module.exports = {
  onboardingSchema,
  signupSchema,
  loginSchema,
  createMissionSchema,
  updateMissionSchema,
  reorderMissionsSchema,
  syncTransactionsSchema,
  manualTransactionSchema,
  createOrderSchema,
  validate,
};
