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
const auth = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const schema = __importStar(require("../validations/auth.schema"));
const multer_middleware_1 = __importDefault(require("../middleware/multer.middleware"));
const router = express_1.default.Router();
// GET routes
router.route('/logout').get(auth.logout);
router
    .route('/me')
    .get(auth_middleware_1.isAuthenticated, auth.me)
    .put(auth_middleware_1.isAuthenticated, auth.updateProfile)
    .delete(auth_middleware_1.isAuthenticated, auth.deleteProfile);
// POST routes
router.route('/register-user').post((0, validate_middleware_1.validate)(schema.register), auth.register);
router.route('/login').post((0, validate_middleware_1.validate)(schema.login), auth.login);
router.route('/find-users').get(auth_middleware_1.isAuthenticated, auth.findUsers);
router
    .route('/requestEmailToken')
    .post((0, validate_middleware_1.validate)(schema.requestEmailToken), auth.requestEmailToken);
router
    .route('/verifyEmail')
    .post((0, validate_middleware_1.validate)(schema.verifyEmailToken), auth.verifyEmail);
router
    .route('/forgotPassword')
    .post((0, validate_middleware_1.validate)(schema.requestEmailToken), auth.forgotPassword);
// PUT routes
router
    .route('/resetPassword')
    .put((0, validate_middleware_1.validate)(schema.resetPassword), auth.resetPassword);
router
    .route('/updatePassword')
    .put(auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(schema.updatePassword), auth.updatePassword);
router.route('/deleteProfile/:id').delete(auth.deleteProfile);
router
    .route('/updateProfile')
    .put(auth_middleware_1.isAuthenticated, multer_middleware_1.default.single('profilePicture'), auth.updateProfile);
router.route('/push-notfications').put(auth_middleware_1.isAuthenticated, auth.pushNotification);
router.route('/green-points').put(auth_middleware_1.isAuthenticated, auth.greenPoints);
// DELETE routes
router
    .route('/removeSessions')
    .delete(auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(schema.removeSessions), auth.removeSessions);
// Toggle Notifications  routes
router
    .route('/toggle-notifications')
    .get(auth_middleware_1.isAuthenticated, auth.toggleNotifications);
exports.default = router;
