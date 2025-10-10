/**
 * Menu Validators
 * @description 식단 관련 입력 검증 스키마
 */

import Joi from 'joi';

/**
 * 식단 생성 검증 스키마
 */
export const createMenuSchema = Joi.object({
  siteId: Joi.string().uuid().required().messages({
    'string.guid': '유효한 사업장 ID를 입력해주세요',
    'any.required': '사업장 ID는 필수 항목입니다',
  }),
  startDate: Joi.date().iso().required().messages({
    'date.format': '유효한 시작일을 입력해주세요 (ISO 8601 형식)',
    'any.required': '시작일은 필수 항목입니다',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.format': '유효한 종료일을 입력해주세요 (ISO 8601 형식)',
    'date.min': '종료일은 시작일 이후여야 합니다',
    'any.required': '종료일은 필수 항목입니다',
  }),
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER')
    .required()
    .messages({
      'any.only': '식사 타입은 BREAKFAST, LUNCH, DINNER 중 하나여야 합니다',
      'any.required': '식사 타입은 필수 항목입니다',
    }),
  menuItems: Joi.string().allow('', null).optional().messages({
    'string.base': '메뉴 항목은 문자열이어야 합니다',
  }),
});

/**
 * 사업장 그룹 일괄 식단 생성 검증 스키마
 */
export const createMenuForGroupSchema = Joi.object({
  startDate: Joi.date().iso().required().messages({
    'date.format': '유효한 시작일을 입력해주세요 (ISO 8601 형식)',
    'any.required': '시작일은 필수 항목입니다',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.format': '유효한 종료일을 입력해주세요 (ISO 8601 형식)',
    'date.min': '종료일은 시작일 이후여야 합니다',
    'any.required': '종료일은 필수 항목입니다',
  }),
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER')
    .required()
    .messages({
      'any.only': '식사 타입은 BREAKFAST, LUNCH, DINNER 중 하나여야 합니다',
      'any.required': '식사 타입은 필수 항목입니다',
    }),
  menuItems: Joi.string().allow('', null).optional().messages({
    'string.base': '메뉴 항목은 문자열이어야 합니다',
  }),
});

/**
 * 식단 수정 검증 스키마
 */
export const updateMenuSchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.format': '유효한 시작일을 입력해주세요 (ISO 8601 형식)',
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.format': '유효한 종료일을 입력해주세요 (ISO 8601 형식)',
  }),
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER')
    .optional()
    .messages({
      'any.only': '식사 타입은 BREAKFAST, LUNCH, DINNER 중 하나여야 합니다',
    }),
  menuItems: Joi.string().allow('', null).optional().messages({
    'string.base': '메뉴 항목은 문자열이어야 합니다',
  }),
  deleteImage: Joi.boolean().optional().messages({
    'boolean.base': 'deleteImage는 boolean 값이어야 합니다',
  }),
}).min(1).messages({
  'object.min': '최소 하나의 필드는 수정해야 합니다',
});
