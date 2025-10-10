/**
 * Attendance Validators
 * @description 출퇴근 관련 입력 검증 스키마
 */

import Joi from 'joi';

/**
 * 체크인 검증 스키마
 */
export const checkInSchema = Joi.object({
  siteId: Joi.string().uuid().required().messages({
    'string.guid': '유효한 사업장 ID를 입력해주세요',
    'any.required': '사업장 ID는 필수 항목입니다',
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': '위도는 -90 이상이어야 합니다',
    'number.max': '위도는 90 이하여야 합니다',
    'any.required': '위도는 필수 항목입니다',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': '경도는 -180 이상이어야 합니다',
    'number.max': '경도는 180 이하여야 합니다',
    'any.required': '경도는 필수 항목입니다',
  }),
  note: Joi.string().max(500).optional().messages({
    'string.max': '메모는 최대 500자까지 입력 가능합니다',
  }),
});

/**
 * 체크아웃 검증 스키마
 */
export const checkOutSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': '위도는 -90 이상이어야 합니다',
    'number.max': '위도는 90 이하여야 합니다',
    'any.required': '위도는 필수 항목입니다',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': '경도는 -180 이상이어야 합니다',
    'number.max': '경도는 180 이하여야 합니다',
    'any.required': '경도는 필수 항목입니다',
  }),
  note: Joi.string().max(500).optional().messages({
    'string.max': '메모는 최대 500자까지 입력 가능합니다',
  }),
});

/**
 * 출퇴근 설정 검증 스키마
 */
export const attendanceSettingSchema = Joi.object({
  siteId: Joi.string().uuid().required().messages({
    'string.guid': '유효한 사업장 ID를 입력해주세요',
    'any.required': '사업장 ID는 필수 항목입니다',
  }),
  expectedCheckIn: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': '출근 시간은 HH:mm 형식이어야 합니다 (예: 09:00)',
      'any.required': '출근 시간은 필수 항목입니다',
    }),
  expectedCheckOut: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': '퇴근 시간은 HH:mm 형식이어야 합니다 (예: 18:00)',
      'any.required': '퇴근 시간은 필수 항목입니다',
    }),
  allowedRadius: Joi.number().integer().min(1).max(10000).optional().messages({
    'number.min': '허용 반경은 최소 1m 이상이어야 합니다',
    'number.max': '허용 반경은 최대 10000m 이하여야 합니다',
    'number.integer': '허용 반경은 정수여야 합니다',
  }),
});
