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
exports.createReply = exports.likeUnlikeComment = exports.deleteComment = exports.createComment = exports.likeUnlikeReel = exports.deleteReel = exports.getReel = exports.getReels = exports.createContent = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const upload_1 = __importDefault(require("../../utils/upload"));
const reel_1 = __importDefault(require("../../models/content-creator/reel"));
const reel_comment_1 = __importDefault(require("../../models/content-creator/reel-comment"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const firebase_1 = require("../../utils/firebase");
const reel_2 = __importDefault(require("../../models/content-creator/reel"));
const createContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    // #swagger.tags = ['content-creator']
    try {
        console.log("FILES:", req.files);
        console.log("BODY:", req.body);
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.subscriptions.contentCreator)) {
            return (0, errorHandler_1.default)({
                message: 'You need to subscribe to Content Creator to access this feature',
                statusCode: 403,
                req,
                res
            });
        }
        const { title, description } = req.body;
        const user = yield user_model_1.default.findById((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
        const userToken = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
        if (!(req === null || req === void 0 ? void 0 : req.files)) {
            return (0, errorHandler_1.default)({
                message: 'Files are required',
                statusCode: 400,
                req,
                res
            });
        }
        // @ts-ignore
        if (!((_c = req.files) === null || _c === void 0 ? void 0 : _c.thumbnail[0])) {
            return (0, errorHandler_1.default)({
                message: 'Thumbnail is required',
                statusCode: 400,
                req,
                res
            });
        }
        // @ts-ignore
        if (!((_d = req.files) === null || _d === void 0 ? void 0 : _d.video[0])) {
            return (0, errorHandler_1.default)({
                message: 'Video is required',
                statusCode: 400,
                req,
                res
            });
        }
        // @ts-ignore
        let videoLink = yield (0, upload_1.default)(req.files.video[0].buffer);
        // @ts-ignore
        let thumbnailLink = yield (0, upload_1.default)(req.files.thumbnail[0].buffer);
        const content = yield reel_2.default.create({
            user: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
            title,
            description,
            url: videoLink.secure_url,
            thumbnail: thumbnailLink.secure_url
        });
        const contentCreatorGreenPoints = 30;
        yield user_model_1.default.updateOne({ _id: (_f = req.user) === null || _f === void 0 ? void 0 : _f._id }, {
            $inc: { greenPoints: contentCreatorGreenPoints },
            $push: {
                greenPointsHistory: {
                    points: contentCreatorGreenPoints || 0,
                    reason: "Content Creator",
                    type: "credit",
                    date: new Date()
                }
            }
        });
        yield (0, firebase_1.sentPushNotification)(userToken, `Content Creator accepted`, `Congratulations! You have earned ${contentCreatorGreenPoints} green points for Content Creator.`, user === null || user === void 0 ? void 0 : user._id.toString(), contentCreatorGreenPoints.toString());
        return (0, successHandler_1.default)({
            res,
            data: { message: `Content created`, content },
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
exports.createContent = createContent;
const getReels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.subscriptions.contentCreator)) {
            return (0, errorHandler_1.default)({
                message: 'You need to subscribe to Content Creator to access this feature',
                statusCode: 403,
                req,
                res
            });
        }
        const reels = yield reel_1.default.find({
            user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id
        }).populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        });
        return (0, successHandler_1.default)({
            res,
            data: { reels },
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
exports.getReels = getReels;
const getReel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    var _a;
    try {
        const excludedIds = req.query.excludedIds
            ? (_a = req.query.excludedIds) === null || _a === void 0 ? void 0 : _a.split(',')
            : [];
        // get random reel except the excluded ones
        const reel = yield reel_1.default.aggregate([
            {
                $match: {
                    _id: {
                        $nin: excludedIds.map((id) => new mongoose_1.default.Types.ObjectId(id))
                    }
                }
            },
            { $sample: { size: 1 } },
            //   {
            //     $lookup: {
            //       from: 'users',
            //       localField: 'user',
            //       foreignField: '_id',
            //       as: 'userDetails'
            //     }
            //   },
            {
                $lookup: {
                    from: 'reelcomments',
                    localField: 'comments',
                    foreignField: '_id',
                    as: 'comments'
                }
            },
            // Unwind comments to process each comment separately
            {
                $unwind: {
                    path: '$comments',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup user details inside each comment
            {
                $lookup: {
                    from: 'users', // Assuming your user collection is named 'users'
                    localField: 'comments.user', // The user field inside each comment
                    foreignField: '_id',
                    as: 'comments.userDetails'
                }
            },
            // Flatten the userDetails array (since lookup returns an array)
            {
                $unwind: {
                    path: '$comments.userDetails',
                    preserveNullAndEmptyArrays: true // In case some comments don't have a user
                }
            },
            // Group comments back into an array
            {
                $group: {
                    _id: '$_id',
                    url: { $first: '$url' },
                    description: { $first: '$description' },
                    comments: { $push: '$comments' },
                    likes: { $first: '$likes' },
                    user: { $first: '$user' }
                }
            }
        ]);
        if (!reel.length) {
            return (0, errorHandler_1.default)({
                message: 'No reel found',
                statusCode: 404,
                req,
                res
            });
        }
        console.log(reel[0]);
        const user = yield user_model_1.default.findById(reel[0].user);
        reel[0].user = user;
        return (0, successHandler_1.default)({
            res,
            data: { reel },
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
exports.getReel = getReel;
const deleteReel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    try {
        const { id } = req.params;
        const reel = yield reel_1.default.findById(id);
        if (!reel) {
            return (0, errorHandler_1.default)({
                message: 'Reel not found',
                statusCode: 404,
                req,
                res
            });
        }
        yield reel.remove();
        return (0, successHandler_1.default)({
            res,
            data: { message: `Reel deleted` },
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
exports.deleteReel = deleteReel;
const likeUnlikeReel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    var _a;
    try {
        const { id } = req.params;
        const reel = yield reel_1.default.findById(id);
        let points = 0;
        if (!reel) {
            return (0, errorHandler_1.default)({
                message: 'Reel not found',
                statusCode: 404,
                req,
                res
            });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const hasLiked = reel.likes.includes(userId);
        if (hasLiked) {
            reel.likes = reel.likes.filter((like) => like.toString() !== userId.toString());
            points = -50;
        }
        else {
            reel.likes.push(userId);
            points = 50;
        }
        yield reel.save();
        yield user_model_1.default.updateOne({ _id: userId }, {
            $inc: { greenPoints: points },
            $push: {
                greenPointsHistory: {
                    points: points || 0,
                    reason: "Content moderation",
                    type: "debit",
                    date: new Date()
                }
            }
        });
        return (0, successHandler_1.default)({
            res,
            data: {
                message: `Reel ${reel.likes.includes(userId) ? 'liked' : 'unliked'}`,
                greenPoints: 50
            },
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
exports.likeUnlikeReel = likeUnlikeReel;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    try {
        const { id } = req.params;
        const { content } = req.body;
        const user = req.user;
        const reel = yield reel_1.default.findById(id);
        if (!reel) {
            return (0, errorHandler_1.default)({
                message: 'Reel not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Logic to create a comment
        const comment = yield reel_comment_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            content
        });
        reel.comments.push(comment._id);
        yield reel.save();
        return (0, successHandler_1.default)({
            res,
            data: comment,
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
exports.createComment = createComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    try {
        const { id, commentId } = req.params;
        const reel = yield reel_1.default.findById(id);
        if (!reel) {
            return (0, errorHandler_1.default)({
                message: 'Reel not found',
                statusCode: 404,
                req,
                res
            });
        }
        const comment = yield reel_comment_1.default.findById(commentId);
        if (!comment) {
            return (0, errorHandler_1.default)({
                message: 'Comment not found',
                statusCode: 404,
                req,
                res
            });
        }
        yield comment.remove();
        reel.comments = reel.comments.filter((comment) => comment.toString() !== commentId);
        yield reel.save();
        return (0, successHandler_1.default)({
            res,
            data: { message: `Comment deleted` },
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
exports.deleteComment = deleteComment;
const likeUnlikeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    var _a;
    try {
        const { id, commentId } = req.params;
        const reel = yield reel_1.default.findById(id);
        if (!reel) {
            return (0, errorHandler_1.default)({
                message: 'Reel not found',
                statusCode: 404,
                req,
                res
            });
        }
        const comment = yield reel_comment_1.default.findById(commentId);
        if (!comment) {
            return (0, errorHandler_1.default)({
                message: 'Comment not found',
                statusCode: 404,
                req,
                res
            });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (comment.likes.includes(userId)) {
            comment.likes = comment.likes.filter((like) => like.toString() !== userId);
        }
        else {
            comment.likes.push(userId);
        }
        yield comment.save();
        return (0, successHandler_1.default)({
            res,
            data: {
                message: `Comment ${comment.likes.includes(userId) ? 'liked' : 'unliked'}`
            },
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
exports.likeUnlikeComment = likeUnlikeComment;
const createReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['content-creator']
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const user = req.user;
        const reel = yield reel_1.default.findById(id);
        if (!reel) {
            return (0, errorHandler_1.default)({
                message: 'Reel not found',
                statusCode: 404,
                req,
                res
            });
        }
        const comment = yield reel_comment_1.default.findById(commentId);
        if (!comment) {
            return (0, errorHandler_1.default)({
                message: 'Comment not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Logic to create a reply
        const reply = yield reel_comment_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            content
        });
        comment.replies.push(reply._id);
        yield comment.save();
        return (0, successHandler_1.default)({
            res,
            data: reply,
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
exports.createReply = createReply;
