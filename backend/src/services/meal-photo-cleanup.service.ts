/**
 * Meal Photo Cleanup Service
 * @description 배식사진 자동 정리 (소프트 90일 → 하드 180일)
 *
 * 정책:
 *  - capturedAt 기준 90일 경과 시 soft delete (deletedAt 설정, GCS 파일은 유지)
 *  - soft delete 후 90일 경과 (총 180일) 시 hard delete (GCS 파일 + DB row 삭제)
 *
 * 안전장치:
 *  - dryRun: true 로 호출하면 영향 받는 사진 수만 반환 (실제 변경 없음)
 *  - 한 회 실행당 hardDelete 배치 크기 제한 (기본 500) - 대량 트래픽/비용 폭주 방지
 */

import { prisma } from '../config/database';
import { deleteImage, extractPathFromUrl } from './storage.service';

const SOFT_DELETE_DAYS = 90;
const HARD_DELETE_AFTER_SOFT_DAYS = 90; // soft delete 후 추가로 90일 (총 180일)
const HARD_DELETE_BATCH_LIMIT = 500;

export interface CleanupResult {
  softDeletedCount: number;
  hardDeletedCount: number;
  hardDeleteFailures: number;
  dryRun: boolean;
  softCutoff: string;
  hardCutoff: string;
  durationMs: number;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * 정리 실행
 */
export async function runCleanup(options: { dryRun?: boolean } = {}): Promise<CleanupResult> {
  const startedAt = Date.now();
  const dryRun = !!options.dryRun;
  const softCutoff = daysAgo(SOFT_DELETE_DAYS);
  const hardCutoff = daysAgo(HARD_DELETE_AFTER_SOFT_DAYS);

  // === 1단계: SOFT DELETE ===
  // capturedAt이 90일 이상 지났고 아직 soft delete되지 않은 사진
  let softDeletedCount = 0;
  if (dryRun) {
    softDeletedCount = await prisma.mealPhoto.count({
      where: {
        capturedAt: { lt: softCutoff },
        deletedAt: null,
      },
    });
  } else {
    const result = await prisma.mealPhoto.updateMany({
      where: {
        capturedAt: { lt: softCutoff },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    softDeletedCount = result.count;
  }

  // === 2단계: HARD DELETE ===
  // soft delete된 지 90일 이상 지난 사진 → GCS 파일 + DB row 삭제
  // 안전을 위해 한 번에 HARD_DELETE_BATCH_LIMIT 만큼만 처리
  let hardDeletedCount = 0;
  let hardDeleteFailures = 0;

  const candidates = await prisma.mealPhoto.findMany({
    where: {
      deletedAt: { lt: hardCutoff, not: null },
    },
    select: {
      id: true,
      imageUrl: true,
      thumbnailUrl: true,
    },
    take: HARD_DELETE_BATCH_LIMIT,
  });

  if (dryRun) {
    hardDeletedCount = candidates.length;
  } else {
    for (const photo of candidates) {
      try {
        // GCS 파일 삭제 (실패해도 DB row는 삭제 진행)
        if (photo.imageUrl) {
          const path = extractPathFromUrl(photo.imageUrl);
          const thumbPath = photo.thumbnailUrl
            ? extractPathFromUrl(photo.thumbnailUrl)
            : '';
          if (path) {
            await deleteImage(path, thumbPath || '');
          }
        }
        await prisma.mealPhoto.delete({ where: { id: photo.id } });
        hardDeletedCount += 1;
      } catch (err) {
        hardDeleteFailures += 1;
        console.error(`[meal-photo-cleanup] hard delete failed for ${photo.id}:`, err);
      }
    }
  }

  const result: CleanupResult = {
    softDeletedCount,
    hardDeletedCount,
    hardDeleteFailures,
    dryRun,
    softCutoff: softCutoff.toISOString(),
    hardCutoff: hardCutoff.toISOString(),
    durationMs: Date.now() - startedAt,
  };

  console.log(
    `[meal-photo-cleanup] ${dryRun ? '[DRY RUN]' : ''} ` +
      `soft=${softDeletedCount}, hard=${hardDeletedCount}, ` +
      `failures=${hardDeleteFailures}, duration=${result.durationMs}ms`
  );

  return result;
}
