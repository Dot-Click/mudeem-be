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
exports.deleteProduct = exports.updateProduct = exports.getProduct = exports.getAllProducts = exports.createProduct = void 0;
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const product_model_1 = __importDefault(require("../../models/shop/product.model"));
const variant_model_1 = __importDefault(require("../../models/shop/variant.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const upload_1 = __importDefault(require("../../utils/upload"));
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['product']
    console.log(req.body);
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { name, name_ar, description, description_ar, price, category, variants, greenPointsPerUnit, brand, brand_ar } = req.body;
        const jsonVariants = JSON.parse(variants);
        if (!req.files || ((_a = req.files) === null || _a === void 0 ? void 0 : _a.length) === 0) {
            return (0, errorHandler_1.default)({
                message: 'Image is required',
                statusCode: 400,
                req,
                res
            });
        }
        // const urls: string[] = await uploadFile([req.file as Express.Multer.File]);
        const variantsArray = yield variant_model_1.default.insertMany(jsonVariants, {
            session
        });
        const user = req.user;
        const images = yield Promise.all(req.files.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, upload_1.default)(item.buffer);
            return result.secure_url;
        })));
        const product = yield product_model_1.default.create([
            {
                name,
                name_ar,
                description,
                description_ar,
                price,
                category,
                images: images,
                variants: variantsArray.map((variant) => variant._id),
                greenPointsPerUnit,
                user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
                brand,
                brand_ar,
                featured: req.body.featured || false,
                vendor: (user === null || user === void 0 ? void 0 : user._id) || '6763ed1956b22e551b58a262'
            }
        ], { session });
        yield session.commitTransaction();
        return (0, successHandler_1.default)({
            data: { message: `Product created`, product },
            statusCode: 201,
            res
        });
    }
    catch (error) {
        yield session.abortTransaction();
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
    finally {
        session.endSession();
    }
});
exports.createProduct = createProduct;
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['product']
    try {
        const filters = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (req.query.category && { category: req.query.category })), (req.query.search && {
            name: { $regex: req.query.search, $options: 'i' }
        })), (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'vendor' && { role: { user: req.user._id } })), (req.query.vendorId && { role: { user: req.query.vendorId } })), (req.query.featured && { featured: true })), { isActive: true });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const products = yield product_model_1.default.find(filters)
            .populate('category')
            .populate({
            path: 'reviews',
            populate: {
                path: 'user'
            }
        })
            // .populate('user')
            // .populate('variants')
            .skip(skip)
            .limit(limit);
        return (0, successHandler_1.default)({
            data: products,
            statusCode: 200,
            res
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
exports.getAllProducts = getAllProducts;
const getProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['product']
    try {
        let reviewSort = {};
        if (req.query.sort === 'highest') {
            reviewSort = { 'rating.stars': -1 };
        }
        else if (req.query.sort === 'lowest') {
            reviewSort = { 'rating.stars': 1 };
        }
        else {
            reviewSort = { createdAt: -1 };
        }
        const product = yield product_model_1.default.findById(req.params.id)
            .populate('category')
            .populate('variants')
            .populate({
            path: 'reviews',
            populate: {
                path: 'user'
            }
        });
        // const product = await Product.aggregate([
        //   {
        //     $match: {
        //       _id: new mongoose.Types.ObjectId(req.params.id),
        //       isActive: true
        //     }
        //   },
        //   {
        //     $lookup: {
        //       from: 'variants',
        //       localField: 'variants',
        //       foreignField: '_id',
        //       as: 'variants'
        //     }
        //   },
        //   {
        //     $lookup: {
        //       from: 'categories',
        //       localField: 'category',
        //       foreignField: '_id',
        //       as: 'category'
        //     }
        //   },
        //   { $unwind: '$category' },
        //   {
        //     $lookup: {
        //       from: 'users',
        //       localField: 'user',
        //       foreignField: '_id',
        //       as: 'user'
        //     }
        //   },
        //   { $unwind: '$user' },
        //   {
        //     $lookup: {
        //       from: 'reviews',
        //       let: { productId: '$_id' },
        //       pipeline: [
        //         { $match: { $expr: { $eq: ['$product', '$$productId'] } } },
        //         { $sort: reviewSort },
        //         {
        //           $group: {
        //             _id: '$rating',
        //             count: { $sum: 1 }
        //           }
        //         }
        //       ],
        //       as: 'ratingBreakdown'
        //     }
        //   },
        //   {
        //     $lookup: {
        //       from: 'reviews',
        //       let: { productId: '$_id' },
        //       pipeline: [
        //         { $match: { $expr: { $eq: ['$product', '$$productId'] } } },
        //         { $sort: reviewSort }
        //       ],
        //       as: 'reviews'
        //     }
        //   },
        //   {
        //     $lookup: {
        //       from: 'users',
        //       localField: 'reviews.user',
        //       foreignField: '_id',
        //       as: 'reviews.user'
        //     }
        //   },
        //   {
        //     $addFields: {
        //       ratingBreakdown: {
        //         $arrayToObject: {
        //           $map: {
        //             input: '$ratingBreakdown',
        //             as: 'r',
        //             in: {
        //               k: { $concat: [{ $toString: '$$r._id' }, '-star'] },
        //               v: '$$r.count'
        //             }
        //           }
        //         }
        //       }
        //     }
        //   },
        //   {
        //     $project: {
        //       name: 1,
        //       description: 1,
        //       price: 1,
        //       category: 1,
        //       images: 1,
        //       variants: 1,
        //       greenPointsPerUnit: 1,
        //       user: 1,
        //       brand: 1,
        //       rating: 1,
        //       stock: 1,
        //       featured: 1,
        //       sold: 1,
        //       reviews: 1,
        //       ratingBreakdown: 1
        //     }
        //   }
        // ]);
        if (!product) {
            return (0, errorHandler_1.default)({
                message: 'Product not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            data: product,
            statusCode: 200,
            res
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
exports.getProduct = getProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['product']
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { name, name_ar, description, description_ar, price, category, updatedVariants = '[]', deletedVariants = '[]', newVariants = '[]', greenPointsPerUnit, brand, brand_ar, deletedImages = '[]' } = req.body;
        const product = yield product_model_1.default.findById(req.params.id);
        if (!product) {
            return (0, errorHandler_1.default)({
                message: 'Product not found',
                statusCode: 404,
                req,
                res
            });
        }
        const jsonVariants = JSON.parse(updatedVariants);
        const newVariantsArray = JSON.parse(newVariants);
        const deletedVariantsArray = JSON.parse(deletedVariants);
        const deletedImagesArray = JSON.parse(deletedImages);
        // handling updated variants
        if (jsonVariants.length > 0) {
            console.log(jsonVariants, 'jsonVariants');
            yield Promise.all(jsonVariants.map((variant) => __awaiter(void 0, void 0, void 0, function* () {
                if (variant._id) {
                    const updatedVariant = yield variant_model_1.default.findByIdAndUpdate(variant._id, variant, {
                        new: true,
                        session
                    });
                    console.log(updatedVariant, 'updatedVariant');
                    if (!updatedVariant) {
                        throw new Error('Variant not found');
                    }
                    return updatedVariant;
                }
            })));
        }
        // handling deleted variants
        if (deletedVariantsArray.length > 0) {
            console.log(deletedVariantsArray, 'deletedVariantsArray');
            yield variant_model_1.default.deleteMany({ _id: { $in: deletedVariantsArray } }, { session });
            product.variants = product.variants.filter((variant) => !deletedVariantsArray.includes(variant.toString()));
        }
        // handling new variants
        if (newVariantsArray.length > 0) {
            const newVariants = yield variant_model_1.default.insertMany(newVariantsArray, {
                session
            });
            newVariants.forEach((variant) => {
                product.variants.push(variant._id);
            });
        }
        // handling deleted images
        if (deletedImagesArray.length > 0) {
            // await deleteFile(deletedImagesArray[0], req, res);
            product.images = product.images.filter((image) => !deletedImagesArray.includes(image));
        }
        // handling new images
        if (req.files) {
            const images = yield Promise.all(req.files.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield (0, upload_1.default)(item.buffer);
                return result.secure_url;
            })));
            product.images.push(...images);
        }
        product.name = name;
        product.name_ar = name_ar;
        product.description = description;
        product.description_ar = description_ar;
        product.price = price;
        product.category = category;
        product.greenPointsPerUnit = greenPointsPerUnit;
        product.brand = brand;
        product.brand_ar = brand_ar;
        product.featured = req.body.featured
            ? JSON.parse(req.body.featured)
            : false;
        product.stock = req.body.stock ? JSON.parse(req.body.stock) : product.stock;
        console.log(product.variants, 'product');
        yield product.save({ session });
        console.log('here');
        yield session.commitTransaction();
        return (0, successHandler_1.default)({
            data: { message: 'Product updated' },
            statusCode: 201,
            res
        });
    }
    catch (error) {
        yield session.abortTransaction();
        yield session.endSession();
        console.log('here2');
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
    finally {
        yield session.endSession();
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['product']
    try {
        const product = yield product_model_1.default.findById(req.params.id);
        if (!product) {
            return (0, errorHandler_1.default)({
                message: 'Product not found',
                statusCode: 404,
                req,
                res
            });
        }
        product.isActive = false;
        yield product.save();
        return (0, successHandler_1.default)({
            data: { message: 'Product deleted' },
            statusCode: 200,
            res
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
exports.deleteProduct = deleteProduct;
