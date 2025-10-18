import Joi from 'joi';

/**
 * Create site validation schema
 */
export const createSiteSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': '사업장 이름은 최소 2자 이상이어야 합니다',
    'string.max': '사업장 이름은 최대 100자까지 입력 가능합니다',
    'any.required': '사업장 이름은 필수 항목입니다',
  }),
  type: Joi.string()
    .valid('CONSIGNMENT', 'DELIVERY', 'LUNCHBOX', 'EVENT')
    .required()
    .messages({
      'any.only': '유효한 사업장 유형을 선택해주세요',
      'any.required': '사업장 유형은 필수 항목입니다',
    }),
  division: Joi.string().valid('HQ', 'YEONGNAM').required().messages({
    'any.only': '유효한 부문을 선택해주세요 (본사/영남지사)',
    'any.required': '부문은 필수 항목입니다',
  }),
  groupId: Joi.string().uuid().optional().messages({
    'string.uuid': '유효한 그룹 ID를 입력해주세요',
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.min': '주소는 최소 5자 이상이어야 합니다',
    'string.max': '주소는 최대 200자까지 입력 가능합니다',
    'any.required': '주소는 필수 항목입니다',
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': '위도는 -90에서 90 사이여야 합니다',
    'number.max': '위도는 -90에서 90 사이여야 합니다',
    'any.required': '위도는 필수 항목입니다',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': '경도는 -180에서 180 사이여야 합니다',
    'number.max': '경도는 -180에서 180 사이여야 합니다',
    'any.required': '경도는 필수 항목입니다',
  }),
  contactPerson1: Joi.string().max(50).optional().messages({
    'string.max': '담당자 이름은 최대 50자까지 입력 가능합니다',
  }),
  contactPhone1: Joi.string()
    .pattern(/^0\d{1,2}-\d{3,4}-\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678, 02-123-4567, 051-123-4567)',
    }),
  contactPerson2: Joi.string().max(50).optional().messages({
    'string.max': '담당자 이름은 최대 50자까지 입력 가능합니다',
  }),
  contactPhone2: Joi.string()
    .pattern(/^0\d{1,2}-\d{3,4}-\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678, 02-123-4567, 051-123-4567)',
    }),
  staffIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    'array.base': '담당자 ID는 배열 형식이어야 합니다',
    'string.uuid': '유효한 담당자 ID를 입력해주세요',
  }),
  mealTypes: Joi.array()
    .items(Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'))
    .optional()
    .messages({
      'array.base': '식단유형은 배열 형식이어야 합니다',
      'any.only': '유효한 식단유형을 선택해주세요',
    }),
  pricePerMeal: Joi.number().min(0).optional().messages({
    'number.min': '단가는 0 이상이어야 합니다',
  }),
  deliveryRoute: Joi.string().max(100).optional().messages({
    'string.max': '배송코스는 최대 100자까지 입력 가능합니다',
  }),
  contractStartDate: Joi.date().iso().optional().messages({
    'date.format': '올바른 날짜 형식이 아닙니다',
  }),
  contractEndDate: Joi.date().iso().optional().messages({
    'date.format': '올바른 날짜 형식이 아닙니다',
  }),
  sortOrder: Joi.number().min(0).optional().messages({
    'number.min': '정렬 순서는 0 이상이어야 합니다',
  }),
});

/**
 * Update site validation schema
 */
export const updateSiteSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('CONSIGNMENT', 'DELIVERY', 'LUNCHBOX', 'EVENT').optional(),
  division: Joi.string().valid('HQ', 'YEONGNAM').optional(),
  groupId: Joi.string().uuid().allow(null).optional(),
  address: Joi.string().min(5).max(200).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  contactPerson1: Joi.string().max(50).allow(null, '').optional(),
  contactPhone1: Joi.string()
    .pattern(/^0\d{1,2}-\d{3,4}-\d{4}$/)
    .allow(null, '')
    .optional(),
  contactPerson2: Joi.string().max(50).allow(null, '').optional(),
  contactPhone2: Joi.string()
    .pattern(/^0\d{1,2}-\d{3,4}-\d{4}$/)
    .allow(null, '')
    .optional(),
  staffIds: Joi.array().items(Joi.string().uuid()).optional(),
  mealTypes: Joi.array()
    .items(Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'))
    .optional(),
  pricePerMeal: Joi.number().min(0).allow(null).optional(),
  deliveryRoute: Joi.string().max(100).allow(null, '').optional(),
  contractStartDate: Joi.date().iso().allow(null).optional(),
  contractEndDate: Joi.date().iso().allow(null).optional(),
  sortOrder: Joi.number().min(0).optional(),
});

/**
 * Query parameters validation schema
 */
export const getSitesQuerySchema = Joi.object({
  type: Joi.string().valid('CONSIGNMENT', 'DELIVERY', 'LUNCHBOX', 'EVENT').optional(),
  division: Joi.string().valid('HQ', 'YEONGNAM').optional(),
  groupId: Joi.string().uuid().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
});
