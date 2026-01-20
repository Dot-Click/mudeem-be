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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVendor = exports.isAdmin = exports.isAuthenticated = void 0;
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // return next();
    console.log("Query Params:", req.query);
    try {
        console.log((_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        if (req.isAuthenticated()) {
            return next();
        }
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.isAuthenticated = isAuthenticated;
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res
                .status(403)
                .json({ success: false, message: 'Not authorized' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.isAdmin = isAdmin;
const isVendor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'vendor') {
            return res
                .status(403)
                .json({ success: false, message: 'Not authorized' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.isVendor = isVendor;
