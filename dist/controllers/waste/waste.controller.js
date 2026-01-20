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
exports.getRequestById = exports.approveRejectRequest = exports.getAllRequests = exports.createRequest = exports.deleteCompany = exports.getAllCompanies = exports.createCompany = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const company_model_1 = __importDefault(require("../../models/waste/company.model"));
const request_model_1 = __importDefault(require("../../models/waste/request.model"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const firebase_1 = require("../../utils/firebase");
const createCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['waste']
    try {
        const { name, description, location, contact, email, website } = req.body;
        const company = yield company_model_1.default.create({
            name,
            location,
            contact,
            email,
            website,
            description
        });
        return (0, successHandler_1.default)({
            res,
            data: company,
            statusCode: 201
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
exports.createCompany = createCompany;
const getAllCompanies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['waste']
    try {
        const companies = yield company_model_1.default.find({
            isActive: true
        });
        return (0, successHandler_1.default)({ res, data: companies, statusCode: 200 });
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
exports.getAllCompanies = getAllCompanies;
const deleteCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['waste']
    try {
        const { id } = req.params;
        const company = yield company_model_1.default.findByIdAndUpdate(id, { isActive: false });
        return (0, successHandler_1.default)({ res, data: company, statusCode: 200 });
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
exports.deleteCompany = deleteCompany;
const createRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['waste']
    try {
        const { wasteType, quantity, description, address1, address2, pickupDateTime, user, company } = req.body;
        const request = yield request_model_1.default.create({
            wasteType,
            quantity,
            description,
            address1,
            address2,
            pickupDateTime,
            user,
            company
        });
        return (0, successHandler_1.default)({
            res,
            data: request,
            statusCode: 201
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
exports.createRequest = createRequest;
const getAllRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['waste']
    try {
        // #swagger.parameters['query'] = {status: 'requested', company: 'company_id', pickupDateTime: '["2021-09-01T00:00:00.000Z", "2021-09-30T00:00:00.000Z"]', page: 0, limit: 10}
        let filters = {};
        const user = req.user;
        (user === null || user === void 0 ? void 0 : user.role) === 'admin' ? null : (filters.user = user === null || user === void 0 ? void 0 : user._id);
        req.query.status ? (filters.status = req.query.status) : null;
        req.query.company ? (filters.company = req.query.company) : null;
        req.query.pickupDateTime
            ? JSON.parse(req.query.pickupDateTime).length > 1 &&
                (filters.pickupDateTime = {
                    $gte: new Date(JSON.parse(req.query.pickupDateTime)[0]),
                    $lte: new Date(JSON.parse(req.query.pickupDateTime)[1])
                })
            : null;
        let page = Number(req.query.page) || 0;
        let limit = Number(req.query.limit) || 10;
        const skip = page * limit;
        const requests = yield request_model_1.default.find(filters)
            .skip(skip)
            .limit(limit)
            .populate('company')
            .populate('user')
            .sort({ createdAt: -1 });
        return (0, successHandler_1.default)({ res, data: requests, statusCode: 200 });
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
exports.getAllRequests = getAllRequests;
const getRequestById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['waste']
    try {
        const { id } = req.params;
        const request = yield request_model_1.default.findById(id)
            .populate('company')
            .populate('user');
        if (!request) {
            return (0, errorHandler_1.default)({
                message: 'Request not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({ res, data: request, statusCode: 200 });
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
exports.getRequestById = getRequestById;
const approveRejectRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['waste']
    try {
        const { id } = req.params;
        const { status } = req.body;
        const request = yield request_model_1.default.findByIdAndUpdate(id, { status });
        const user = yield user_model_1.default.findById(request === null || request === void 0 ? void 0 : request.user);
        if (request && status === 'accepted') {
            yield user_model_1.default.updateOne({ _id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, {
                $inc: { greenPoints: req.body.greenPoints },
                $push: {
                    greenPointsHistory: {
                        points: req.body.greenPoints || 0,
                        reason: "Waste",
                        type: "credit",
                        date: new Date()
                    }
                }
            });
            const token = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
            yield (0, firebase_1.sentPushNotification)(token, `Waste accepted`, `Congratulations! You have earned ${req.body.greenPoints} green points for Waste.`, user === null || user === void 0 ? void 0 : user._id.toString(), req.body.greenPoints.toString());
        }
        return (0, successHandler_1.default)({ res, data: request, statusCode: 200 });
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
exports.approveRejectRequest = approveRejectRequest;
