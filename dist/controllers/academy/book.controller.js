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
exports.downloadBook = exports.purchaseBook = exports.getMyBooks = exports.findIfAlreadyPurchased = exports.deleteBook = exports.updateBook = exports.getBook = exports.getAllBooks = exports.createBook = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const mongoose_1 = __importDefault(require("mongoose"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const upload_1 = __importDefault(require("../../utils/upload"));
const book_1 = __importDefault(require("../../models/academy/book"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const createBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { title, title_ar, description, description_ar, author, author_ar, pages, language, year, price, type, greenPoints, isPremium } = req.body;
        console.log(req.files);
        if (!(req === null || req === void 0 ? void 0 : req.files)) {
            return (0, errorHandler_1.default)({
                message: 'Thumbnail and Book file is required',
                statusCode: 400,
                req,
                res
            });
        }
        // @ts-ignore
        let thumbnail = yield (0, upload_1.default)(req.files.cover[0].buffer);
        // @ts-ignore
        let bookpdf = yield (0, upload_1.default)(req.files.book[0].buffer);
        const book = yield book_1.default.create({
            title,
            title_ar,
            description,
            description_ar,
            author,
            author_ar,
            pages,
            thumbnail: thumbnail.secure_url,
            content: bookpdf.secure_url,
            language,
            year,
            price,
            type,
            greenPoints,
            isPremium
        });
        return (0, successHandler_1.default)({
            res,
            data: book,
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
exports.createBook = createBook;
const getAllBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { page = 0, limit = 10 } = req.query;
        const skip = Number(page) * Number(limit);
        const filters = {};
        req.query.title &&
            (filters.title = { $regex: String(req.query.title), $options: 'i' });
        req.query.author &&
            (filters.author = { $regex: String(req.query.author), $options: 'i' });
        req.query.language && (filters.language = req.query.language);
        req.query.year && (filters.year = req.query.year);
        req.query.type &&
            (filters.price =
                req.query.type === 'premium' ? { $gt: 0 } : 0);
        req.query.type2 && (filters.type = req.query.type2);
        const books = yield book_1.default.find(filters)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        return (0, successHandler_1.default)({ res, data: books, statusCode: 200 });
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
exports.getAllBooks = getAllBooks;
const getBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, errorHandler_1.default)({
                message: 'Invalid book id',
                statusCode: 400,
                req,
                res
            });
        }
        const user = req.user;
        let book;
        console.log(user === null || user === void 0 ? void 0 : user.myBooks);
        if (user === null || user === void 0 ? void 0 : user.myBooks.includes(new mongoose_1.default.Types.ObjectId(id))) {
            book = yield book_1.default.findById(id);
        }
        else {
            book = yield book_1.default.findById(id).select('-content');
        }
        if (!book) {
            return (0, errorHandler_1.default)({
                message: 'Book not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({ res, data: book, statusCode: 200 });
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
exports.getBook = getBook;
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, errorHandler_1.default)({
                message: 'Invalid book id',
                statusCode: 400,
                req,
                res
            });
        }
        const book = yield book_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });
        if (!book) {
            return (0, errorHandler_1.default)({
                message: 'Book not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: book,
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
exports.updateBook = updateBook;
const deleteBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, errorHandler_1.default)({
                message: 'Invalid book id',
                statusCode: 400,
                req,
                res
            });
        }
        const book = yield book_1.default.findByIdAndDelete(id);
        if (!book) {
            return (0, errorHandler_1.default)({
                message: 'Book not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: { message: 'Book deleted' },
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
exports.deleteBook = deleteBook;
const getMyBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const user = req.user;
        const books = yield book_1.default.find({ _id: { $in: user === null || user === void 0 ? void 0 : user.myBooks } });
        return (0, successHandler_1.default)({ res, data: books, statusCode: 200 });
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
exports.getMyBooks = getMyBooks;
const findIfAlreadyPurchased = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { id } = req.params;
        // Validate book ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, errorHandler_1.default)({
                message: 'Invalid book id',
                statusCode: 400,
                req,
                res
            });
        }
        const user = req.user;
        // Check if user is authenticated
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'Unauthorized',
                statusCode: 401,
                req,
                res
            });
        }
        // Find the book
        const book = yield book_1.default.findById(id);
        // If the book is not found
        if (!book) {
            return (0, errorHandler_1.default)({
                message: 'Book not found in db',
                statusCode: 404,
                req,
                res
            });
        }
        // Check if the user has already purchased the book
        if (user.myBooks.includes(book._id)) {
            console.log('Book already purchased');
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Book already purchased' },
                statusCode: 200
            });
        }
        console.log('Book not purchased yet');
        // Optional: handle the case if the book is not purchased yet
        return (0, errorHandler_1.default)({
            message: 'Book not purchased yet', // Or redirect, or add further logic
            statusCode: 400,
            req,
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
exports.findIfAlreadyPurchased = findIfAlreadyPurchased;
const purchaseBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, errorHandler_1.default)({
                message: 'Invalid book id',
                statusCode: 400,
                req,
                res
            });
        }
        const user = req.user;
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'Unauthorized',
                statusCode: 401,
                req,
                res
            });
        }
        const book = yield book_1.default.findById(id);
        if (!book) {
            return (0, errorHandler_1.default)({
                message: 'Book not found',
                statusCode: 404,
                req,
                res
            });
        }
        if (user.myBooks.includes(book._id)) {
            return (0, errorHandler_1.default)({
                message: 'Book already purchased',
                statusCode: 400,
                req,
                res
            });
        }
        if (user.greenPoints < book.price) {
            return (0, errorHandler_1.default)({
                message: 'Insufficient green points',
                statusCode: 400,
                req,
                res
            });
        }
        yield user_model_1.default.findByIdAndUpdate(user._id, {
            $push: {
                myBooks: book._id,
                greenPointsHistory: {
                    points: book.greenPoints,
                    reason: 'Book Purchase',
                    type: 'credit',
                    date: Date.now()
                }
            },
            $inc: { greenPoints: -book.price + book.greenPoints }
        });
        var greenPointsHistory = {
            points: book.greenPoints,
            reason: 'Book Purchase',
            type: 'credit',
            date: Date.now()
        };
        return (0, successHandler_1.default)({
            res,
            data: { message: 'Book purchased successfully', greenPointsHistory },
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
exports.purchaseBook = purchaseBook;
const downloadBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['academy']
    try {
        return (0, successHandler_1.default)({
            res,
            data: { message: 'Book downloaded successfully' },
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
exports.downloadBook = downloadBook;
