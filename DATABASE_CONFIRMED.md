# 📌 확정된 데이터베이스 설정 (2025-10-22)

## ✅ 현재 사용 중인 데이터베이스 연결

**이 설정은 확정되었으며, 변경하지 마세요!**

### 연결 정보

```env
DATABASE_URL=postgresql://postgres.iyussgoqhgzogjvpuxnb:cc956697%25%5E12@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.iyussgoqhgzogjvpuxnb:cc956697%25%5E12@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 중요 정보

- **Supabase Project ID**: `iyussgoqhgzogjvpuxnb`
- **Region**: Northeast Asia (Seoul)
- **Connection Mode**: Transaction mode (포트 6543)
- **Direct Connection**: Session mode (포트 5432) - 마이그레이션용

### 포트 설명

1. **포트 6543 (Transaction mode)** ⭐ **메인 사용**
   - 일반 애플리케이션 연결에 사용
   - 높은 동시 연결 지원
   - `DATABASE_URL`에 설정

2. **포트 5432 (Session mode)**
   - Prisma 마이그레이션 전용
   - `DIRECT_URL`에 설정

### 현재 데이터 현황 (2025-10-22 20:57)

- 사업장(Site): 90개
- 식단유형(MenuType): 28개
- 사용자(User): 7개
- 사업장그룹(SiteGroup): 7개

### 백업 파일

- 경로: `backup/daham_voc_backup_20251022_205721.dump`
- 크기: 325KB
- 생성일시: 2025-10-22 20:57:21

### ⚠️ 절대 변경하지 마세요!

1. ❌ DATABASE_URL의 포트를 6543에서 다른 것으로 변경 금지
2. ❌ 로컬 PostgreSQL로 전환 금지
3. ❌ Supabase 프로젝트 ID 변경 금지

### Prisma 마이그레이션

스키마 변경 시:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 문제 발생 시

만약 데이터베이스 연결 문제가 발생하면:

1. `.env` 파일에서 위의 DATABASE_URL과 DIRECT_URL이 정확한지 확인
2. 백엔드 서버 재시작: `npm run dev`
3. 그래도 안 되면 백업 파일 사용: `backup/daham_voc_backup_20251022_205721.dump`

---

**⚠️ 이 문서의 설정은 확정되었습니다. 변경이 필요하면 팀과 먼저 상의하세요!**

**작성자**: Claude  
**확정일**: 2025-10-22 20:57
