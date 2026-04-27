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
const HARD_DELETE_PARALLELISM = 8; // 한 번에 처리할 GCS 삭제 동시성

export interface CleanupResult {
  softDeletedCount: number;
  hardDeletedCount: number;
  hardDeleteGcsFailures: number; // GCS 삭제 실패 (DB row는 보존, 다음 실행에 재시도)
  hardDeleteDbFailures: number; // DB 삭제 실패
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
  // GCS 삭제 실패 시 DB row를 보존 → 다음 실행에 재시도되도록 함 (orphan GCS 파일 방지)
  let hardDeletedCount = 0;
  let hardDeleteGcsFailures = 0;
  let hardDeleteDbFailures = 0;

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
    // HARD_DELETE_PARALLELISM 만큼씩 청크로 병렬 처리 (Supabase pooler 타임아웃 방지)
    const chunks: typeof candidates[] = [];
    for (let i = 0; i < candidates.length; i += HARD_DELETE_PARALLELISM) {
      chunks.push(candidates.slice(i, i + HARD_DELETE_PARALLELISM));
    }

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(async (photo) => {
          // 1. GCS 삭제 시도
          let gcsOk = true;
          if (photo.imageUrl) {
            const path = extractPathFromUrl(photo.imageUrl);
            const thumbPath = photo.thumbnailUrl
              ? extractPathFromUrl(photo.thumbnailUrl)
              : '';
            if (path) {
              gcsOk = await deleteImage(path, thumbPath || '');
            }
          }
          // 2. GCS가 실패하면 DB는 건드리지 않음 (orphan 방지, 다음 실행에서 재시도됨)
          if (!gcsOk) {
            return { id: photo.id, status: 'gcs-failed' as const };
          }
          // 3. DB row 삭제
          await prisma.mealPhoto.delete({ where: { id: photo.id } });
          return { id: photo.id, status: 'ok' as const };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.status === 'ok') hardDeletedCount += 1;
          else if (r.value.status === 'gcs-failed') hardDeleteGcsFailures += 1;
        } else {
          hardDeleteDbFailures += 1;
          console.error('[meal-photo-cleanup] hard delete chunk error:', r.reason);
        }
      }
    }
  }

  const result: CleanupResult = {
    softDeletedCount,
    hardDeletedCount,
    hardDeleteGcsFailures,
    hardDeleteDbFailures,
    dryRun,
    softCutoff: softCutoff.toISOString(),
    hardCutoff: hardCutoff.toISOString(),
    durationMs: Date.now() - startedAt,
  };

  console.log(
    `[meal-photo-cleanup] ${dryRun ? '[DRY RUN] ' : ''}` +
      `soft=${softDeletedCount}, hard=${hardDeletedCount}, ` +
      `gcsFail=${hardDeleteGcsFailures}, dbFail=${hardDeleteDbFailures}, ` +
      `duration=${result.durationMs}ms`
  );

  return result;
}
