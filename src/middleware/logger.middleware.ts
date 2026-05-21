import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      userId: req.user?._id?.toString() || null,
      ip: req.ip,
      durationMs: Date.now() - startedAt,
      date: new Date(),
      message: 'Request completed'
    });
  });

  next();
};

export default loggerMiddleware;
