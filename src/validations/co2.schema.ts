import Joi from 'joi';

const analyzeCo2 = Joi.object({
  imageUrl: Joi.string().uri().required().messages({
    'string.base': 'imageUrl must be a string',
    'string.uri': 'imageUrl must be a valid URL',
    'any.required': 'imageUrl is required'
  }),
  weightInGrams: Joi.string()
    .required()
    .custom((value, helpers) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'string.base': 'weightInGrams must be a string',
      'any.required': 'weightInGrams is required',
      'any.invalid': 'weightInGrams must be a number greater than 0'
    }),
  language: Joi.string().optional().allow('').messages({
    'string.base': 'language must be a string'
  })
});

export { analyzeCo2 };
