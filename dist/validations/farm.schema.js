"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFarm = exports.createFarm = void 0;
const joi_1 = __importDefault(require("joi"));
const createFarm = joi_1.default.object({
    location: joi_1.default.string().required().messages({
        'string.base': 'location must be a string',
        'any.required': 'location is required'
    }),
    renewableEnergy: joi_1.default.string().required().messages({
        'string.base': 'renewableEnergy must be a string',
        'any.required': 'renewableEnergy is required'
    }),
    fertilizer: joi_1.default.string().required().messages({
        'string.base': 'fertilizer must be a string',
        'any.required': 'fertilizer is required'
    }),
    desalinationMethod: joi_1.default.string().required().messages({
        'string.base': 'desalinationMethod must be a string',
        'any.required': 'desalinationMethod is required'
    }),
    farmDesignSpecs: joi_1.default.string().required().messages({
        'string.base': 'farmDesignSpecs must be a string',
        'any.required': 'farmDesignSpecs is required'
    }),
    desiredEquipment: joi_1.default.string().required().messages({
        'string.base': 'desiredEquipment must be a string',
        'any.required': 'desiredEquipment is required'
    }),
    budgetDetails: joi_1.default.number().required().messages({
        'string.base': 'budgetDetails must be a number',
        'any.required': 'budgetDetails is required'
    }),
    electricGeneration: joi_1.default.string().required().messages({
        'string.base': 'electricGeneration must be a string',
        'any.required': 'electricGeneration is required'
    }),
    images: joi_1.default.string().optional()
});
exports.createFarm = createFarm;
const updateFarm = joi_1.default.object({
    location: joi_1.default.string().required().messages({
        'string.base': 'location must be a string',
        'any.required': 'location is required'
    }),
    renewableEnergy: joi_1.default.string().required().messages({
        'string.base': 'renewableEnergy must be a string',
        'any.required': 'renewableEnergy is required'
    }),
    fertilizer: joi_1.default.string().required().messages({
        'string.base': 'fertilizer must be a string',
        'any.required': 'fertilizer is required'
    }),
    desalinationMethod: joi_1.default.string().required().messages({
        'string.base': 'desalinationMethod must be a string',
        'any.required': 'desalinationMethod is required'
    }),
    farmDesignSpecs: joi_1.default.string().required().messages({
        'string.base': 'farmDesignSpecs must be a string',
        'any.required': 'farmDesignSpecs is required'
    }),
    desiredEquipment: joi_1.default.string().required().messages({
        'string.base': 'desiredEquipment must be a string',
        'any.required': 'desiredEquipment is required'
    }),
    budgetDetails: joi_1.default.number().required().messages({
        'string.base': 'budgetDetails must be a number',
        'any.required': 'budgetDetails is required'
    }),
    electricGeneration: joi_1.default.string().required().messages({
        'string.base': 'electricGeneration must be a string',
        'any.required': 'electricGeneration is required'
    })
});
exports.updateFarm = updateFarm;
