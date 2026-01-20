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
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator_1.default.isEmail(value)) {
                throw new Error('Invalid Email');
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'vendor'],
        default: 'user'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: Number,
        default: null
    },
    emailVerificationTokenExpires: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: Number,
        default: null
    },
    passwordResetTokenExpires: {
        type: Date,
        default: null
    },
    firebaseToken: {
        type: String,
        default: null,
    },
    greenPoints: {
        type: Number,
        default: 0
    },
    greenPointsHistory: [{
            points: { type: Number, required: true },
            reason: { type: String },
            type: { type: String },
            date: { type: Date, default: Date.now }
        }],
    isActive: {
        type: Boolean,
        default: true
    },
    adminApproved: {
        type: Boolean,
        default: false
    },
    myBooks: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Book'
        }
    ],
    profilePicture: {
        type: String
    },
    allowNotifications: {
        type: Boolean,
        default: true,
        required: false
    },
    subscriptions: {
        sustainbuddyGPT: {
            type: Boolean,
            default: false
        },
        contentCreator: {
            type: Boolean,
            default: false
        }
    }
}, { timestamps: true });
// Hash password before saving
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return next();
        const salt = yield bcryptjs_1.default.genSalt(10);
        this.password = yield bcryptjs_1.default.hash(this.password, salt);
        next();
    });
});
// Compare password
userSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(enteredPassword, this.password);
    });
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
