import Joi from 'joi';

const createGreenMapPoint = Joi.object({
  location: Joi.string().required().messages({
    'string.base': 'location must be a string',
    'any.required': 'location is required'
  }),
  description: Joi.string().required().messages({
    'string.base': 'description must be a string',
    'any.required': 'description is required'
  }),
  greenPointsPerTime: Joi.number().required().messages({
    'string.base': 'greenPointsPerTime must be a string',
    'any.required': 'greenPointsPerTime is required'
  }),
  coordinates: Joi.object({
    lat: Joi.number().required().messages({
      'number.base': 'Latitude must be a number',
      'any.required': 'Latitude is required'
    }),
    lng: Joi.number().required().messages({
      'number.base': 'Longitude must be a number',
      'any.required': 'Longitude is required'
    })
  })
    .required()
    .messages({
      'object.base': 'Coordinates must be an object with lat and lng'
    }),
  category: Joi.string()
    // Accept common client variants; backend will normalize if needed.
    .valid('green space', 'ef building', 'recycling bin', 'recycle bin')
    .required()
    .messages({
      'any.only':
        'category must be one of: green space, ef building, recycling bin'
    })
});

export { createGreenMapPoint };
