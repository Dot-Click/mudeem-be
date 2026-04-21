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

const app = express();

// --- 1. SETTINGS & CONSTANTS ---
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://mudeem-admin-panel.vercel.app',
  'https://www.mudeem-admin-panel.vercel.app',
  // ADD THIS LINE:
  'https://mudeem-admin-panel-production.up.railway.app',
  // Also add your custom domain if you have one linked:
  'https://api.mudeem.ae'
];
if (isProduction) {
  app.set('trust proxy', 1); // Required for secure cookies behind proxies like Vercel/Nginx
}

const cookieOptions: CookieOptions = {
  maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  httpOnly: true,
  secure: isProduction, // true in production
  sameSite: isProduction ? 'none' : 'lax' // 'none' is mandatory for cross-site cookies (CORS + Cookies)
};

// --- 2. GLOBAL MIDDLEWARES (Order is crucial) ---

// CORS must be handled first, especially for pre-flight (OPTIONS)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
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
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      stringify: false,
      mongoOptions: {
        tls: true,
        tlsAllowInvalidCertificates: isProduction ? false : true,
        tlsAllowInvalidHostnames: isProduction ? false : true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000
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
  res.send('BE-boilerplate v1.1');
});

// --- 5. ERROR HANDLING ---

// 404 Catch-all
app.use((req: Request, res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'Not found'));
});

export default app;
