# CLAUDE 필독 - 데이터베이스 사용 정책

## 🚨 절대 규칙 🚨

### 1. Supabase만 사용
이 프로젝트는 **Supabase PostgreSQL만** 사용합니다.
- ✅ Supabase: 개발/운영 모두 사용
- ❌ 로컬 PostgreSQL: **절대 사용 금지**
- ❌ 로컬 DB 복원: **절대 금지**

### 2. 데이터베이스 작업 금지 사항

다음 작업은 **사용자 명시적 확인 없이 절대 실행 금지**:

#### 절대 금지 명령어:
```bash
❌ pg_restore --clean
❌ psql -c "DROP DATABASE"
❌ psql -c "DROP TABLE"
❌ psql -c "TRUNCATE"
❌ prisma migrate reset
❌ prisma db push --force-reset
```

#### 백업/복원 작업:
- ❌ 백업 파일로 복원하지 말 것
- ❌ 로컬 DB에서 Supabase로 덮어쓰지 말 것
- ❌ `--clean`, `--force`, `--reset` 옵션 사용 금지

### 3. 데이터베이스 연결

**반드시 확인할 것**:
```bash
# backend/.env 파일
DATABASE_URL=postgresql://postgres.iyussgoqhgzogjvpuxnb:cc956697%25%5E12@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**절대 사용하면 안 되는 것**:
```bash
❌ DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daham_voc
```

### 4. 데이터 조회만 가능

허용되는 작업:
- ✅ SELECT 쿼리 (읽기)
- ✅ 데이터 개수 확인
- ✅ 스키마 확인

사용자 확인 필요한 작업:
- ⚠️ INSERT (추가)
- ⚠️ UPDATE (수정)
- ⚠️ DELETE (삭제)
- ⚠️ ALTER TABLE (스키마 변경)

### 5. 사용자가 "데이터를 불러와야 함"이라고 말할 때

**올바른 이해**:
1. .env 파일이 Supabase URL인지 확인
2. Supabase에 연결되어 있는지 확인
3. 애플리케이션에서 데이터 조회 테스트

**절대 하지 말 것**:
- ❌ 백업 파일 찾기
- ❌ pg_restore 실행
- ❌ 데이터 복원 시도

## 📋 작업 전 체크리스트

데이터베이스 관련 작업 시 반드시:

1. [ ] README.md의 "CLAUDE 필독" 섹션 읽기
2. [ ] .env 파일의 DATABASE_URL 확인
3. [ ] Supabase 연결인지 확인
4. [ ] 작업 내용을 사용자에게 설명하고 확인 받기
5. [ ] 데이터 손실 가능성이 있으면 명확히 경고

## 🔒 안전 장치

### 데이터 수가 다를 때:
```
로컬: 90개 vs 백업: 195개
→ 즉시 중단
→ 사용자에게 확인 요청
```

### 복원/삭제 명령 전:
```
"이 작업은 기존 데이터를 삭제합니다.
현재 데이터: [상세 정보]
복원 데이터: [상세 정보]
정말 진행하시겠습니까?"
```

## 📌 요약

1. **Supabase만 사용** - 로컬 DB 금지
2. **삭제/복원 금지** - 사용자 확인 없이 절대 불가
3. **읽기만 허용** - 쓰기는 신중히
4. **의심되면 물어보기** - 확실하지 않으면 사용자 확인

---

## 🎯 이 파일의 목적

이 파일은 Claude가 데이터베이스 작업 시 참고하는 **최우선 규칙**입니다.
다른 문서와 충돌하면 **이 파일이 우선**입니다.

**데이터 손실 사고를 절대 방지하기 위한 필수 규칙입니다.**
