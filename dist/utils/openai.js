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
exports.generateAiResponse = exports.createThread = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../config/config.env' });
// Initialize OpenAI API
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
const createThread = () => __awaiter(void 0, void 0, void 0, function* () {
    const thread = yield openai.beta.threads.create();
    return thread.id;
});
exports.createThread = createThread;
const generateAiResponse = (threadId, prompt, tags) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const joinTags = tags.join(', ');
        const systemMessage = `You are knowledgeable only about ${joinTags}. Respond \"I am sorry have no idea\" other than the topics mentioned. Prompt: ${prompt}`;
        console.log('System message:', prompt);
        yield openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: [{ type: 'text', text: prompt }]
        });
        const response = yield openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID
        });
        let completed = false;
        let aiResponse = null;
        while (!completed) {
            // Wait for a short interval before checking status again
            yield new Promise((resolve) => setTimeout(resolve, 800));
            // Retrieve the status of the response
            const runInfo = yield openai.beta.threads.runs.retrieve(threadId, response.id);
            console.log('Run status:', runInfo.status);
            console.log('Run runInfo:', runInfo.id);
            // Check if the response has been completed
            if (runInfo.status === 'completed') {
                const messages = yield openai.beta.threads.messages.list(threadId);
                //@ts-ignore
                aiResponse = ((_c = (_b = (_a = messages.body.data[0]) === null || _a === void 0 ? void 0 : _a.content[0]) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.value) || null;
                completed = true;
            }
            else if (runInfo.status === 'failed' ||
                runInfo.status === 'cancelled') {
                throw new Error(`AI response failed or was cancelled. Status: ${runInfo.status}`);
            }
        }
        console.log('AI response:', aiResponse);
        return aiResponse;
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.generateAiResponse = generateAiResponse;
