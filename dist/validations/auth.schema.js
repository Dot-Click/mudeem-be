"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSessions = exports.updatePassword = exports.resetPassword = exports.login = exports.verifyEmailToken = exports.requestEmailToken = exports.register = void 0;
const joi_1 = __importDefault(require("joi"));
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
const register = joi_1.default.object({
    name: joi_1.default.string().min(3).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}',
        'any.required': 'Name is required'
    }),
    email: joi_1.default.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email'
    }),
    password: joi_1.default.string().pattern(passwordRegex).required().messages({
        'string.pattern.base': 'Password must have at least one uppercase letter, one special character and one number'
    }),
    username: joi_1.default.string().min(3).required().messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username cannot be empty',
        'string.min': 'Username should have a minimum length of {#limit}',
        'any.required': 'Username is required'
    }),
    phone: joi_1.default.string().required().messages({
        'string.base': 'Phone must be a string',
        'string.empty': 'Phone cannot be empty',
        'any.required': 'Phone is required'
    }),
    role: joi_1.default.string().valid('user', 'vendor').required().messages({
        'any.only': 'Role must be either user or vendor'
    })
});
exports.register = register;
const requestEmailToken = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email'
    })
});
exports.requestEmailToken = requestEmailToken;
const verifyEmailToken = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email'
    }),
    emailVerificationToken: joi_1.default.number()
        .positive()
        .integer()
        .required()
        .messages({
        'number.base': 'Email verification token must be a number',
        'number.positive': 'Email verification token must be a positive number',
        'number.integer': 'Email verification token must be an integer',
        'number.min': 'Email verification token must be at least 100000',
        'number.max': 'Email verification token must be at most 999999',
        'any.required': 'Email verification token is required'
    })
});
exports.verifyEmailToken = verifyEmailToken;
const login = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email'
    }),
    password: joi_1.default.string().min(6).required().messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password should have a minimum length of {#limit}',
        'any.required': 'Password is required'
    }),
    firebaseToken: joi_1.default.string().messages({
        'string.base': 'Firebase token must be a string'
    })
});
exports.login = login;
const resetPassword = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email cannot be empty',
        'string.email': 'Email must be a valid email'
    }),
    password: joi_1.default.string().pattern(passwordRegex).required().messages({
        'string.pattern.base': 'Password must have at least one uppercase letter, one special character and one number'
    }),
    passwordResetToken: joi_1.default.number().required().positive().integer().messages({
        'number.base': 'Password reset token must be a number',
        'number.positive': 'Password reset token must be a positive number',
        'number.integer': 'Password reset token must be an integer',
        'any.required': 'Password reset token is required'
    })
});
exports.resetPassword = resetPassword;
const updatePassword = joi_1.default.object({
    currentPassword: joi_1.default.string().min(6).required().messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password cannot be empty',
        'string.min': 'Password should have a minimum length of {#limit}',
        'any.required': 'Password is required'
    }),
    newPassword: joi_1.default.string().pattern(passwordRegex).required().messages({
        'string.pattern.base': 'Password must have at least one uppercase letter, one special character and one number'
    })
});
exports.updatePassword = updatePassword;
const removeSessions = joi_1.default.object({
    sessionIds: joi_1.default.array().items(joi_1.default.string()).min(1).required().messages({
        'array.base': 'SessionIds must be an array',
        'array.empty': 'SessionIds cannot be empty',
        'array.min': 'SessionIds must have a minimum length of {#limit}',
        'any.required': 'SessionIds is required'
    })
});
exports.removeSessions = removeSessions;
