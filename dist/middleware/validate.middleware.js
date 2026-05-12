"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = req[source];
        const { error, value } = schema.validate(data);
        if (error) {
            return res.status(400).json({
                success: 'false',
                message: error.details[0].message
            });
        }
        req[source] = value;
        next();
    };
};
exports.validate = validate;
