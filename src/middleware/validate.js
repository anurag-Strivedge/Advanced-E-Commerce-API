/**
 * Middleware to validate request data using Joi schemas
 * @param {Object} schema - Joi schema object with optional body, params, query
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = {};

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.body = error.details.map((detail) => detail.message);
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        validationErrors.params = error.details.map((detail) => detail.message);
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.query = error.details.map((detail) => detail.message);
      }
    }

    // If there are validation errors, return 400
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    next();
  };
};

module.exports = validate;
