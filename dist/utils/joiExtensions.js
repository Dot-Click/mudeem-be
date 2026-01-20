"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedJSON = exports.objectIDJoi = void 0;
const joi_1 = __importDefault(require("joi"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonParserJoi = joi_1.default.extend({
    type: 'json',
    base: joi_1.default.string(),
    messages: {
        'json.base': '{{#label}} must be a valid JSON string'
    },
    coerce: (value, helpers) => {
        try {
            return { value: JSON.parse(value) }; // Parse JSON if it's a valid string
        }
        catch (e) {
            console.log(e);
            return { errors: [helpers.error('json.base')] };
        }
    }
});
// Wrapper function for checking array or object
const validateParsedJSON = (type, schema) => 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// jsonParserJoi.json().custom((value: any, helpers: CustomHelpers) => {
//   console.log("value", value)
//   if (type === 'array' && !Array.isArray(value)) {
//     return helpers.error('json.base', { label: 'Expected an array' });
//   }
//   if (type === 'object' && typeof value !== 'object') {
//     return helpers.error('json.base', { label: 'Expected an object' });
//   }
//   // Validate the parsed JSON using the provided schema
//   const { error } = schema.validate(value, { allowUnknown: true });
//   if (error) {
//     throw error; // Joi handles this error and formats it
//   }
//   return value;
// });
jsonParserJoi.string().custom((value, helpers) => {
    console.log('value', typeof value);
    value = JSON.parse(value);
    if (type === 'array' && !Array.isArray(value)) {
        return helpers.error('json.base', { label: 'Expected an array' });
    }
    if (type === 'object' && typeof value !== 'object') {
        return helpers.error('json.base', { label: 'Expected an object' });
    }
    // Validate the parsed JSON using the provided schema
    const { error } = schema.validate(value, { allowUnknown: true });
    if (error) {
        throw error; // Joi handles this error and formats it
    }
    return value;
});
exports.validateParsedJSON = validateParsedJSON;
const objectIDJoi = joi_1.default.extend({
    type: 'objectId',
    base: joi_1.default.string(),
    messages: {
        'objectId.base': '{{#label}} must be a valid ObjectID'
    },
    coerce: (value, helpers) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            return { errors: [helpers.error('objectId.base')] };
        }
        return { value };
    }
});
exports.objectIDJoi = objectIDJoi;
