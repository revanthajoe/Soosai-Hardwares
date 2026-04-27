/**
 * Input Validation Middleware
 * Centralized request validation using Joi
 */

const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth validation
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(100).required(),
  }),

  // Category validation
  createCategory: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    slug: Joi.string().min(2).max(100).optional().trim(),
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(2).max(100).optional().trim(),
    slug: Joi.string().min(2).max(100).optional().trim(),
  }),

  // Product validation
  createProduct: Joi.object({
    name: Joi.string().min(2).max(200).required().trim(),
    categoryId: Joi.number().integer().positive().required(),
    brand: Joi.string().max(100).optional().trim(),
    unit: Joi.string().max(20).optional().trim(),
    price: Joi.number().positive().required(),
    stock: Joi.number().integer().min(0).required(),
    description: Joi.string().max(2000).optional().trim(),
    isActive: Joi.boolean().optional(),
    isFeatured: Joi.boolean().optional(),
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(2).max(200).optional().trim(),
    categoryId: Joi.number().integer().positive().optional(),
    brand: Joi.string().max(100).optional().trim(),
    unit: Joi.string().max(20).optional().trim(),
    price: Joi.number().positive().optional(),
    stock: Joi.number().integer().min(0).optional(),
    description: Joi.string().max(2000).optional().trim(),
    isActive: Joi.boolean().optional(),
    isFeatured: Joi.boolean().optional(),
  }),

  // Query validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('ASC', 'DESC').optional(),
  }),
};

/**
 * Middleware factory for request validation
 * @param {string} schemaKey - Key of the schema to use
 * @param {string} source - Where to validate ('body', 'query', 'params')
 */
const validate = (schemaKey, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaKey];
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: `Validation schema not found: ${schemaKey}`,
        statusCode: 500,
      });
    }

    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        errors,
      });
    }

    // Attach validated data to request
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
};

module.exports = {
  schemas,
  validate,
};
