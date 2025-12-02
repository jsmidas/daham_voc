/**
 * MealPhoto Service
 * @description 식사 사진 CRUD 및 비즈니스 로직
 */

import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { MealType, PhotoType } from '@prisma/client';
import { uploadImage, deleteImage, extractPathFromUrl, uploadMultipleImages } from './storage.service';
import { checkGeofencing, getGeofencingInfo, Coordinates } from '../utils/geofencing.util';

export interface CreateMealPhotoDto {
  siteId: string;
  mealType?: MealType;
  photoType: PhotoType;
  capturedAt: Date;
  latitude?: number;
  longitude?: number;
  image: Express.Multer.File;
}

export interface BulkCreateMealPhotoDto {
  siteId: string;
  mealType?: MealType;
  photoType: PhotoType;
  capturedAt: Date;
  latitude?: number;
  longitude?: number;
  images: Express.Multer.File[];
}

export interface UpdateMealPhotoDto {
  mealType?: MealType;
  photoType?: PhotoType;
  capturedAt?: Date;
  feedback?: string;
  image?: Express.Multer.File;
}

export interface MealPhotoFilter {
  siteId?: string;
  siteIds?: string[];
  division?: string;
  uploaderId?: string;
  photoType?: PhotoType;
  mealType?: MealType;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * 식사 사진 생성 (GPS 검증은 선택적 - 저장은 항상 허용)
 */
export async function createMealPhoto(
  dto: CreateMealPhotoDto,
  userId: string
): Promise<any> {
  // 사업장 조회
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
  });

  if (!site) {
    throw new Error('Site not found');
  }

  // GPS 검증 (위도/경도가 제공된 경우) - 로깅만 하고 저장은 항상 허용
  if (dto.latitude !== undefined && dto.longitude !== undefined) {
    const userCoord: Coordinates = {
      lat: dto.latitude,
      lng: dto.longitude,
    };

    const siteCoord: Coordinates = {
      lat: site.latitude,
      lng: site.longitude,
    };

    // 기본 허용 반경 100m
    const allowedRadius = 100;
    const isWithinRange = checkGeofencing(userCoord, siteCoord, allowedRadius);

    if (!isWithinRange) {
      const info = getGeofencingInfo(userCoord, siteCoord, allowedRadius);
      console.log(`[GPS 경고] ${site.name}: ${info.message}`);
      // 에러를 던지지 않고 저장은 허용 (관리 목적으로 로깅만)
    }
  }

  // 이미지 업로드
  const uploaded = await uploadImage(dto.image, 'meal-photos');

  // DB 저장
  const photo = await prisma.mealPhoto.create({
    data: {
      siteId: dto.siteId,
      uploaderId: userId,
      imageUrl: uploaded.originalUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      mealType: dto.mealType,
      photoType: dto.photoType,
      capturedAt: dto.capturedAt,
      latitude: dto.latitude,
      longitude: dto.longitude,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMealPhotoCache(dto.siteId);

  return photo;
}

/**
 * 식사 사진 일괄 업로드 (GPS 검증은 선택적 - 저장은 항상 허용)
 */
export async function bulkCreateMealPhotos(
  dto: BulkCreateMealPhotoDto,
  userId: string
): Promise<any> {
  // 사업장 조회
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
  });

  if (!site) {
    throw new Error('Site not found');
  }

  // GPS 검증 (위도/경도가 제공된 경우) - 로깅만 하고 저장은 항상 허용
  if (dto.latitude !== undefined && dto.longitude !== undefined) {
    const userCoord: Coordinates = {
      lat: dto.latitude,
      lng: dto.longitude,
    };

    const siteCoord: Coordinates = {
      lat: site.latitude,
      lng: site.longitude,
    };

    // 기본 허용 반경 100m
    const allowedRadius = 100;
    const isWithinRange = checkGeofencing(userCoord, siteCoord, allowedRadius);

    if (!isWithinRange) {
      const info = getGeofencingInfo(userCoord, siteCoord, allowedRadius);
      console.log(`[GPS 경고 - 일괄업로드] ${site.name}: ${info.message}`);
      // 에러를 던지지 않고 저장은 허용 (관리 목적으로 로깅만)
    }
  }

  // 이미지 일괄 업로드
  const uploadResult = await uploadMultipleImages(dto.images, 'meal-photos');

  // 업로드된 이미지들 DB 저장
  const photos = await prisma.$transaction(
    uploadResult.uploaded.map((uploaded) =>
      prisma.mealPhoto.create({
        data: {
          siteId: dto.siteId,
          uploaderId: userId,
          imageUrl: uploaded.originalUrl,
          thumbnailUrl: uploaded.thumbnailUrl,
          mealType: dto.mealType,
          photoType: dto.photoType,
          capturedAt: dto.capturedAt,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
        include: {
          site: {
            select: { id: true, name: true, type: true },
          },
          uploader: {
            select: { id: true, name: true, email: true },
          },
        },
      })
    )
  );

  // 캐시 무효화
  await invalidateMealPhotoCache(dto.siteId);

  return {
    photos,
    uploaded: uploadResult.uploaded.length,
    failed: uploadResult.failed,
  };
}

/**
 * 식사 사진 목록 조회
 */
export async function getMealPhotos(filter: MealPhotoFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `meal-photos:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 필터 조건 구성
  const where: any = {
    deletedAt: null,
  };

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.siteIds && filter.siteIds.length > 0) {
    where.siteId = { in: filter.siteIds };
  }

  // division 필터: site의 division으로 필터링
  if (filter.division && filter.division !== 'ALL') {
    where.site = {
      division: filter.division,
    };
  }

  if (filter.uploaderId) {
    where.uploaderId = filter.uploaderId;
  }

  if (filter.photoType) {
    where.photoType = filter.photoType;
  }

  if (filter.mealType) {
    where.mealType = filter.mealType;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.capturedAt = {};
    if (filter.dateFrom) where.capturedAt.gte = filter.dateFrom;
    if (filter.dateTo) where.capturedAt.lte = filter.dateTo;
  }

  // 조회
  const photos = await prisma.mealPhoto.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }],
  });

  // 캐시 저장 (10분)
  await cache.set(cacheKey, JSON.stringify(photos), 600);

  return photos;
}

/**
 * 식사 사진 상세 조회
 */
export async function getMealPhotoById(id: string): Promise<any> {
  const photo = await prisma.mealPhoto.findUnique({
    where: { id },
    include: {
      site: {
        select: { id: true, name: true, type: true, division: true },
      },
      uploader: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!photo || photo.deletedAt) {
    throw new Error('Meal photo not found');
  }

  return photo;
}

/**
 * 식사 사진 수정 (관리자 피드백 추가 등)
 */
export async function updateMealPhoto(
  photoId: string,
  dto: UpdateMealPhotoDto,
  _userId: string
): Promise<any> {
  // 기존 사진 조회
  const photo = await prisma.mealPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.deletedAt) {
    throw new Error('Meal photo not found');
  }

  // 확인 완료된 사진은 수정 불가
  if (photo.isChecked) {
    throw new Error('확인 완료된 사진은 수정할 수 없습니다');
  }

  // 업데이트 데이터 준비
  const updateData: any = {};

  if (dto.mealType !== undefined) updateData.mealType = dto.mealType;
  if (dto.photoType !== undefined) updateData.photoType = dto.photoType;
  if (dto.capturedAt !== undefined) updateData.capturedAt = dto.capturedAt;
  if (dto.feedback !== undefined) updateData.feedback = dto.feedback;

  // 새 이미지 업로드
  if (dto.image) {
    // 기존 이미지 삭제
    if (photo.imageUrl) {
      const path = extractPathFromUrl(photo.imageUrl);
      const thumbPath = extractPathFromUrl(photo.thumbnailUrl!);
      await deleteImage(path, thumbPath);
    }

    const uploaded = await uploadImage(dto.image, 'meal-photos');
    updateData.imageUrl = uploaded.originalUrl;
    updateData.thumbnailUrl = uploaded.thumbnailUrl;
  }

  // DB 업데이트
  const updated = await prisma.mealPhoto.update({
    where: { id: photoId },
    data: updateData,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMealPhotoCache(photo.siteId);

  return updated;
}

/**
 * 식사 사진 삭제 (Soft Delete)
 */
export async function deleteMealPhoto(photoId: string, _userId: string): Promise<void> {
  const photo = await prisma.mealPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.deletedAt) {
    throw new Error('Meal photo not found');
  }

  // 확인 완료된 사진은 삭제 불가
  if (photo.isChecked) {
    throw new Error('확인 완료된 사진은 삭제할 수 없습니다');
  }

  // 이미지 삭제
  if (photo.imageUrl) {
    const path = extractPathFromUrl(photo.imageUrl);
    const thumbPath = extractPathFromUrl(photo.thumbnailUrl!);
    await deleteImage(path, thumbPath);
  }

  // Soft Delete
  await prisma.mealPhoto.update({
    where: { id: photoId },
    data: { deletedAt: new Date() },
  });

  // 캐시 무효화
  await invalidateMealPhotoCache(photo.siteId);
}

/**
 * 식사 사진 일괄 삭제 (조건별)
 * @description 날짜, 끼니, 사진타입 기준으로 여러 사진을 한번에 삭제
 */
export async function bulkDeleteMealPhotos(
  siteId: string,
  date: string,
  mealType?: MealType,
  photoType?: PhotoType,
  _userId?: string
): Promise<{ deleted: number }> {
  // 삭제 조건 구성
  const where: any = {
    siteId,
    deletedAt: null,
    isChecked: false, // 확인 완료되지 않은 사진만 삭제
  };

  // 날짜 범위 (하루 전체)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  where.capturedAt = {
    gte: startOfDay,
    lte: endOfDay,
  };

  // 선택적 필터
  if (mealType) where.mealType = mealType;
  if (photoType) where.photoType = photoType;

  // 삭제할 사진들 조회
  const photos = await prisma.mealPhoto.findMany({
    where,
    select: {
      id: true,
      imageUrl: true,
      thumbnailUrl: true,
    },
  });

  if (photos.length === 0) {
    return { deleted: 0 };
  }

  // 이미지 파일 삭제 (병렬 처리)
  const deletePromises = photos.map((photo) => {
    if (photo.imageUrl && photo.thumbnailUrl) {
      const path = extractPathFromUrl(photo.imageUrl);
      const thumbPath = extractPathFromUrl(photo.thumbnailUrl);
      return deleteImage(path, thumbPath);
    }
    return Promise.resolve();
  });

  await Promise.allSettled(deletePromises);

  // DB에서 Soft Delete
  const result = await prisma.mealPhoto.updateMany({
    where: {
      id: { in: photos.map((p) => p.id) },
    },
    data: {
      deletedAt: new Date(),
    },
  });

  // 캐시 무효화
  await invalidateMealPhotoCache(siteId);

  return { deleted: result.count };
}

/**
 * 캐시 무효화
 */
async function invalidateMealPhotoCache(siteId: string): Promise<void> {
  const keys = await cache.keys(`meal-photos:*${siteId}*`);
  if (keys.length > 0) {
    await cache.del(...keys);
  }
}

/**
 * 사업장별 일간 사진 조회
 */
export async function getDailyPhotos(
  siteId: string,
  date: Date
): Promise<any[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getMealPhotos({
    siteId,
    dateFrom: startOfDay,
    dateTo: endOfDay,
  });
}

/**
 * 사업장별 주간 사진 조회
 */
export async function getWeeklyPhotos(
  siteId: string,
  weekStart: Date
): Promise<any[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return getMealPhotos({
    siteId,
    dateFrom: weekStart,
    dateTo: weekEnd,
  });
}

/**
 * 사업장별 월간 사진 조회
 */
export async function getMonthlyPhotos(
  siteId: string,
  year: number,
  month: number
): Promise<any[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  return getMealPhotos({
    siteId,
    dateFrom: monthStart,
    dateTo: monthEnd,
  });
}

/**
 * 사진 타입별 통계
 */
export async function getPhotoStatistics(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const photos = await prisma.mealPhoto.findMany({
    where: {
      siteId,
      capturedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
    select: {
      photoType: true,
      mealType: true,
    },
  });

  // 통계 집계
  const stats = {
    total: photos.length,
    byPhotoType: {} as Record<string, number>,
    byMealType: {} as Record<string, number>,
  };

  photos.forEach((photo) => {
    // PhotoType 집계
    if (photo.photoType) {
      stats.byPhotoType[photo.photoType] = (stats.byPhotoType[photo.photoType] || 0) + 1;
    }

    // MealType 집계
    if (photo.mealType) {
      stats.byMealType[photo.mealType] = (stats.byMealType[photo.mealType] || 0) + 1;
    }
  });

  return stats;
}

/**
 * 사진 일괄 확인 완료 처리
 */
export async function bulkCheckMealPhotos(
  photoIds: string[],
  checkedBy: string
): Promise<{ checked: number }> {
  if (!photoIds || photoIds.length === 0) {
    throw new Error('Photo IDs are required');
  }

  // 확인 완료 처리
  const result = await prisma.mealPhoto.updateMany({
    where: {
      id: { in: photoIds },
      deletedAt: null,
      isChecked: false, // 아직 확인되지 않은 사진만
    },
    data: {
      isChecked: true,
      checkedBy,
      checkedAt: new Date(),
    },
  });

  // 캐시 무효화 (모든 관련 사진의 사업장)
  const photos = await prisma.mealPhoto.findMany({
    where: { id: { in: photoIds } },
    select: { siteId: true },
    distinct: ['siteId'],
  });

  await Promise.all(photos.map((p) => invalidateMealPhotoCache(p.siteId)));

  return { checked: result.count };
}

/**
 * 단일 사진 확인 상태 토글
 */
export async function toggleCheckStatus(
  photoId: string,
  checkedBy: string
): Promise<any> {
  const photo = await prisma.mealPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.deletedAt) {
    throw new Error('Meal photo not found');
  }

  // 현재 상태의 반대로 토글
  const newCheckedStatus = !photo.isChecked;

  const updated = await prisma.mealPhoto.update({
    where: { id: photoId },
    data: {
      isChecked: newCheckedStatus,
      checkedBy: newCheckedStatus ? checkedBy : null,
      checkedAt: newCheckedStatus ? new Date() : null,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMealPhotoCache(photo.siteId);

  return updated;
}
