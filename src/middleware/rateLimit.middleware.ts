import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
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
    message: 'Too many sensitive requests, please try again shortly.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.user?._id?.toString() || req.ip
  });
