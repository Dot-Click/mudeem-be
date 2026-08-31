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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const greenMapController = __importStar(require("../../controllers/green-map/green-map.controller"));
const schema = __importStar(require("../../validations/green-map.schema"));
const router = express_1.default.Router();
router
    .route('/')
    .post(
// isAuthenticated,
// isAdmin,
(0, validate_middleware_1.validate)(schema.createGreenMapPoint), greenMapController.createGreenMap)
    .get(greenMapController.getAllGreenMaps);
router
    .route('/:id')
    .get(greenMapController.getGreenMap)
    .put(auth_middleware_1.isAuthenticated, auth_middleware_1.isAdmin, (0, validate_middleware_1.validate)(schema.createGreenMapPoint), greenMapController.updateGreenMap)
    .delete(auth_middleware_1.isAuthenticated, auth_middleware_1.isAdmin, greenMapController.deleteGreenMap);
router
    .route('/reward/:id')
    .put(auth_middleware_1.isAuthenticated, greenMapController.rewardGreenMap);
exports.default = router;
