"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserStatus = exports.getAllUsers = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    try {
        const { page = 0, limit = 8, type } = req.query;
        const skip = Number(page) * Number(limit);
        const user = yield user_model_1.default.find();
        return (0, successHandler_1.default)({
            res,
            data: user,
            statusCode: 200
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
});
exports.getAllUsers = getAllUsers;
const changeUserStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const isUserExist = yield user_model_1.default.findById(id);
        if (!isUserExist) {
            return (0, errorHandler_1.default)({
                message: 'user not found',
                statusCode: 500,
                req,
                res
            });
        }
        isUserExist.isActive = !isUserExist;
        yield isUserExist.save();
        return (0, successHandler_1.default)({
            res,
            data: isUserExist,
            statusCode: 200
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
});
exports.changeUserStatus = changeUserStatus;
