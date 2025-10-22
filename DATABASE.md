# 데이터베이스 사용 가이드

## ⚠️ 중요: 이 프로젝트는 Supabase만 사용합니다

**이 프로젝트에서는 로컬 PostgreSQL을 사용하지 않습니다.**

### 데이터베이스 정책

- ✅ **사용**: Supabase PostgreSQL (클라우드)
- ❌ **사용 안 함**: 로컬 PostgreSQL (`localhost:5432`)

### 왜 로컬 PostgreSQL을 사용하지 않나요?

1. **데이터 일관성**: 모든 개발자와 배포 환경에서 동일한 데이터베이스를 사용합니다
2. **데이터 백업**: Supabase가 자동으로 백업을 관리합니다
3. **실시간 동기화**: 웹, 모바일 앱이 모두 같은 데이터를 실시간으로 공유합니다
4. **배포 편의성**: 별도의 데이터베이스 마이그레이션 없이 바로 배포 가능합니다

### 데이터베이스 연결 설정

프로젝트의 데이터베이스 연결은 `.env` 파일의 `DATABASE_URL`을 통해 관리됩니다:

```env
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

### 절대 하지 말아야 할 것

1. ❌ 로컬 PostgreSQL 데이터를 Supabase로 마이그레이션하지 마세요
2. ❌ `DATABASE_URL`을 로컬 PostgreSQL로 변경하지 마세요
3. ❌ 로컬 PostgreSQL에서 테스트 데이터를 생성하지 마세요

### 데이터 작업 시 주의사항

- **데이터 추가/수정**: 반드시 웹 UI 또는 Supabase 대시보드를 통해서만 수행
- **테스트 데이터**: Supabase에서 직접 생성하거나 웹 UI의 엑셀 업로드 기능 사용
- **데이터 백업**: Supabase 대시보드의 Backups 메뉴 활용

### Prisma 마이그레이션

스키마 변경 시:

```bash
# Supabase에 스키마 변경 적용
npx prisma db push

# 또는 마이그레이션 생성
npx prisma migrate dev --name your_migration_name
```

### Supabase 대시보드 접속

- URL: https://supabase.com/dashboard
- 프로젝트 선택 → Database 메뉴에서 데이터 확인 및 관리

### 문제 해결

**Q: 데이터가 보이지 않아요**
A: `.env` 파일의 `DATABASE_URL`이 Supabase를 가리키는지 확인하세요

**Q: 로컬에서 테스트하고 싶어요**
A: 로컬에서도 Supabase를 사용합니다. 별도 로컬 DB가 필요 없습니다

**Q: 실수로 로컬 PostgreSQL에 데이터를 넣었어요**
A: 해당 데이터는 무시하고, Supabase의 데이터만 사용하세요

---

**마지막 업데이트**: 2025-10-22
**담당자**: Daham VOC 개발팀
