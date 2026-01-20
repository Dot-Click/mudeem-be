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
exports.deleteCategory = exports.updateCategory = exports.getCategory = exports.getAllCategories = exports.createCategory = void 0;
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const category_model_1 = __importDefault(require("../../models/shop/category.model"));
const upload_1 = __importDefault(require("../../utils/upload"));
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const { name, name_ar } = req.body;
        if (!req.file) {
            return (0, errorHandler_1.default)({
                message: 'Image is required',
                statusCode: 400,
                req,
                res
            });
        }
        // const urls: string[] = await uploadFile([req.file as Express.Multer.File]);
        let image = yield (0, upload_1.default)(req.file.buffer);
        const category = yield category_model_1.default.create({
            name,
            name_ar,
            image: image.secure_url
        });
        return (0, successHandler_1.default)({
            data: { message: `Category created`, category },
            statusCode: 201,
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
exports.createCategory = createCategory;
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const searchFilter = req.query.search
            ? { name: { $regex: req.query.search, $options: 'i' } }
            : {};
        const categories = yield category_model_1.default.find(Object.assign(Object.assign({}, searchFilter), { isActive: true }));
        return (0, successHandler_1.default)({
            data: categories,
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
exports.getAllCategories = getAllCategories;
const getCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const category = yield category_model_1.default.findById(req.params.id);
        if (!category) {
            return (0, errorHandler_1.default)({
                message: 'Category not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            data: category,
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
exports.getCategory = getCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const category = yield category_model_1.default.findById(req.params.id);
        if (!category) {
            return (0, errorHandler_1.default)({
                message: 'Category not found',
                statusCode: 404,
                req,
                res
            });
        }
        const { name, name_ar } = req.body;
        category.name = name;
        category.name_ar = name_ar;
        if (req.file) {
            let image = yield (0, upload_1.default)(req.file.buffer);
            // const urls: string[] = await uploadFile([req.file
            // as Express.Multer.File]);
            category.image = image.secure_url;
        }
        yield category.save();
        return (0, successHandler_1.default)({
            data: { message: 'Category updated', category },
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
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const category = yield category_model_1.default.findById(req.params.id);
        if (!category) {
            return (0, errorHandler_1.default)({
                message: 'Category not found',
                statusCode: 404,
                req,
                res
            });
        }
        category.isActive = false;
        yield category.save();
        return (0, successHandler_1.default)({
            data: { message: 'Category deleted' },
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
exports.deleteCategory = deleteCategory;
