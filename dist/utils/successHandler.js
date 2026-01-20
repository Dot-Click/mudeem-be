"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SuccessHandler = ({ data, statusCode, res }) => {
    return res.status(statusCode).json({
        success: true,
        data: data
    });
};
exports.default = SuccessHandler;
