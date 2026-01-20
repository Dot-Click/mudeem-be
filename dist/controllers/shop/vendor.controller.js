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
exports.deleteVendor = exports.approveVendor = exports.getAllVendors = void 0;
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const sendMail_1 = __importDefault(require("../../utils/sendMail"));
const getAllVendors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['vendor']
    try {
        const searchFilter = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                    { phone: { $regex: req.query.search, $options: 'i' } },
                    { username: { $regex: req.query.search, $options: 'i' } }
                ]
            }
            : {};
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const vendors = yield user_model_1.default.find(Object.assign({ role: 'vendor', isActive: true }, searchFilter))
            .skip(skip)
            .limit(limit);
        // later add no of products, no of total, no of completed, no of pending orders
        return (0, successHandler_1.default)({
            res,
            data: vendors,
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
exports.getAllVendors = getAllVendors;
const approveVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['vendor']
    try {
        const { id } = req.params;
        const { approved } = req.body;
        const vendor = yield user_model_1.default.findById(id);
        if (!vendor) {
            return (0, errorHandler_1.default)({
                message: 'Vendor not found',
                statusCode: 404,
                req,
                res
            });
        }
        vendor.adminApproved = approved;
        yield vendor.save();
        (0, successHandler_1.default)({
            res,
            data: { message: 'Vendor approved successfully', vendor },
            statusCode: 200
        });
        yield (0, sendMail_1.default)({
            email: vendor.email,
            subject: 'Vendor Approval',
            text: `Your account has been ${approved ? 'approved' : 'disapproved'} by the admin`
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
exports.approveVendor = approveVendor;
const deleteVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['vendor']
    try {
        const { id } = req.params;
        const vendor = yield user_model_1.default.findById(id);
        if (!vendor) {
            return (0, errorHandler_1.default)({
                message: 'Vendor not found',
                statusCode: 404,
                req,
                res
            });
        }
        vendor.isActive = false;
        yield vendor.save();
        (0, successHandler_1.default)({
            res,
            data: { message: 'Vendor deleted successfully', vendor },
            statusCode: 200
        });
        yield (0, sendMail_1.default)({
            email: vendor.email,
            subject: 'Account Deletion',
            text: `Your account has been deleted by the admin`
        });
        // deactivate all products of this vendor
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
exports.deleteVendor = deleteVendor;
