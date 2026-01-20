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
exports.changeProjectStatus = exports.getSingleProject = exports.getAllProjects = exports.createProject = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const upload_1 = __importDefault(require("../../utils/upload"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const project_1 = __importDefault(require("../../models/sustainable-innovation/project"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const firebase_1 = require("../../utils/firebase");
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['sustainble-innovation']
    try {
        const { title, description } = req.body;
        const user = req.user;
        let images = yield Promise.all(((_a = req === null || req === void 0 ? void 0 : req.files) === null || _a === void 0 ? void 0 : _a.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, upload_1.default)(item === null || item === void 0 ? void 0 : item.buffer);
            return result.secure_url;
        }))) || []);
        const project = yield project_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            title,
            description,
            // images: urls || []
            documents: images
        });
        return (0, successHandler_1.default)({
            res,
            data: project,
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
exports.createProject = createProject;
const getAllProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['sustainble-innovation']
    try {
        const { page = 0, limit = 10 } = req.query;
        const skip = Number(page) * Number(limit);
        const project = yield project_1.default.aggregate([
            {
                $facet: {
                    totalDocs: [
                        {
                            $match: { status: 'requested' }
                        },
                        {
                            $count: 'count'
                        }
                    ],
                    projects: [
                        {
                            $match: {
                                status: 'requested'
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {
                            $unwind: '$user'
                        },
                        {
                            $skip: skip
                        },
                        {
                            $limit: Number(limit)
                        },
                        {
                            $sort: {
                                createdAt: -1
                            }
                        }
                    ]
                }
            }
        ]);
        return (0, successHandler_1.default)({
            res,
            data: project,
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
exports.getAllProjects = getAllProjects;
const getSingleProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['sustainble-innovation']
    try {
        const { id } = req.params;
        const project = yield project_1.default.findById(id).populate('user');
        return (0, successHandler_1.default)({
            res,
            data: project,
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
exports.getSingleProject = getSingleProject;
const changeProjectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['sustainble-innovation']
    var _a;
    try {
        const { id } = req.params;
        const { points = 0, status = 'requested' } = req.body;
        const project = yield project_1.default.findById(id).populate('user', 'name email');
        if (!project) {
            return (0, errorHandler_1.default)({
                message: 'Posts not found',
                statusCode: 404,
                req,
                res
            });
        }
        project.status = String(status);
        yield project.save();
        const user = yield user_model_1.default.findById(project === null || project === void 0 ? void 0 : project.user);
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        yield user_model_1.default.updateOne({ _id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, {
            $inc: { greenPoints: points },
            $push: {
                greenPointsHistory: {
                    points: points || 0,
                    reason: "Sustainable Innovation",
                    type: "credit",
                    date: new Date()
                }
            }
        });
        const token = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
        yield (0, firebase_1.sentPushNotification)(token, `Sustainable Innovation accepted`, `Congratulations! You have earned ${points} green points for Sustainable Innovation.`, user._id.toString(), points.toString());
        return (0, successHandler_1.default)({
            res,
            data: project,
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
exports.changeProjectStatus = changeProjectStatus;
