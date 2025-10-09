/**
 * Feedback Validators
 * @description 고객 피드백 관련 입력 검증 스키마
 */

import Joi from 'joi';

/**
 * 피드백 생성 검증 스키마
 */
export const createFeedbackSchema = Joi.object({
  siteId: Joi.string().uuid().required().messages({
    'string.guid': '유효한 사업장 ID를 입력해주세요',
    'any.required': '사업장 ID는 필수 항목입니다',
  }),
  authorType: Joi.string()
    .valid('STAFF', 'CLIENT')
    .required()
    .messages({
      'any.only': '작성자 타입은 STAFF 또는 CLIENT여야 합니다',
      'any.required': '작성자 타입은 필수 항목입니다',
    }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': '피드백 내용을 입력해주세요',
    'string.max': '피드백 내용은 최대 5000자까지 입력 가능합니다',
    'any.required': '피드백 내용은 필수 항목입니다',
  }),
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': '평점은 1 이상이어야 합니다',
    'number.max': '평점은 5 이하여야 합니다',
    'number.integer': '평점은 정수여야 합니다',
  }),
});

/**
 * 피드백 수정 검증 스키마
 */
export const updateFeedbackSchema = Joi.object({
  content: Joi.string().min(1).max(5000).optional().messages({
    'string.min': '피드백 내용을 입력해주세요',
    'string.max': '피드백 내용은 최대 5000자까지 입력 가능합니다',
  }),
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': '평점은 1 이상이어야 합니다',
    'number.max': '평점은 5 이하여야 합니다',
    'number.integer': '평점은 정수여야 합니다',
  }),
  status: Joi.string()
    .valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
    .optional()
    .messages({
      'any.only': '상태는 PENDING, IN_PROGRESS, RESOLVED, CLOSED 중 하나여야 합니다',
    }),
}).min(1).messages({
  'object.min': '최소 하나의 필드는 수정해야 합니다',
});

/**
 * 관리자 답변 검증 스키마
 */
export const replyFeedbackSchema = Joi.object({
  adminReply: Joi.string().min(1).max(5000).required().messages({
    'string.min': '답변 내용을 입력해주세요',
    'string.max': '답변 내용은 최대 5000자까지 입력 가능합니다',
    'any.required': '답변 내용은 필수 항목입니다',
  }),
});

/**
 * 상태 변경 검증 스키마
 */
export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
    .required()
    .messages({
      'any.only': '상태는 PENDING, IN_PROGRESS, RESOLVED, CLOSED 중 하나여야 합니다',
      'any.required': '상태는 필수 항목입니다',
    }),
});
