"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_routes_1 = __importDefault(require("./product.routes"));
const category_routes_1 = __importDefault(require("./category.routes"));
const vendor_routes_1 = __importDefault(require("./vendor.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const banner_routes_1 = __importDefault(require("./banner.routes"));
const router = express_1.default.Router();
router.use('/vendor', vendor_routes_1.default);
router.use('/product', product_routes_1.default);
router.use('/category', category_routes_1.default);
router.use('/order', order_routes_1.default);
router.use('/banner', banner_routes_1.default);
exports.default = router;
