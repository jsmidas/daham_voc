/**
 * Scheduled Jobs
 * @description node-cron 기반 정기 실행 작업 등록
 *
 * 주의:
 *  - PM2 클러스터 모드에서는 인스턴스마다 스케줄이 돌 수 있음 → 현재는 단일 인스턴스 운영(GCP VM e2-small)이라 OK
 *  - 추후 멀티 인스턴스화 시 lock 또는 별도 워커로 분리 필요
 */

import cron from 'node-cron';
import { runCleanup } from '../services/meal-photo-cleanup.service';

let started = false;

export function startScheduler() {
  if (started) {
    console.warn('[scheduler] startScheduler() 이미 호출됨, 중복 등록 방지');
    return;
  }
  started = true;

  // 매일 KST 04:00 (UTC 19:00) 배식사진 정리 — 트래픽 가장 적은 시간
  // cron: 분 시 일 월 요일 (UTC 기준)
  cron.schedule(
    '0 19 * * *',
    async () => {
      console.log('[scheduler] meal-photo cleanup 시작');
      try {
        await runCleanup({ dryRun: false });
      } catch (err) {
        console.error('[scheduler] meal-photo cleanup 실패:', err);
      }
    },
    { timezone: 'UTC' }
  );

  console.log('[scheduler] ✅ daily meal-photo cleanup 등록 (매일 KST 04:00)');
}
