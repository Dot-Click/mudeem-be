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
exports.deleteEvent = exports.updateEvent = exports.getEvent = exports.getAllEvents = exports.createEvent = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const events_model_1 = __importDefault(require("../../models/user/events.model"));
const moment_1 = __importDefault(require("moment"));
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['events']
    try {
        const { name, description, dateTime, location } = req.body;
        const event = yield events_model_1.default.create({
            name,
            description,
            dateTime,
            location
        });
        return (0, successHandler_1.default)({
            res,
            data: event,
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
exports.createEvent = createEvent;
const getAllEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['events']
    try {
        const { page = 0, limit = 10 } = req.query;
        const skip = Number(page) * Number(limit);
        const filter = {};
        req.query.search &&
            (filter['name'] = { $regex: String(req.query.search), $options: 'i' });
        req.query.dateTime &&
            (filter['dateTime'] = {
                $gte: (0, moment_1.default)(String(req.query.dateTime)).toDate(),
                $lt: (0, moment_1.default)(String(req.query.dateTime)).add(1, 'day').toDate()
            });
        const events = yield events_model_1.default.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        return (0, successHandler_1.default)({ res, data: events, statusCode: 200 });
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
exports.getAllEvents = getAllEvents;
const getEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['events']
    try {
        const event = yield events_model_1.default.findById(req.params.id);
        if (!event) {
            return (0, errorHandler_1.default)({
                message: 'Event not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({ res, data: event, statusCode: 200 });
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
exports.getEvent = getEvent;
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['events']
    try {
        const event = yield events_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!event) {
            return (0, errorHandler_1.default)({
                message: 'Event not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: event,
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
exports.updateEvent = updateEvent;
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['events']
    try {
        const event = yield events_model_1.default.findByIdAndDelete(req.params.id);
        if (!event) {
            return (0, errorHandler_1.default)({
                message: 'Event not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: 'Event deleted successfully',
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
exports.deleteEvent = deleteEvent;
