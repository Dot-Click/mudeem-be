"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const collabForumController = __importStar(require("../../controllers/collab-forum/collab-forum.controller"));
const schema = __importStar(require("../../validations/collab-forum.schema"));
const validate_middleware_1 = require("../../middleware/validate.middleware");
const multer_middleware_1 = __importDefault(require("../../middleware/multer.middleware"));
const router = express_1.default.Router();
router
    .route('/')
    .post(auth_middleware_1.isAuthenticated, multer_middleware_1.default.array('images', 5), (0, validate_middleware_1.validate)(schema.createUpdatePost), collabForumController.createPost)
    .get(collabForumController.getAllPosts);
router
    .route('/:id')
    .get(collabForumController.getPost)
    .put(auth_middleware_1.isAuthenticated, multer_middleware_1.default.array('images', 5), (0, validate_middleware_1.validate)(schema.createUpdatePost), collabForumController.updatePost);
router
    .route('/:id/like-unlike')
    .put(auth_middleware_1.isAuthenticated, collabForumController.likeUnlikePost);
router
    .route('/:id/comment')
    .post(auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(schema.createCommentReply), collabForumController.createComment);
router
    .route('/:id/comment/:commentId')
    .delete(auth_middleware_1.isAuthenticated, collabForumController.deleteComment);
router
    .route('/:id/comment/:commentId/like-unlike')
    .put(auth_middleware_1.isAuthenticated, collabForumController.likeUnlikeComment);
router
    .route('/:id/comment/:commentId/reply')
    .post(auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(schema.createCommentReply), collabForumController.createReply);
router
    .route('/changePostStatus/:id')
    .put(auth_middleware_1.isAuthenticated, auth_middleware_1.isAdmin, collabForumController.changePostStatus);
exports.default = router;
