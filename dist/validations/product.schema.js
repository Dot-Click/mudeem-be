"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.createProduct = void 0;
const joi_1 = __importDefault(require("joi"));
const joiExtensions_1 = require("../utils/joiExtensions");
const variantSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).required().messages({
        'string.base': 'Variant name must be a string',
        'string.empty': 'Variant name cannot be empty',
        'string.min': 'Variant name should have a minimum length of {#limit}',
        'any.required': 'Variant name is required'
    }),
    price: joi_1.default.number().required().messages({
        'number.base': 'Variant price must be a number',
        'any.required': 'Variant price is required'
    }),
    sizes: joi_1.default.array()
        .items(joi_1.default.object({
        size: joi_1.default.string().required().messages({
            'string.base': 'Size must be a string',
            'string.empty': 'Size cannot be empty',
            'any.required': 'Size is required'
        }),
        stock: joi_1.default.number().required().messages({
            'number.base': 'Stock must be a number',
            'any.required': 'Stock is required'
        })
    }))
        .required()
        .messages({
        'array.base': 'Sizes must be an array',
        'any.required': 'Sizes are required'
    }),
    colors: joi_1.default.array()
        .items(joi_1.default.object({
        color: joi_1.default.string().required().messages({
            'string.base': 'Color must be a string',
            'string.empty': 'Color cannot be empty',
            'any.required': 'Color is required'
        }),
        stock: joi_1.default.number().required().messages({
            'number.base': 'Stock must be a number',
            'any.required': 'Stock is required'
        })
    }))
        .required()
        .messages({
        'array.base': 'Colors must be an array',
        'any.required': 'Colors are required'
    })
});
const variantSchemaWith_id = joi_1.default.object({
    _id: joi_1.default.string().required().messages({
        'string.base': 'Variant ID must be a string',
        'string.empty': 'Variant ID cannot be empty',
        'any.required': 'Variant ID is required'
    }),
    name: joi_1.default.string().min(3).required().messages({
        'string.base': 'Variant name must be a string',
        'string.empty': 'Variant name cannot be empty',
        'string.min': 'Variant name should have a minimum length of {#limit}',
        'any.required': 'Variant name is required'
    }),
    price: joi_1.default.number().required().messages({
        'number.base': 'Variant price must be a number',
        'any.required': 'Variant price is required'
    }),
    sizes: joi_1.default.array()
        .items(joi_1.default.object({
        size: joi_1.default.string().required().messages({
            'string.base': 'Size must be a string',
            'string.empty': 'Size cannot be empty',
            'any.required': 'Size is required'
        }),
        stock: joi_1.default.number().required().messages({
            'number.base': 'Stock must be a number',
            'any.required': 'Stock is required'
        })
    }))
        .required()
        .messages({
        'array.base': 'Sizes must be an array',
        'any.required': 'Sizes are required'
    }),
    colors: joi_1.default.array()
        .items(joi_1.default.object({
        color: joi_1.default.string().required().messages({
            'string.base': 'Color must be a string',
            'string.empty': 'Color cannot be empty',
            'any.required': 'Color is required'
        }),
        stock: joi_1.default.number().required().messages({
            'number.base': 'Stock must be a number',
            'any.required': 'Stock is required'
        })
    }))
        .required()
        .messages({
        'array.base': 'Colors must be an array',
        'any.required': 'Colors are required'
    })
});
const createProduct = joi_1.default.object({
    name: joi_1.default.string().min(3).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}',
        'any.required': 'Name is required'
    }),
    name_ar: joi_1.default.string().min(3).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}',
        'any.required': 'Name is required'
    }),
    description: joi_1.default.string().min(3).max(1000).required().messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description should have a minimum length of {#limit}',
        'any.required': 'Description is required'
    }),
    description_ar: joi_1.default.string().min(3).max(1000).required().messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description should have a minimum length of {#limit}',
        'any.required': 'Description is required'
    }),
    price: joi_1.default.number().required().messages({
        'number.base': 'Price must be a number',
        'any.required': 'Price is required'
    }),
    category: joiExtensions_1.objectIDJoi.objectId().required().messages({
        'objectId.base': 'Category must be a valid ObjectID',
        'any.required': 'Category is required'
    }),
    images: joi_1.default.string().optional(),
    variants: (0, joiExtensions_1.validateParsedJSON)('array', joi_1.default.array().items(variantSchema))
        .required()
        .messages({
        'json.base': 'Variants must be a valid JSON array',
        'any.required': 'Variants are required'
    }),
    greenPointsPerUnit: joi_1.default.number().required().messages({
        'number.base': 'Green points per unit must be a number',
        'any.required': 'Green points per unit is required'
    }),
    brand: joi_1.default.string().required().messages({
        'string.base': 'Brand must be a string',
        'string.empty': 'Brand cannot be empty',
        'any.required': 'Brand is required'
    }),
    brand_ar: joi_1.default.string().required().messages({
        'string.base': 'Brand must be a string',
        'string.empty': 'Brand cannot be empty',
        'any.required': 'Brand is required'
    }),
    featured: joi_1.default.boolean().optional()
});
exports.createProduct = createProduct;
const updateProduct = joi_1.default.object({
    name: joi_1.default.string().min(3).messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}'
    }),
    name_ar: joi_1.default.string().min(3).messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}'
    }),
    description: joi_1.default.string().min(3).max(1000).messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description should have a minimum length of {#limit}'
    }),
    description_ar: joi_1.default.string().min(3).max(1000).messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description should have a minimum length of {#limit}'
    }),
    price: joi_1.default.number().messages({
        'number.base': 'Price must be a number'
    }),
    category: joiExtensions_1.objectIDJoi.objectId().messages({
        'objectId.base': 'Category must be a valid ObjectID'
    }),
    images: joi_1.default.string().optional(),
    // variants: validateParsedJSON(
    //   'array',
    //   Joi.array().items(variantSchema)
    // ).messages({
    //   'json.base': 'Variants must be a valid JSON array'
    // }),
    updatedVariants: (0, joiExtensions_1.validateParsedJSON)('array', joi_1.default.array().items(variantSchemaWith_id))
        .optional()
        .messages({
        'json.base': 'Updated Variants must be a valid JSON array'
    }),
    deletedVariants: (0, joiExtensions_1.validateParsedJSON)('array', joi_1.default.array().items(joi_1.default.string()).optional()).messages({
        'json.base': 'Deleted Variants must be a valid JSON array'
    }),
    newVariants: (0, joiExtensions_1.validateParsedJSON)('array', joi_1.default.array().items(variantSchema).optional()).messages({
        'json.base': 'New Variants must be a valid JSON array'
    }),
    deletedImages: (0, joiExtensions_1.validateParsedJSON)('array', joi_1.default.array().items(joi_1.default.string()))
        .optional()
        .messages({
        'json.base': 'Deleted Images must be a valid JSON array'
    }),
    greenPointsPerUnit: joi_1.default.number().messages({
        'number.base': 'Green points per unit must be a number'
    }),
    brand: joi_1.default.string().messages({
        'string.base': 'Brand must be a string',
        'string.empty': 'Brand cannot be empty'
    }),
    brand_ar: joi_1.default.string().messages({
        'string.base': 'Brand must be a string',
        'string.empty': 'Brand cannot be empty'
    }),
    featured: joi_1.default.boolean().optional()
});
exports.updateProduct = updateProduct;
