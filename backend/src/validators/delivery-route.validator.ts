import Joi from 'joi';

/**
 * 배송 코스 생성 검증
 */
export const createDeliveryRouteSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': '코스 이름은 최소 2자 이상이어야 합니다',
    'string.max': '코스 이름은 최대 50자까지 입력 가능합니다',
    'any.required': '코스 이름은 필수 항목입니다',
  }),
  code: Joi.string().min(1).max(10).required().messages({
    'string.min': '코스 코드는 최소 1자 이상이어야 합니다',
    'string.max': '코스 코드는 최대 10자까지 입력 가능합니다',
    'any.required': '코스 코드는 필수 항목입니다',
  }),
  division: Joi.string().valid('HQ', 'YEONGNAM').required().messages({
    'any.only': '유효한 부문을 선택해주세요 (본사/영남지사)',
    'any.required': '부문은 필수 항목입니다',
  }),
  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': '설명은 최대 500자까지 입력 가능합니다',
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
    'string.pattern.base': '올바른 색상 코드를 입력해주세요 (예: #1890ff)',
  }),
});

/**
 * 배송 코스 수정 검증
 */
export const updateDeliveryRouteSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  description: Joi.string().max(500).optional().allow(''),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * 코스에 사업장 추가 검증
 */
export const addSiteToRouteSchema = Joi.object({
  siteId: Joi.string().uuid().required().messages({
    'string.uuid': '유효한 사업장 ID를 입력해주세요',
    'any.required': '사업장 ID는 필수 항목입니다',
  }),
  stopNumber: Joi.number().min(1).required().messages({
    'number.min': '방문 순서는 1 이상이어야 합니다',
    'any.required': '방문 순서는 필수 항목입니다',
  }),
  estimatedArrival: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().messages({
    'string.pattern.base': '올바른 시간 형식을 입력해주세요 (예: 09:30)',
  }),
  estimatedDuration: Joi.number().min(0).optional().messages({
    'number.min': '예상 소요 시간은 0 이상이어야 합니다',
  }),
  notes: Joi.string().max(500).optional().allow(''),
});

/**
 * 코스 사업장 순서 업데이트 검증
 */
export const updateRouteStopsSchema = Joi.object({
  stops: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().uuid().required(),
        stopNumber: Joi.number().min(1).required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': '최소 1개 이상의 정류장이 필요합니다',
      'any.required': '정류장 목록은 필수 항목입니다',
    }),
});

/**
 * 기사 배정 검증
 */
export const assignDriverSchema = Joi.object({
  routeId: Joi.string().uuid().required(),
  driverIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': '최소 1명 이상의 기사를 배정해야 합니다',
  }),
});

/**
 * 배송 기록 생성 검증
 */
export const createDeliveryLogSchema = Joi.object({
  routeId: Joi.string().uuid().required(),
  siteId: Joi.string().uuid().required(),
  stopNumber: Joi.number().min(1).required(),
  arrivedAt: Joi.date().iso().optional(),
  arrivalLat: Joi.number().min(-90).max(90).optional(),
  arrivalLng: Joi.number().min(-180).max(180).optional(),
  status: Joi.string()
    .valid('PENDING', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'DELAYED', 'ISSUE')
    .required(),
  note: Joi.string().max(500).optional().allow(''),
});

/**
 * 쿼리 파라미터 검증
 */
export const getDeliveryRoutesQuerySchema = Joi.object({
  division: Joi.string().valid('HQ', 'YEONGNAM').optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(100).optional(),
});
