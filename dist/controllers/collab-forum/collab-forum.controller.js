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
exports.changePostStatus = exports.createReply = exports.likeUnlikeComment = exports.deleteComment = exports.createComment = exports.likeUnlikePost = exports.updatePost = exports.getPost = exports.getAllPosts = exports.createPost = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const mongoose_1 = __importDefault(require("mongoose"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const post_1 = __importDefault(require("../../models/collab-forum/post"));
const upload_1 = __importDefault(require("../../utils/upload"));
const comment_1 = __importDefault(require("../../models/collab-forum/comment"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const firebase_1 = require("../../utils/firebase");
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['collab-forum']
    try {
        const { content } = req.body;
        const user = req.user;
        // #swagger.parameters['req'] = {
        //   in: 'body',
        //   required: true
        //   schema: {
        //     $content: 'This is a post content',
        //     $images: ['image1.png', 'image2.png']
        //   }
        // }
        // if (!req.files || req.files.length === 0) {
        //   return ErrorHandler({
        //     message: 'Please upload at least one image',
        //     statusCode: 400,
        //     req,
        //     res
        //   });
        // }
        // const urls: string[] = await uploadFile(req.files as Express.Multer.File[]);
        let images = yield Promise.all(((_a = req === null || req === void 0 ? void 0 : req.files) === null || _a === void 0 ? void 0 : _a.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, upload_1.default)(item === null || item === void 0 ? void 0 : item.buffer);
            return result.secure_url;
        }))) || []);
        // Logic to create a post
        const post = yield post_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            content,
            // images: urls || []
            images: images
        });
        return (0, successHandler_1.default)({
            res,
            data: post,
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
exports.createPost = createPost;
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    var _a, _b;
    try {
        const { status = 'requested', page = 0, limit = 8, type } = req.query;
        const skip = Number(page) * Number(limit);
        let query = {};
        if (type === 'me') {
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
                const userId = new mongoose_1.default.Types.ObjectId((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
                query = {
                    user: userId,
                    status: 'accepted'
                };
            }
        }
        else if (type === 'others') {
            query = {
                status: 'accepted'
            };
        }
        else {
            query = {
                status: status
            };
        }
        const posts = yield post_1.default.aggregate([
            {
                $facet: {
                    totalDocs: [
                        {
                            $match: query
                            // $match: { status: status }
                        },
                        {
                            $count: 'count'
                        }
                    ],
                    posts: [
                        {
                            $match: query
                            // $match: { status: status }
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
                            $unwind: {
                                path: '$user',
                                preserveNullAndEmptyArrays: true // Avoid removing posts without a user match
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        {
                            $skip: Number(skip)
                        },
                        {
                            $limit: 8
                        }
                    ]
                }
            }
        ]);
        return (0, successHandler_1.default)({
            res,
            data: posts,
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
exports.getAllPosts = getAllPosts;
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    try {
        const { id } = req.params;
        // const post = await Post.findById(id)
        //   .populate('user', 'name email')
        //   .populate({
        //     path: 'comments',
        //     populate: [
        //       {
        //         path: 'user',
        //         select: 'name email'
        //       },
        //       {
        //         path: 'likes',
        //         select: 'name email'
        //       },
        //       {
        //         path: 'replies',
        //         populate: [
        //           {
        //             path: 'user',
        //             select: 'name email'
        //           },
        //           {
        //             path: 'likes',
        //             select: 'name email'
        //           }
        //         ]
        //       }
        //     ]
        //   })
        //   .populate('likes', 'name email');
        const post = yield post_1.default.aggregate([
            {
                $match: { _id: new mongoose_1.default.Types.ObjectId(id) }
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
                $unwind: { path: '$user' }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'comments',
                    foreignField: '_id',
                    as: 'comments'
                }
            },
            {
                $unwind: { path: '$comments', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'comments.user',
                    foreignField: '_id',
                    as: 'comments.user'
                }
            },
            {
                $unwind: { path: '$comments.user', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'comments.replies',
                    foreignField: '_id',
                    as: 'comments.replies'
                }
            },
            {
                $unwind: { path: '$comments.replies', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'comments.replies.user',
                    foreignField: '_id',
                    as: 'comments.replies.user'
                }
            },
            {
                $unwind: {
                    path: '$comments.replies.user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    content: { $first: '$content' },
                    status: { $first: '$status' },
                    images: { $first: '$images' },
                    likes: { $first: '$likes' },
                    comments: { $push: '$comments' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'likes',
                    foreignField: '_id',
                    as: 'likes'
                }
            }
        ]);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: post,
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
exports.getPost = getPost;
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    try {
        const { id } = req.params;
        const { content } = req.body;
        const user = req.user;
        const post = yield post_1.default.findById(id);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        if (post.user.toString() !== (user === null || user === void 0 ? void 0 : user._id.toString())) {
            return (0, errorHandler_1.default)({
                message: 'You are not authorized to perform this action',
                statusCode: 403,
                req,
                res
            });
        }
        if (req.files && req.files.length > 0) {
            // const urls: string[] = await uploadFile(req.files as Express.Multer.File[]);
            // post.images = urls;
        }
        post.content = content;
        yield post.save();
        return (0, successHandler_1.default)({
            res,
            data: post,
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
exports.updatePost = updatePost;
const likeUnlikePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    try {
        const { id } = req.params;
        const user = req.user;
        const post = yield post_1.default.findById(id);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        const isLiked = post.likes.includes(user === null || user === void 0 ? void 0 : user._id);
        const update = isLiked
            ? { $pull: { likes: user === null || user === void 0 ? void 0 : user._id } } // Remove user ID from likes
            : { $push: { likes: user === null || user === void 0 ? void 0 : user._id } }; // Add user ID to likes
        const updatedPost = yield post_1.default.findByIdAndUpdate(id, update, { new: true });
        // give green points
        if (!isLiked) {
            const user = yield user_model_1.default.findById(post.user);
            if (user) {
                user.greenPoints += 1;
                yield user.save();
                //notification
            }
        }
        return (0, successHandler_1.default)({
            res,
            data: updatedPost,
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
exports.likeUnlikePost = likeUnlikePost;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    try {
        const { id } = req.params;
        const { content } = req.body;
        const user = req.user;
        const post = yield post_1.default.findById(id);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Logic to create a comment
        const comment = yield comment_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            content
        });
        post.comments.push(comment._id);
        yield post.save();
        // give green points
        const postUser = yield user_model_1.default.findById(post.user);
        if (postUser) {
            postUser.greenPoints += 1;
            yield postUser.save();
            //notification
        }
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
    // #swagger.tags = ['collab-forum']
    try {
        const { id, commentId } = req.params;
        const user = req.user;
        const post = yield post_1.default.findById(id);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        const comment = yield comment_1.default.findById(commentId);
        if (!comment) {
            return (0, errorHandler_1.default)({
                message: 'Comment not found',
                statusCode: 404,
                req,
                res
            });
        }
        if (comment.user.toString() !== (user === null || user === void 0 ? void 0 : user._id.toString())) {
            return (0, errorHandler_1.default)({
                message: 'You are not authorized to perform this action',
                statusCode: 403,
                req,
                res
            });
        }
        yield comment.remove();
        post.comments = post.comments.filter((comm) => comm.toString() !== commentId);
        yield post.save();
        return (0, successHandler_1.default)({
            res,
            data: post,
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
    // #swagger.tags = ['collab-forum']
    try {
        const { id, commentId } = req.params;
        const user = req.user;
        const post = yield post_1.default.findById(id);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        const comment = yield comment_1.default.findById(commentId);
        if (!comment) {
            return (0, errorHandler_1.default)({
                message: 'Comment not found',
                statusCode: 404,
                req,
                res
            });
        }
        const isLiked = comment.likes.includes(user === null || user === void 0 ? void 0 : user._id);
        if (isLiked) {
            comment.likes = comment.likes.filter((like) => like.toString() !== (user === null || user === void 0 ? void 0 : user._id.toString()));
        }
        else {
            comment.likes.push(user === null || user === void 0 ? void 0 : user._id);
        }
        yield comment.save();
        return (0, successHandler_1.default)({
            res,
            data: comment,
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
    // #swagger.tags = ['collab-forum']
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;
        const user = req.user;
        const post = yield post_1.default.findById(id);
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Post not found',
                statusCode: 404,
                req,
                res
            });
        }
        const comment = yield comment_1.default.findById(commentId);
        if (!comment) {
            return (0, errorHandler_1.default)({
                message: 'Comment not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Logic to create a reply
        const reply = yield comment_1.default.create({
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
// admin apis
const changePostStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['collab-forum']
    try {
        const { id } = req.params;
        const { points = 0, status = 'requested' } = req.body;
        const post = yield post_1.default.findById(id).populate('user', 'name email');
        if (!post) {
            return (0, errorHandler_1.default)({
                message: 'Posts not found',
                statusCode: 404,
                req,
                res
            });
        }
        post.status = String(status);
        yield post.save();
        const user = yield user_model_1.default.findById(post === null || post === void 0 ? void 0 : post.user);
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        user.greenPoints =
            status === 'accepted'
                ? user.greenPoints + Number(points)
                : user.greenPoints;
        if (status === 'accepted') {
            user.greenPointsHistory.push({
                points: Number(points),
                reason: 'Post Approval',
                type: 'credit',
                date: new Date()
            });
            const token = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
            yield (0, firebase_1.sentPushNotification)(token, `Post Approved`, `Congratulations! You have earned ${points} green points for your Collaboration form approval.`, user._id.toString(), points.toString());
        }
        yield user.save();
        return (0, successHandler_1.default)({
            res,
            data: post,
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
exports.changePostStatus = changePostStatus;
