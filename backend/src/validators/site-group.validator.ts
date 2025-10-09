import Joi from 'joi';

/**
 * Create site group validation schema
 */
export const createSiteGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': '그룹 이름은 최소 2자 이상이어야 합니다',
    'string.max': '그룹 이름은 최대 100자까지 입력 가능합니다',
    'any.required': '그룹 이름은 필수 항목입니다',
  }),
  division: Joi.string().valid('HQ', 'YEONGNAM').required().messages({
    'any.only': '유효한 부문을 선택해주세요 (본사/영남지사)',
    'any.required': '부문은 필수 항목입니다',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': '설명은 최대 500자까지 입력 가능합니다',
  }),
  sortOrder: Joi.number().integer().min(0).optional().messages({
    'number.base': '정렬 순서는 숫자여야 합니다',
    'number.min': '정렬 순서는 0 이상이어야 합니다',
  }),
});

/**
 * Update site group validation schema
 */
export const updateSiteGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  division: Joi.string().valid('HQ', 'YEONGNAM').optional(),
  description: Joi.string().max(500).allow(null, '').optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});

/**
 * Add/Remove sites validation schema
 */
export const manageSitesSchema = Joi.object({
  siteIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.base': '사업장 ID는 배열 형식이어야 합니다',
      'array.min': '최소 1개 이상의 사업장 ID가 필요합니다',
      'string.uuid': '유효한 사업장 ID를 입력해주세요',
      'any.required': '사업장 ID는 필수 항목입니다',
    }),
});
