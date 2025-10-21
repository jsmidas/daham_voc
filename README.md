# 다함 VOC (Voice of Customer) 시스템

급식 서비스 관리 및 고객 피드백 통합 관리 시스템

---

## ⚠️ 중요: 개발 환경 설정 (CLAUDE 필독)

### 데이터베이스 환경 구분

이 프로젝트는 **개발용 DB**와 **배포용 DB**를 분리하여 사용합니다.

#### 🔵 개발 환경 (Development)
- **Supabase 클라우드 PostgreSQL 사용**
- 집/사무실 모든 환경에서 동일한 데이터로 작업
- `.env` 파일에서 `DATABASE_URL`을 Supabase 연결 문자열로 설정
- **설정 방법**: `docs/개발환경_설정가이드.md` 참고

#### 🟢 배포 환경 (Production)
- GCP Cloud SQL 또는 별도 운영 DB 사용
- 실제 서비스 데이터 저장
- 환경변수로 자동 전환

### 개발 시작 전 체크리스트

1. **`.env` 파일 확인**
   - `backend/.env` 파일의 `DATABASE_URL`이 Supabase로 설정되어 있는지 확인
   - Supabase 프로젝트가 없으면 `docs/개발환경_설정가이드.md` 참고

2. **패키지 설치**
   ```bash
   npm install  # 루트 디렉토리에서 실행 (모든 워크스페이스)
   ```

3. **Prisma 클라이언트 생성**
   ```bash
   cd backend
   npx prisma generate
   ```

4. **서버 실행**
   ```bash
   # 백엔드 (터미널 1)
   cd backend
   npm run dev

   # 웹 프론트엔드 (터미널 2)
   cd web
   npm run dev
   ```

---

## 프로젝트 구조

```
daham_voc/
├── backend/          # Node.js + Express + Prisma API 서버
├── web/              # React + Vite 관리자 웹 애플리케이션
├── mobile/           # React Native Expo 모바일 앱 (서브모듈)
└── docs/             # 프로젝트 문서
```

## 기술 스택

### Backend
- Node.js + Express
- PostgreSQL (Prisma ORM)
- MongoDB (로그 및 이미지 메타데이터)
- Redis (캐싱)
- GCP Storage (이미지 저장)

### Web (관리자)
- React 18 + Vite
- TypeScript
- Ant Design
- React Query
- React Router

### Mobile
- React Native Expo
- TypeScript
- React Navigation
- React Query

## 주요 기능

- 사업장 관리
- 직원 출퇴근 관리
- 식수 인원 관리
- 배식 사진 업로드
- 주간 식단표 관리
- VOC (고객 피드백) 관리
- 배송 코스 관리

## 문서

- [개발 환경 설정 가이드](docs/개발환경_설정가이드.md) ⭐ **필수**
- [배송 코스 시스템 검토서](배송코스_시스템_검토서.md)
- [배송 코스 관리 구현 가이드](구현_가이드_배송코스관리.md)
- [배포 워크플로우](구현_가이드_배포_워크플로우.md)

## 환경 변수

주요 환경 변수는 `backend/.env` 파일에서 설정합니다.

```bash
# 개발 환경 예시
DATABASE_URL=postgresql://[supabase-connection-string]
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
```

자세한 설정은 `backend/.env.example` 파일을 참고하세요.

## 라이선스

Private - 다함푸드시스템
