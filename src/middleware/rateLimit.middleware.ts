import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
      code: 'RATE_LIMIT'
    });
  }
});

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiter(req, res, next);
};

export const createSensitiveRateLimitMiddleware = (
  max: number,
  windowMs = 60 * 1000
) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.user?._id?.toString() || req.ip,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many sensitive requests, please try again shortly.',
        code: 'RATE_LIMIT'
      });
    }
  });

export const createUserRateLimitMiddleware = (
  max: number,
  windowMs: number,
  message: string
) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.user?._id?.toString() || req.ip,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ success: false, message, code: 'RATE_LIMIT' });
    }
  });
