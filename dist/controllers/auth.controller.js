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
exports.deleteProfile = exports.pushNotification = exports.findUsers = exports.updateProfile = exports.removeSessions = exports.updatePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.me = exports.login = exports.verifyEmail = exports.requestEmailToken = exports.register = exports.greenPoints = exports.toggleNotifications = void 0;
const user_model_1 = __importDefault(require("../models/user/user.model"));
const successHandler_1 = __importDefault(require("../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const passport_1 = __importDefault(require("passport"));
const userAgent_middleware_1 = require("../middleware/userAgent.middleware");
const mongoose_1 = __importDefault(require("mongoose"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const upload_1 = __importDefault(require("../utils/upload"));
const firebase_1 = require("../utils/firebase");
const pushNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, body } = req.body;
        const user = req.user;
        const token = user.firebaseToken || '';
        (0, firebase_1.sentPushNotification)(token, title, body, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString(), '0');
        return (0, successHandler_1.default)({
            data: 'Push notification sent successfully',
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
exports.pushNotification = pushNotification;
const findUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        if (!req.query.name) {
            return (0, errorHandler_1.default)({
                message: "Name can't be empty.",
                statusCode: 400,
                req,
                res
            });
        }
        const query = req.query.name;
        // const filters = {
        //   $or: [
        //     { name: { $regex: new RegExp(query, 'i') } },
        //     { email: { $regex: new RegExp(query, 'i') } },
        //     { username: { $regex: new RegExp(query, 'i') } }
        //   ]
        // };
        // the below one is more restrictive
        const filters = {
            $or: [
                { name: { $regex: `^${query}`, $options: 'i' } },
                { email: { $regex: `^${query}`, $options: 'i' } },
                { username: { $regex: `^${query}`, $options: 'i' } }
            ]
        };
        const users = yield user_model_1.default.find(filters);
        return (0, successHandler_1.default)({
            data: users,
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
exports.findUsers = findUsers;
//register
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { name, email, phone, username, password, role } = req.body;
        if (role === 'admin') {
            return (0, errorHandler_1.default)({
                message: 'Unauthorized',
                statusCode: 401,
                req,
                res
            });
        }
        const user = yield user_model_1.default.findOne({
            $or: [{ email }, { username }, { phone }]
        });
        if (user) {
            let conflictField = '';
            if (user.email === email) {
                conflictField = 'Email';
            }
            if (user.username === username) {
                conflictField = 'Username';
            }
            if (user.phone === phone) {
                conflictField = 'Phone';
            }
            return (0, errorHandler_1.default)({
                message: `${conflictField} already exists`,
                statusCode: 400,
                req,
                res
            });
        }
        const newUser = yield user_model_1.default.create({
            name,
            email,
            phone,
            username,
            password,
            role
        });
        if (!newUser) {
            return (0, errorHandler_1.default)({
                message: 'Failed to create user',
                statusCode: 500,
                req,
                res
            });
        }
        newUser.save();
        (0, successHandler_1.default)({
            data: newUser,
            statusCode: 201,
            res
        });
        if (role === 'vendor') {
            const admins = yield user_model_1.default.find({ role: 'admin' });
            admins.forEach((admin) => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, sendMail_1.default)({
                    email: admin.email,
                    subject: 'New Vendor Registered',
                    text: `A new vendor with the store ${username} has registered.`
                });
            }));
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
exports.register = register;
//request email verification token
const requestEmailToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { email } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User does not exist',
                statusCode: 400,
                req,
                res
            });
        }
        const emailVerificationToken = Math.floor(100000 + Math.random() * 900000);
        const emailVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationTokenExpires = emailVerificationTokenExpires;
        yield user.save();
        const message = `Your email verification token is ${emailVerificationToken} and it expires in 10 minutes`;
        const subject = `Email verification token`;
        yield (0, sendMail_1.default)({
            email,
            subject,
            text: message
        });
        return (0, successHandler_1.default)({
            data: `Email verification token sent to ${email}`,
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
exports.requestEmailToken = requestEmailToken;
//verify email token
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { email, emailVerificationToken } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist'
            });
        }
        if (user.emailVerificationToken !== emailVerificationToken ||
            !user.emailVerificationTokenExpires || // Check if it exists
            user.emailVerificationTokenExpires.getTime() < Date.now() // Compare timestamps
        ) {
            return (0, errorHandler_1.default)({
                message: 'Invalid token',
                statusCode: 400,
                req,
                res
            });
        }
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationTokenExpires = undefined;
        yield user.save();
        return (0, successHandler_1.default)({
            data: {
                message: 'Email verified successfully'
            },
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
exports.verifyEmail = verifyEmail;
//login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { email, password, firebaseToken } = req.body;
        console.log(email, password);
        //@ts-expect-error passport.authenticate has no return type
        passport_1.default.authenticate('local', (err, user, info) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                return (0, errorHandler_1.default)({
                    message: err.message,
                    statusCode: 500,
                    req,
                    res
                });
            }
            if (!user) {
                return (0, errorHandler_1.default)({
                    message: info.message,
                    statusCode: 400,
                    req,
                    res
                });
            }
            if (!user.emailVerified) {
                return (0, errorHandler_1.default)({
                    message: 'Email not verified',
                    statusCode: 400,
                    req,
                    res
                });
            }
            if (!user.isActive) {
                return (0, errorHandler_1.default)({
                    message: 'User has been deactivated',
                    statusCode: 400,
                    req,
                    res
                });
            }
            if (user.role === 'vendor' && !user.adminApproved) {
                return (0, errorHandler_1.default)({
                    message: 'Vendor not approved by admin',
                    statusCode: 400,
                    req,
                    res
                });
            }
            if (firebaseToken) {
                const updatedUser = yield user_model_1.default.findOneAndUpdate({ _id: user._id }, // Find by ID
                { firebaseToken }, // Update the field
                { new: true, runValidators: true } // Return updated user & validate
                );
            }
            req.logIn(user, (err) => {
                if (err) {
                    return (0, errorHandler_1.default)({
                        message: err.message,
                        statusCode: 500,
                        req,
                        res
                    });
                }
                (0, userAgent_middleware_1.captureUserAgent)(req, res, () => {
                    return res.status(200).json({
                        message: 'Login successful',
                        user: user
                    });
                });
            });
        }))(req, res);
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
exports.login = login;
//logout
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        req.logout((err) => {
            if (err) {
                return (0, errorHandler_1.default)({
                    message: err.message,
                    statusCode: 500,
                    req,
                    res
                });
            }
            req.session.destroy(() => {
                return (0, successHandler_1.default)({
                    data: 'Logged out successfully',
                    statusCode: 200,
                    res
                });
            });
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
exports.logout = logout;
//forgot password
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { email } = req.body;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User does not exist',
                statusCode: 400,
                req,
                res
            });
        }
        const passwordResetToken = Math.floor(100000 + Math.random() * 900000);
        const passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.passwordResetToken = passwordResetToken;
        user.passwordResetTokenExpires = passwordResetTokenExpires;
        yield user.save();
        const message = `Your password reset token is ${passwordResetToken} and it expires in 10 minutes`;
        const subject = `Password reset token`;
        yield (0, sendMail_1.default)({ email, subject, text: message });
        return (0, successHandler_1.default)({
            data: `Password reset token sent to ${email}`,
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
exports.forgotPassword = forgotPassword;
//reset password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    var _a;
    try {
        const { email, passwordResetToken, password } = req.body;
        const user = yield user_model_1.default.findOne({ email }).select('+password');
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User does not exist',
                statusCode: 400,
                req,
                res
            });
        }
        if (user.passwordResetToken !== passwordResetToken ||
            !user.passwordResetTokenExpires || // Check if it exists
            ((_a = user.passwordResetTokenExpires) === null || _a === void 0 ? void 0 : _a.getTime()) < Date.now()) {
            return (0, errorHandler_1.default)({
                message: 'Invalid token',
                statusCode: 400,
                req,
                res
            });
        }
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        yield user.save();
        return (0, successHandler_1.default)({
            data: 'Password reset successfully',
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
exports.resetPassword = resetPassword;
//update password
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['auth']
    try {
        const { currentPassword, newPassword } = req.body;
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).select('+password');
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User does not exist',
                statusCode: 400,
                req,
                res
            });
        }
        const isMatch = yield (user === null || user === void 0 ? void 0 : user.comparePassword(currentPassword));
        if (!isMatch) {
            return (0, errorHandler_1.default)({
                message: 'Invalid credentials',
                statusCode: 400,
                req,
                res
            });
        }
        const samePasswords = yield (user === null || user === void 0 ? void 0 : user.comparePassword(newPassword));
        if (samePasswords) {
            return (0, errorHandler_1.default)({
                message: 'New password cannot be the same as the current password',
                statusCode: 400,
                req,
                res
            });
        }
        user.password = newPassword;
        yield user.save();
        return (0, successHandler_1.default)({
            data: 'Password updated successfully',
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
exports.updatePassword = updatePassword;
//me
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['auth']
    try {
        const user = req.user;
        const sessions = (yield mongoose_1.default.connection.db
            .collection('sessions')
            .find({
            'session.passport.user': user === null || user === void 0 ? void 0 : user._id.toString()
        })
            .toArray());
        return (0, successHandler_1.default)({
            data: {
                user,
                sessions: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin'
                    ? {}
                    : sessions.map((session) => ({
                        _id: session._id,
                        deviceInfo: session.session.deviceInfo,
                        lastActive: session.session.lastActive,
                        current: session._id === req.sessionID
                    }))
            },
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
exports.me = me;
const removeSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { sessionIds } = req.body;
        const user = req.user;
        yield mongoose_1.default.connection.db.collection('sessions').deleteMany({
            _id: { $in: sessionIds },
            'session.passport.user': user === null || user === void 0 ? void 0 : user._id.toString()
        });
        // if current session is removed, destroy it
        if (sessionIds.includes(req.sessionID)) {
            req.logout((err) => {
                if (err) {
                    throw new Error(err.message);
                }
                req.session.destroy((err) => {
                    if (err) {
                        throw new Error(err.message);
                    }
                });
            });
        }
        return (0, successHandler_1.default)({
            data: 'Sessions removed successfully',
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
exports.removeSessions = removeSessions;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, phone, username } = req.body;
        let link;
        if (req.file) {
            link = yield (0, upload_1.default)(req.file.buffer);
        }
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (phone)
            user.phone = phone;
        if (username)
            user.username = username;
        if (link)
            user.profilePicture = link.secure_url;
        user.save();
        return (0, successHandler_1.default)({
            data: { user: user, message: 'User successfully updated' },
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
exports.updateProfile = updateProfile;
const greenPoints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const { userId, reason, points, type } = req.body;
        if (!userId) {
            return (0, errorHandler_1.default)({
                message: 'User ID is required',
                statusCode: 400,
                req,
                res
            });
        }
        yield user_model_1.default.updateOne({
            _id: userId
        }, {
            $inc: {
                greenPoints: points || 0
            },
            $push: {
                greenPointsHistory: {
                    points: points || 0,
                    reason: reason,
                    type: type
                }
            }
        });
        return (0, successHandler_1.default)({
            data: 'Points successfully updated',
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
exports.greenPoints = greenPoints;
const toggleNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['auth']
    try {
        const user = req.user;
        const findUser = yield user_model_1.default.findById(user._id);
        if (!findUser) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        findUser.allowNotifications = !findUser.allowNotifications;
        const resss = yield findUser.save();
        console.log(resss);
        return (0, successHandler_1.default)({
            data: 'Notification successfully updated',
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
exports.toggleNotifications = toggleNotifications;
const deleteProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findOne({ _id: id, role: 'user' });
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        yield user.delete();
        return (0, successHandler_1.default)({
            data: { user: user, message: 'User successfully updated' },
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
exports.deleteProfile = deleteProfile;
