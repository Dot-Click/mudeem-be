"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
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
const app = (0, express_1.default)();
const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    sameSite: 'lax',
    secure: false
};
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    cookieOptions.secure = true; // serve secure cookies
    cookieOptions.sameSite = 'none'; // serve secure cookies
}
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.FE_URL || `http://localhost:3000`,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));
app.options(process.env.FE_URL || `http://localhost:3000`, (0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(logger_middleware_1.default);
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGO_URI,
        stringify: false
    }),
    cookie: cookieOptions
}));
app.use(passportLocal_config_1.default.initialize());
app.use(passportLocal_config_1.default.session());
app.use(userAgent_middleware_1.captureLastActive); // Capture last active time of user
// Security Middlewares
app.use(rateLimit_middleware_1.rateLimitMiddleware);
app.use((0, helmet_1.default)());
app.use(helmet_1.default.noSniff()); // Prevent MIME-type sniffing
app.use(helmet_1.default.referrerPolicy({ policy: 'no-referrer' })); // Prevent Referrer-Policy
app.use(helmet_1.default.xssFilter()); // Prevent Cross-Site Scripting (XSS)
app.use((0, express_mongo_sanitize_1.default)()); // Prevent NoSQL Injection
// router index
app.use('/', index_1.default);
// api doc
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_output_json_1.default));
// default route
app.get('/', (req, res) => {
    res.send('BE-boilerplate v1.1');
});
// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new apiError_1.default(404, 'Not found'));
});
exports.default = app;
