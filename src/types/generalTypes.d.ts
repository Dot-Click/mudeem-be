import { Request, Response } from 'express';
import { IUser } from './models/user';
import 'express-session';
import { File } from 'multer';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser | null;
    file?: File;
    files?: File[];
  }
}
declare module 'express-session' {
  interface SessionData {
    deviceInfo?: {
      browser: string | undefined;
      version: string | undefined;
      os: string | undefined;
    };
    lastActive?: Date;
  }
}

export interface SendMailParams {
  email: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SuccessHandlerParams<T> {
  data: T;
  statusCode: number;
  res: Response;
}

export interface ErrorHandlerParams {
  message: string;
  statusCode: number;
  req: Request;
  res: Response;
  /**
   * Optional stable identifier for the failure, e.g. 'DAILY_LIMIT'. Clients use
   * this instead of matching on `message`, so wording (and translation) can
   * change without breaking behaviour.
   */
  code?: string;
}

export type ErrorHandlerFunction = (params: ErrorHandlerParams) => Response;
export type SuccessHandlerFunction<T> = (
  params: SuccessHandlerParams<T>
) => Response;

export interface SwaggerDoc {
  info: {
    title: string;
    description: string;
    version: string;
  };
  host: string;
  basePath: string;
  schemes: string[];
  consumes: string[];
  produces: string[];
  tags: string[];
}
