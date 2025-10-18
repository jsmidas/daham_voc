import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { errorResponse } from '../utils/api-response.util';

/**
 * Joi validation middleware
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      console.error('=== Validation Error ===');
      console.error('Request URL:', req.method, req.originalUrl);
      console.error('Request Body:', JSON.stringify(req.body, null, 2));
      console.error('Validation Details:', JSON.stringify(details, null, 2));

      res.status(422).json(
        errorResponse('입력값 검증에 실패했습니다', 'VALIDATION_ERROR', details)
      );
      return;
    }

    next();
  };
}
