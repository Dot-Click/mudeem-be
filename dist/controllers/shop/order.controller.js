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
exports.reviewProduct = exports.updateOrderStatus = exports.getOrders = exports.createOrder = exports.checkout = void 0;
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const product_model_1 = __importDefault(require("../../models/shop/product.model"));
const variant_model_1 = __importDefault(require("../../models/shop/variant.model"));
const address_model_1 = __importDefault(require("../../models/user/address.model"));
const order_model_1 = __importDefault(require("../../models/shop/order.model"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const review_model_1 = __importDefault(require("../../models/shop/review.model"));
const checkout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['order']
    try {
        const { cart } = req.body;
        // Logic to checkout the cart
        Promise.all(cart.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            // Validate product availability
            const product = yield product_model_1.default.findOne({
                _id: item.product,
                isActive: true
            });
            if (!product) {
                throw new Error(`Product with id ${item.product} not found`);
            }
            if (!product.stock) {
                throw new Error(`Product with id ${item.product} is out of stock`);
            }
            // Validate variant availability and get the price
            const variant = yield variant_model_1.default.findOne({
                _id: item.variant,
                isActive: true
            });
            if (!variant) {
                throw new Error(`Variant with id ${item.variant} not found`);
            }
            if (variant.colors.findIndex((color) => color.color === item.color) === -1) {
                throw new Error(`Color ${item.color} not available for variant with id ${item.variant}`);
            }
            if (variant.sizes.findIndex((size) => size.size === item.size) === -1) {
                throw new Error(`Size ${item.size} not available for variant with id ${item.variant}`);
            }
            return {
                product: product,
                variant: variant,
                price: variant.price,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                total: variant.price * item.quantity,
                greenPoints: product.greenPointsPerUnit * item.quantity
            };
        })))
            .then((items) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const orderAmount = items.reduce((acc, item) => acc + item.total, 0);
            const deliveryCharge = 50;
            const totalAmount = orderAmount + deliveryCharge;
            const totalGreenPoints = items.reduce((acc, item) => acc + item.greenPoints, 0);
            if (req.body.address) {
                const exAddress = yield address_model_1.default.findOne({
                    user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
                });
                if (!exAddress) {
                    yield address_model_1.default.create(Object.assign({ user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }, req.body.address));
                }
                else {
                    yield address_model_1.default.updateOne({
                        user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id
                    }, {
                        $set: req.body.address
                    });
                }
            }
            const respData = {
                items,
                orderAmount,
                deliveryCharge,
                totalAmount,
                totalGreenPoints
            };
            return (0, successHandler_1.default)({
                res,
                data: respData,
                statusCode: 200
            });
        }))
            .catch((error) => {
            return (0, errorHandler_1.default)({
                message: error.message,
                statusCode: 400,
                req,
                res
            });
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
exports.checkout = checkout;
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // #swagger.tags = ['order']
    try {
        const { items, deliveryCharge, totalAmount, totalGreenPoints } = req.body;
        console.log('req.user?.greenPoints ', (_a = req.user) === null || _a === void 0 ? void 0 : _a.greenPoints, ' < ', parseInt(totalAmount), ' totalGreenPoints ', totalGreenPoints);
        if (((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.greenPoints) !== null && _c !== void 0 ? _c : 0) < parseInt(totalGreenPoints)) {
            return (0, errorHandler_1.default)({
                message: 'Insufficient green points',
                statusCode: 400,
                req,
                res
            });
        }
        let address = yield address_model_1.default.findOne({
            user: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id
        });
        if (!address) {
            if (!req.body.address) {
                return (0, errorHandler_1.default)({
                    message: 'Address is required',
                    statusCode: 400,
                    req,
                    res
                });
            }
            address = yield address_model_1.default.create(Object.assign({ user: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id }, req.body.address));
        }
        // Logic to create order
        const order = yield order_model_1.default.create({
            user: (_f = req.user) === null || _f === void 0 ? void 0 : _f._id,
            items,
            totalAmount,
            deliveryCharge,
            address,
            status: 'confirmed',
            totalGreenPoints,
            vendor: items[0].product.vendor
        });
        // @ts-ignore
        console.log((_g = req.user) === null || _g === void 0 ? void 0 : _g.greenPoints, totalAmount, totalGreenPoints);
        if ((_h = req.user) === null || _h === void 0 ? void 0 : _h.greenPoints) {
            yield user_model_1.default.updateOne({ _id: (_j = req.user) === null || _j === void 0 ? void 0 : _j._id }, {
                $set: {
                    greenPoints: req.user.greenPoints - totalAmount + totalGreenPoints
                },
                $push: {
                    greenPointsHistory: {
                        $each: [
                            {
                                points: totalGreenPoints,
                                reason: "Order placed",
                                type: "debit",
                                date: new Date()
                            },
                            {
                                points: 40,
                                reason: "Order placed",
                                type: "credit",
                                date: new Date()
                            }
                        ]
                    }
                }
            });
        }
        var greenPointsHistoryForResponse = {
            points: 40,
            type: 'credit',
            reason: 'Order placed'
        };
        return (0, successHandler_1.default)({
            res,
            data: {
                message: 'Order created successfully',
                greenPointsHistoryForResponse
            },
            statusCode: 200
        });
    }
    catch (error) {
        console.log(error);
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
});
exports.createOrder = createOrder;
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // #swagger.tags = ['order']
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        let orders = [];
        if (role === 'admin') {
            orders = yield order_model_1.default.find()
                .populate('user')
                .populate('items.product')
                .populate('items.variant')
                .populate('vendor');
        }
        else if (role === 'vendor') {
            orders = yield order_model_1.default.find({
                vendor: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id
            })
                .populate('user')
                .populate('items.product')
                .populate('items.variant');
        }
        else {
            orders = yield order_model_1.default.find({
                user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id
            })
                .populate('items.product')
                .populate('items.variant')
                .populate('vendor').sort({ createdAt: -1 });
        }
        return (0, successHandler_1.default)({
            res,
            data: orders,
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
exports.getOrders = getOrders;
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['order']
    try {
        const { orderId, status } = req.body;
        const order = yield order_model_1.default.findOne({
            _id: orderId
        });
        if (!order) {
            throw new Error(`Order with id ${orderId} not found`);
        }
        yield order_model_1.default.updateOne({
            _id: orderId
        }, {
            $set: {
                status
            }
        });
        return (0, successHandler_1.default)({
            res,
            data: {
                message: 'Order status updated successfully'
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
exports.updateOrderStatus = updateOrderStatus;
const reviewProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['order']
    try {
        const { orderId, productId, rating, review } = req.body;
        const order = yield order_model_1.default.findOne({
            _id: orderId
        });
        if (!order) {
            throw new Error(`Order with id ${orderId} not found`);
        }
        const product = yield product_model_1.default.findById(productId);
        if (!product) {
            throw new Error(`Product with id ${productId} not found`);
        }
        const checkIfReviewExists = yield review_model_1.default.findOne({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            product: productId,
            order: orderId
        });
        if (checkIfReviewExists) {
            return (0, errorHandler_1.default)({
                message: "You've already reviewed this product",
                statusCode: 400,
                req,
                res
            });
        }
        const createdReview = yield review_model_1.default.create({
            rating,
            review,
            user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            product: productId,
            order: orderId
        });
        console.log("Before update:", {
            stars: product.rating.stars,
            total: product.rating.total,
        });
        const totalRating = product.rating.stars * product.rating.total;
        product.rating.total += 1;
        product.rating.stars = (totalRating + parseFloat(rating)) / product.rating.total;
        console.log("After update:", {
            totalRating,
            stars: product.rating.stars,
            total: product.rating.total,
        });
        yield product.save();
        return (0, successHandler_1.default)({
            res,
            data: {
                message: 'Product reviewed successfully'
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
exports.reviewProduct = reviewProduct;
