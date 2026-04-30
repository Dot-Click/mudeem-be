"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const apiError_1 = __importDefault(require("./utils/apiError"));
const index_1 = __importDefault(require("./routes/index"));
const logger_middleware_1 = __importDefault(require("./middleware/logger.middleware"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_output_json_1 = __importDefault(require("../swagger_output.json"));
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const passportLocal_config_1 = __importDefault(require("./config/passportLocal.config"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const userAgent_middleware_1 = require("./middleware/userAgent.middleware");
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
// --- 1. SETTINGS & CONSTANTS ---
const isProduction = process.env.NODE_ENV === 'production';
if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI is not defined in environment variables!');
}
// In Railway/Production, we must trust the proxy for secure cookies to work
if (isProduction || process.env.RAILWAY_STATIC_URL) {
    app.set('trust proxy', 1);
}
const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    // If we are on localhost, we don't need secure/none usually, 
    // but if we are hitting a remote backend, we DO.
    // We'll stick to secure/none as it's required for cross-domain cookies.
    secure: true,
    sameSite: 'none'
};
// --- 2. GLOBAL MIDDLEWARES (Order is crucial) ---
// CORS must be handled first, especially for pre-flight (OPTIONS)
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow any origin for debugging, while still supporting credentials
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
    credentials: true,
    optionsSuccessStatus: 200
}));
// Body Parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Logging
app.use(logger_middleware_1.default);
// Session Management
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'strong-secret-key',
    resave: false,
    proxy: true,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/mudeem', // Fallback to local to prevent crash
        stringify: false,
        mongoOptions: {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        }
    }),
    cookie: cookieOptions
}));
// Auth Middleware
app.use(passportLocal_config_1.default.initialize());
app.use(passportLocal_config_1.default.session());
app.use(userAgent_middleware_1.captureLastActive);
// --- 3. SECURITY MIDDLEWARES ---
app.use(rateLimit_middleware_1.rateLimitMiddleware);
app.use((0, helmet_1.default)({
    // Prevents Helmet from blocking resources across origins that we already allowed via CORS
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(helmet_1.default.noSniff());
app.use(helmet_1.default.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet_1.default.xssFilter());
app.use((0, express_mongo_sanitize_1.default)());
// --- 4. ROUTES ---
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_output_json_1.default));
// Application Routes
app.use('/', index_1.default);
// Default Route
app.get('/', (req, res) => {
    res.send('BE-boilerplate v1.1 - Up and Running');
});
// Health Check Route
app.get('/health', (_req, res) => {
    const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.status(200).json({
        status: 'UP',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});
// --- 5. ERROR HANDLING ---
// 404 Catch-all
app.use((req, res, next) => {
    next(new apiError_1.default(404, 'Not found'));
});
// Global Error Handler (Ensures CORS headers are preserved and errors are returned as JSON)
app.use((err, _req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message: message
    });
});
exports.default = app;
