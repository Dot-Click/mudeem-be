import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';

type ValidationSource = 'body' | 'query' | 'params';

export const validate = (schema: AnySchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const { error, value } = schema.validate(data);

    if (error) {
      return res.status(400).json({
        success: 'false',
        message: error.details[0].message
      });
    }

    req[source] = value;
    next();
  };
};
