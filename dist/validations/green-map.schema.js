"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGreenMapPoint = void 0;
const joi_1 = __importDefault(require("joi"));
const createGreenMapPoint = joi_1.default.object({
    location: joi_1.default.string().required().messages({
        'string.base': 'location must be a string',
        'any.required': 'location is required'
    }),
    description: joi_1.default.string().required().messages({
        'string.base': 'description must be a string',
        'any.required': 'description is required'
    }),
    greenPointsPerTime: joi_1.default.number().required().messages({
        'string.base': 'greenPointsPerTime must be a string',
        'any.required': 'greenPointsPerTime is required'
    }),
    coordinates: joi_1.default.object({
        lat: joi_1.default.number().required().messages({
            'number.base': 'Latitude must be a number',
            'any.required': 'Latitude is required'
        }),
        lng: joi_1.default.number().required().messages({
            'number.base': 'Longitude must be a number',
            'any.required': 'Longitude is required'
        })
    })
        .required()
        .messages({
        'object.base': 'Coordinates must be an object with lat and lng'
    }),
    category: joi_1.default.string()
        .valid('green space', 'ef building', 'recycling bin')
        .required()
        .messages({
        'any.only': 'category must be of the followings green space , ef building ,recyling bins'
    })
});
exports.createGreenMapPoint = createGreenMapPoint;
