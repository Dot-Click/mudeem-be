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
exports.getChat = exports.sendMessage = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const chat_model_1 = __importDefault(require("../../models/gpt/chat.model"));
const openai_1 = require("../../utils/openai");
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // #swagger.tags = ['gpt']
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.subscriptions.sustainbuddyGPT)) {
            return (0, errorHandler_1.default)({
                message: 'You need to subscribe to SustainBuddy GPT to access this feature',
                statusCode: 403,
                req,
                res
            });
        }
        const exChat = yield chat_model_1.default.findOne({
            user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id
        });
        if (!exChat) {
            const thread = yield (0, openai_1.createThread)();
            const messageText = yield (0, openai_1.generateAiResponse)(thread, req.body.message, [
                'environment',
                'greenry'
            ]);
            const pattern = /【\d+:\d+†source】/g;
            const response = messageText === null || messageText === void 0 ? void 0 : messageText.replace(pattern, ''); // remove source
            let initialMessages = [];
            initialMessages.push({ sender: 'user', content: req.body.message });
            initialMessages.push({ sender: 'bot', content: response });
            const chat = yield chat_model_1.default.create({
                user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
                messages: initialMessages,
                thread
            });
            return (0, successHandler_1.default)({
                res,
                data: { response },
                statusCode: 201
            });
        }
        else {
            // gpt prompt
            const messageText = yield (0, openai_1.generateAiResponse)(exChat.thread, req.body.message, ['environment', 'greenry']);
            const pattern = /【\d+:\d+†source】/g;
            const response = messageText === null || messageText === void 0 ? void 0 : messageText.replace(pattern, ''); // remove source
            //@ts-ignore
            exChat.messages.push({ sender: 'user', content: req.body.message });
            //@ts-ignore
            exChat.messages.push({ sender: 'bot', content: response });
            yield exChat.save();
            return (0, successHandler_1.default)({
                res,
                data: { chat: response },
                statusCode: 200
            });
        }
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
exports.sendMessage = sendMessage;
const getChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['gpt']
    try {
        const chat = yield chat_model_1.default.findOne({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        });
        if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b.subscriptions.sustainbuddyGPT)) {
            return (0, errorHandler_1.default)({
                message: 'You need to subscribe to SustainBuddy GPT to access this feature',
                statusCode: 403,
                req,
                res
            });
        }
        if (!chat) {
            return (0, errorHandler_1.default)({
                message: 'Chat not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: { chat: chat },
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
exports.getChat = getChat;
