import { Response } from 'express';
import {
  ErrorHandlerParams,
  ErrorHandlerFunction
} from '../types/generalTypes'; // Adjust the import path as needed
import logger from './logger';

const ErrorHandler: ErrorHandlerFunction = ({
  message,
  statusCode,
  req,
  res
}: ErrorHandlerParams): Response => {
  logger.error({
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    userId: req.user?._id?.toString() || null,
    ip: req.ip,
    date: new Date(),
    message: message
  });

  return res.status(statusCode).json({
    success: false,
    message: message
  });
};

export default ErrorHandler;
