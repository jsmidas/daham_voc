/**
 * DeliverySchedule 평일(1-5) 병합 시 충돌 점검 (READ-ONLY)
 *
 * 목적: 평일 요일별로 같은 (routeId, mealType)에 서로 다른 driverId가
 *       배정되어 있는 케이스를 찾아, 평일→WEEKDAY 병합 시 어떤 데이터가
 *       버려지는지 사용자가 검토할 수 있게 리포트.
 */
import { prisma } from '../src/config/database';

async function main() {
  const schedules = await prisma.deliverySchedule.findMany({
    select: {
      routeId: true,
      driverId: true,
      dayOfWeek: true,
      mealType: true,
      route: { select: { name: true, code: true } },
      driver: { select: { name: true } },
    },
    orderBy: [{ routeId: 'asc' }, { mealType: 'asc' }, { dayOfWeek: 'asc' }],
  });

  const total = schedules.length;
  const weekday = schedules.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
  const sat = schedules.filter((s) => s.dayOfWeek === 6);
  const sun = schedules.filter((s) => s.dayOfWeek === 0);

  console.log('=== DeliverySchedule 현황 ===');
  console.log(`전체: ${total}건`);
  console.log(`  평일(월-금): ${weekday.length}건`);
  console.log(`  토요일: ${sat.length}건`);
  console.log(`  일요일: ${sun.length}건`);

  // 평일 병합 시 충돌: (routeId, mealType) 단위로 groupBy, driverId distinct 개수가 2 이상
  type Key = string;
  const bucket = new Map<Key, typeof weekday>();
  for (const s of weekday) {
    const k = `${s.routeId}__${s.mealType}`;
    if (!bucket.has(k)) bucket.set(k, [] as any);
    bucket.get(k)!.push(s);
  }

  const conflicts: Array<{
    routeName: string;
    routeCode: string;
    mealType: string;
    assignments: Array<{ dayOfWeek: number; driverName: string }>;
  }> = [];

  for (const [, rows] of bucket) {
    const distinctDrivers = new Set(rows.map((r) => r.driverId));
    if (distinctDrivers.size >= 2) {
      conflicts.push({
        routeName: rows[0].route.name,
        routeCode: rows[0].route.code,
        mealType: rows[0].mealType,
        assignments: rows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          driverName: r.driver.name,
        })),
      });
    }
  }

  console.log('');
  console.log('=== 평일 병합 충돌 (같은 코스+끼니에 요일별 다른 기사) ===');
  console.log(`충돌 케이스: ${conflicts.length}건`);
  console.log('');

  const dayLabel = ['일', '월', '화', '수', '목', '금', '토'];
  for (const c of conflicts) {
    console.log(`[${c.routeCode}] ${c.routeName} - ${c.mealType}`);
    for (const a of c.assignments) {
      console.log(`    ${dayLabel[a.dayOfWeek]}: ${a.driverName}`);
    }
    console.log('');
  }

  if (conflicts.length === 0) {
    console.log('충돌 없음. 평일 → WEEKDAY 무손실 병합 가능.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
