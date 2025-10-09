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

      res.status(422).json(
        errorResponse('입력값 검증에 실패했습니다', 'VALIDATION_ERROR', details)
      );
      return;
    }

    next();
  };
}
