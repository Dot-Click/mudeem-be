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
exports.deleteJob = exports.updateJob = exports.getAllJobs = exports.createJob = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const job_model_1 = __importDefault(require("../../models/careers/job.model"));
const createJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['careers']
    try {
        const { title, location, description, salary, company, jobType, linkedInUrl } = req.body;
        // if (!title || !location || !description || !salary || !company || !jobType || !linkedInUrl) {
        //   return ErrorHandler({
        //     message: 'All fields are required',
        //     statusCode: 400,
        //     req,
        //     res
        //   });
        // }
        // if (!req.file) {
        //   return ErrorHandler({
        //     message: 'Image is required',
        //     statusCode: 400,
        //     req,
        //     res
        //   });
        // }
        // @ts-ignore
        // const image = await uploadFile(req.file.buffer);
        const job = yield job_model_1.default.create({
            title,
            // image: image.secure_url,
            location,
            description,
            salary,
            company,
            jobType,
            linkedInUrl
        });
        return (0, successHandler_1.default)({
            res,
            data: job,
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
exports.createJob = createJob;
const getAllJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['careers']
    try {
        const jobs = yield job_model_1.default.find();
        return (0, successHandler_1.default)({
            res,
            data: jobs,
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
exports.getAllJobs = getAllJobs;
const updateJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req === null || req === void 0 ? void 0 : req.params;
        const { title, location, description, salary, company, linkedInUrl } = req.body;
        const isJobExist = yield job_model_1.default.findById(id);
        if (!isJobExist) {
            return (0, errorHandler_1.default)({
                message: 'Job not found',
                statusCode: 404,
                req,
                res
            });
        }
        isJobExist.title = title || isJobExist.title;
        isJobExist.company = company || isJobExist.company;
        isJobExist.location = location || isJobExist.location;
        isJobExist.salary = salary || isJobExist.salary;
        isJobExist.description = description || isJobExist.description;
        isJobExist.linkedInUrl = linkedInUrl || isJobExist.linkedInUrl;
        yield isJobExist.save();
        return (0, successHandler_1.default)({
            res,
            data: isJobExist,
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
exports.updateJob = updateJob;
const deleteJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req === null || req === void 0 ? void 0 : req.params;
        const isJobExist = yield job_model_1.default.findById(id);
        if (!isJobExist) {
            return (0, errorHandler_1.default)({
                message: 'Job not found',
                statusCode: 404,
                req,
                res
            });
        }
        yield isJobExist.delete();
        return (0, successHandler_1.default)({
            res,
            data: isJobExist,
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
exports.deleteJob = deleteJob;
