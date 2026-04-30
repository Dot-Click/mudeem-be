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
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const SendMail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, subject, text }) {
    const fromEmail = process.env.RESEND_SENDER_EMAIL || 'no-reply@email.mudeem.ae';
    try {
        const { data, error } = yield resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: subject,
            text: text,
        });
        if (error) {
            console.error('Email sending failed (Resend error):', error.message);
            throw error;
        }
        console.log('Email sent successfully via Resend SDK:', data === null || data === void 0 ? void 0 : data.id);
    }
    catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
});
exports.default = SendMail;
