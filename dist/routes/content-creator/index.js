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
const contentCreatorController = __importStar(require("../../controllers/content-creator/content-creator.controller"));
// import * as schema from '../../validations/content-creator.schema';
// import { validate } from '../../middleware/validate.middleware';
const multer_middleware_1 = __importDefault(require("../../middleware/multer.middleware"));
const router = express_1.default.Router();
router
    .route('/')
    .post(auth_middleware_1.isAuthenticated, multer_middleware_1.default.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), contentCreatorController.createContent)
    .get(contentCreatorController.getReel);
router
    .route('/get/my/reels')
    .get(auth_middleware_1.isAuthenticated, contentCreatorController.getReels);
router
    .route('/:id')
    .delete(auth_middleware_1.isAuthenticated, contentCreatorController.deleteReel);
router
    .route('/:id/like-unlike')
    .put(auth_middleware_1.isAuthenticated, contentCreatorController.likeUnlikeReel);
router
    .route('/:id/comment')
    .post(auth_middleware_1.isAuthenticated, contentCreatorController.createComment);
router
    .route('/:id/comment/:commentId')
    .delete(auth_middleware_1.isAuthenticated, contentCreatorController.deleteComment);
router
    .route('/:id/comment/:commentId/like-unlike')
    .put(auth_middleware_1.isAuthenticated, contentCreatorController.likeUnlikeComment);
router
    .route('/:id/comment/:commentId/reply')
    .post(auth_middleware_1.isAuthenticated, contentCreatorController.createReply);
exports.default = router;
