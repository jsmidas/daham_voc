/**
 * MealPhoto Validators
 * @description 식사 사진 관련 입력 검증 스키마
 */

import Joi from 'joi';

/**
 * 식사 사진 생성 검증 스키마
 */
export const createMealPhotoSchema = Joi.object({
  siteId: Joi.string().uuid().required().messages({
    'string.guid': '유효한 사업장 ID를 입력해주세요',
    'any.required': '사업장 ID는 필수 항목입니다',
  }),
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')
    .optional()
    .messages({
      'any.only': '식사 타입은 BREAKFAST, LUNCH, DINNER, SNACK 중 하나여야 합니다',
    }),
  photoType: Joi.string()
    .valid('SERVING', 'LEFTOVER', 'FACILITY')
    .required()
    .messages({
      'any.only': '사진 타입은 SERVING, LEFTOVER, FACILITY 중 하나여야 합니다',
      'any.required': '사진 타입은 필수 항목입니다',
    }),
  capturedAt: Joi.date().iso().required().messages({
    'date.format': '유효한 촬영 시간을 입력해주세요 (ISO 8601 형식)',
    'any.required': '촬영 시간은 필수 항목입니다',
  }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    'number.min': '위도는 -90 이상이어야 합니다',
    'number.max': '위도는 90 이하여야 합니다',
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    'number.min': '경도는 -180 이상이어야 합니다',
    'number.max': '경도는 180 이하여야 합니다',
  }),
}).custom((value, helpers) => {
  // latitude와 longitude는 둘 다 있거나 둘 다 없어야 함
  const hasLat = value.latitude !== undefined;
  const hasLng = value.longitude !== undefined;

  if (hasLat !== hasLng) {
    return helpers.error('any.invalid', {
      message: '위도와 경도는 함께 제공되어야 합니다',
    });
  }

  return value;
});

/**
 * 식사 사진 수정 검증 스키마
 */
export const updateMealPhotoSchema = Joi.object({
  mealType: Joi.string()
    .valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')
    .optional()
    .messages({
      'any.only': '식사 타입은 BREAKFAST, LUNCH, DINNER, SNACK 중 하나여야 합니다',
    }),
  photoType: Joi.string()
    .valid('SERVING', 'LEFTOVER', 'FACILITY')
    .optional()
    .messages({
      'any.only': '사진 타입은 SERVING, LEFTOVER, FACILITY 중 하나여야 합니다',
    }),
  capturedAt: Joi.date().iso().optional().messages({
    'date.format': '유효한 촬영 시간을 입력해주세요 (ISO 8601 형식)',
  }),
  feedback: Joi.string().allow('', null).optional().messages({
    'string.base': '피드백은 문자열이어야 합니다',
  }),
}).min(1).messages({
  'object.min': '최소 하나의 필드는 수정해야 합니다',
});
