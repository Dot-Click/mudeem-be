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
const nodemailer_1 = __importDefault(require("nodemailer"));
const { createTransport } = nodemailer_1.default;
const SendMail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, subject, text }) {
    try {
        const transport = createTransport(
        // nodemailerSendgrid({
        //   apiKey: process.env.NODEMAILER_API_KEY as string
        // })
        // smtp transport
        {
            host: 'smtp-relay.brevo.com',
            port: 587,
            // secure: false,
            auth: {
                user: '83cabe001@smtp-brevo.com',
                pass: 'KmMhxqWg5HwUEv0B'
            }
        });
        const mailOptions = {
            from: 'mudeemsustainapp@gmail.com',
            to: email,
            subject,
            text
        };
        yield transport.sendMail(mailOptions);
    }
    catch (error) {
        console.error(error);
    }
});
exports.default = SendMail;
