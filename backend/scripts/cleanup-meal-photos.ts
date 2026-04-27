/**
 * Manual cleanup runner
 * @description CLI에서 배식사진 정리를 수동 실행
 *
 * 사용법:
 *   npx ts-node scripts/cleanup-meal-photos.ts          # 실제 실행
 *   npx ts-node scripts/cleanup-meal-photos.ts --dry-run # 영향 받는 건수만 출력
 */

import 'dotenv/config';
import { runCleanup } from '../src/services/meal-photo-cleanup.service';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Running meal photo cleanup (dryRun=${dryRun})...`);

  try {
    const result = await runCleanup({ dryRun });
    console.log('\n=== Result ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

main();
