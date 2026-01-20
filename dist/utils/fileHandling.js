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
exports.deleteFile = exports.uploadFile = void 0;
const aws_config_1 = __importDefault(require("../config/aws.config"));
const errorHandler_1 = __importDefault(require("./errorHandler"));
const uploadFile = (files) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (files.length > 0) {
            return yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                const params = {
                    Bucket: process.env.AWS_BUCKET_NAME || '',
                    Key: `${Date.now()}-${file.originalname}`,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read'
                };
                yield aws_config_1.default.upload(params).promise();
                const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
                return url;
            })));
        }
        return [];
    }
    catch (error) {
        console.log(error);
        return [];
    }
});
exports.uploadFile = uploadFile;
const deleteFile = (url, req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = url.split('.com/')[1];
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME || '',
            Key: key
        };
        yield aws_config_1.default.deleteObject(params).promise();
        return true;
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
exports.deleteFile = deleteFile;
