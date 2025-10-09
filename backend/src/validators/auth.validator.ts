import Joi from 'joi';

/**
 * Register validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '유효한 이메일 주소를 입력해주세요',
    'any.required': '이메일은 필수 항목입니다',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '비밀번호는 최소 6자 이상이어야 합니다',
    'any.required': '비밀번호는 필수 항목입니다',
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': '이름은 최소 2자 이상이어야 합니다',
    'string.max': '이름은 최대 50자까지 입력 가능합니다',
    'any.required': '이름은 필수 항목입니다',
  }),
  phone: Joi.string()
    .pattern(/^010-\d{4}-\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)',
    }),
  role: Joi.string()
    .valid('SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF', 'CLIENT')
    .optional(),
  division: Joi.string().valid('HQ', 'YEONGNAM').optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '유효한 이메일 주소를 입력해주세요',
    'any.required': '이메일은 필수 항목입니다',
  }),
  password: Joi.string().required().messages({
    'any.required': '비밀번호는 필수 항목입니다',
  }),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': '현재 비밀번호는 필수 항목입니다',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': '새 비밀번호는 최소 6자 이상이어야 합니다',
    'any.required': '새 비밀번호는 필수 항목입니다',
  }),
});
