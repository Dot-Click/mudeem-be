import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import ApiError from './utils/apiError';
import router from './routes/index';
import loggerMiddleware from './middleware/logger.middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from '../swagger_output.json';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import passport from './config/passportLocal.config';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { captureLastActive } from './middleware/userAgent.middleware';
import { CookieOptions } from 'express-session';
import mongoose from 'mongoose';

const app = express();

// --- 1. SETTINGS & CONSTANTS ---
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in environment variables!');
}

// In Railway/Production, we must trust the proxy for secure cookies to work
if (isProduction || process.env.RAILWAY_STATIC_URL) {
  app.set('trust proxy', 1);
}

const cookieOptions: CookieOptions = {
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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin for debugging, while still supporting credentials
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(loggerMiddleware);

// Session Management
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'strong-secret-key',
    resave: false,
    proxy: true,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/mudeem', // Fallback to local to prevent crash
      stringify: false,
      mongoOptions: {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      }
    }),
    cookie: cookieOptions
  })
);

// Auth Middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(captureLastActive);

// --- 3. SECURITY MIDDLEWARES ---
app.use(rateLimitMiddleware);
app.use(
  helmet({
    // Prevents Helmet from blocking resources across origins that we already allowed via CORS
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.xssFilter());
app.use(mongoSanitize());

// --- 4. ROUTES ---

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Application Routes
app.use('/', router);

// Default Route
app.get('/', (req: Request, res: Response): void => {
  res.send('BE-boilerplate v1.1 - Up and Running');
});

// Health Check Route
app.get('/health', (_req: Request, res: Response): void => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// --- 5. ERROR HANDLING ---

// 404 Catch-all
app.use((req: Request, res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'Not found'));
});

// Global Error Handler (Ensures CORS headers are preserved and errors are returned as JSON)
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message
  });
});

export default app;
