/**
 * Shared Types
 * @description 앱 전역에서 사용하는 공통 타입 정의
 */

// Division (부문)
export type Division = 'HQ' | 'YEONGNAM' | 'CONSIGNMENT';

// Role (권한)
export type Role =
  | 'SUPER_ADMIN'
  | 'HQ_ADMIN'
  | 'YEONGNAM_ADMIN'
  | 'GROUP_MANAGER'
  | 'SITE_MANAGER'
  | 'SITE_STAFF'
  | 'DELIVERY_DRIVER'
  | 'CLIENT';

// Role 한글 레이블
export const RoleLabels: Record<Role, string> = {
  SUPER_ADMIN: '슈퍼 관리자',
  HQ_ADMIN: '본사 관리자',
  YEONGNAM_ADMIN: '영남 관리자',
  GROUP_MANAGER: '그룹 관리자',
  SITE_MANAGER: '사업장 관리자',
  SITE_STAFF: '사업장 담당자',
  DELIVERY_DRIVER: '배송 기사',
  CLIENT: '고객사',
};

// Division 한글 레이블
export const DivisionLabels: Record<Division, string> = {
  HQ: '본사',
  YEONGNAM: '영남지사',
  CONSIGNMENT: '위탁사업장',
};

// Site Type (사업장 유형)
export type SiteType = 'CONSIGNMENT' | 'DELIVERY' | 'LUNCHBOX' | 'EVENT';

export const SiteTypeLabels: Record<SiteType, string> = {
  CONSIGNMENT: '위탁',
  DELIVERY: '운반급식',
  LUNCHBOX: '도시락',
  EVENT: '행사',
};

// Meal Type (식사 유형)
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export const MealTypeLabels: Record<MealType, string> = {
  BREAKFAST: '조식',
  LUNCH: '중식',
  DINNER: '석식',
  SNACK: '간식',
};

// Photo Type
export type PhotoType = 'SERVING' | 'LEFTOVER' | 'FACILITY';

export const PhotoTypeLabels: Record<PhotoType, string> = {
  SERVING: '배식 준비',
  LEFTOVER: '잔반',
  FACILITY: '시설',
};

// Feedback Status
export type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const FeedbackStatusLabels: Record<FeedbackStatus, string> = {
  PENDING: '미처리',
  IN_PROGRESS: '처리중',
  RESOLVED: '처리완료',
  CLOSED: '종료',
};

// Attendance Status
export type AttendanceStatus = 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'OUTSIDE_RANGE';

export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  NORMAL: '정상',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  OUTSIDE_RANGE: '사업장 외부',
};
