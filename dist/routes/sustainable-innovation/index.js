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
const sustainableInnovationController = __importStar(require("../../controllers/sustainable-innovation/sustainable-innovation.controller"));
const schema = __importStar(require("../../validations/sustainable-innovation.schema"));
const validate_middleware_1 = require("../../middleware/validate.middleware");
const multer_middleware_1 = __importDefault(require("../../middleware/multer.middleware"));
const router = express_1.default.Router();
router
    .route('/')
    .post(auth_middleware_1.isAuthenticated, multer_middleware_1.default.array('documents', 5), (0, validate_middleware_1.validate)(schema.createProject), sustainableInnovationController.createProject)
    .get(
// isAuthenticated,
// isAdmin,
sustainableInnovationController.getAllProjects);
router
    .route('/:id')
    .get(auth_middleware_1.isAuthenticated, auth_middleware_1.isAdmin, sustainableInnovationController.getSingleProject)
    .put(
// isAuthenticated,
// isAdmin,
sustainableInnovationController.changeProjectStatus);
exports.default = router;
