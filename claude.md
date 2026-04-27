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

### 3. 데이터베이스 연결 ⭐ 확정 설정

**반드시 이 설정을 사용할 것** (2025-10-22 확정):
```bash
# backend/.env 파일 (실제 비밀번호는 .env 파일에서만 관리)
DATABASE_URL=postgresql://postgres.iyussgoqhgzogjvpuxnb:<PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.iyussgoqhgzogjvpuxnb:<PASSWORD>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```
⚠️ **실제 비밀번호는 절대 이 파일에 기록하지 말 것** (GitHub 공개 저장소 노출 위험)

**포트 설명**:
- **6543**: Transaction mode - 일반 연결용 (메인 사용)
- **5432**: Session mode - Prisma 마이그레이션 전용

**절대 사용하면 안 되는 것**:
```bash
❌ DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daham_voc
❌ 포트 6543을 다른 것으로 변경
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
1. .env 파일이 Supabase URL(포트 6543)인지 확인
2. Supabase에 연결되어 있는지 확인
3. 애플리케이션에서 데이터 조회 테스트

**절대 하지 말 것**:
- ❌ 백업 파일 찾기
- ❌ pg_restore 실행
- ❌ 데이터 복원 시도

## 📋 작업 전 체크리스트

데이터베이스 관련 작업 시 반드시:

1. [ ] DATABASE_CONFIRMED.md 확인 (확정된 설정)
2. [ ] .env 파일의 DATABASE_URL 확인 (포트 6543)
3. [ ] Supabase 연결인지 확인
4. [ ] 작업 내용을 사용자에게 설명하고 확인 받기
5. [ ] 데이터 손실 가능성이 있으면 명확히 경고

## 🔒 안전 장치

### 데이터 수가 다를 때:
```
기대값: Site 90개, MenuType 28개, User 7개
실제값: [확인 필요]
→ 다르면 즉시 중단
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

1. **Supabase 포트 6543만 사용** - 로컬 DB 금지
2. **삭제/복원 금지** - 사용자 확인 없이 절대 불가
3. **읽기만 허용** - 쓰기는 신중히
4. **의심되면 물어보기** - 확실하지 않으면 사용자 확인

## 📦 백업 정보

- **최신 백업**: `backup/daham_voc_backup_20251022_205721.dump`
- **백업 일시**: 2025-10-22 20:57:21
- **데이터 현황**: Site 90개, MenuType 28개, User 7개, SiteGroup 7개

---

## 🎯 이 파일의 목적

이 파일은 Claude가 데이터베이스 작업 시 참고하는 **최우선 규칙**입니다.
다른 문서와 충돌하면 **이 파일이 우선**입니다.

**데이터 손실 사고를 절대 방지하기 위한 필수 규칙입니다.**

**마지막 업데이트**: 2025-10-22 20:57
**확정 설정**: DATABASE_CONFIRMED.md 참조

---

## 🚀 배포 구조

### 백엔드 / 웹 (자동 배포)
- `main` 브랜치 push → GitHub Actions → GCP VM 자동 배포
- GCP VM: `34.47.75.181` (사용자: `sos1253`)
- PM2로 프로세스 관리, Nginx 리버스 프록시
- 백엔드: `https://api.dahamvoc.co.kr`
- 웹 관리자: `https://admin.dahamvoc.co.kr`

### 모바일 앱 (수동 빌드)
```bash
cd mobile

# 테스트용 APK 빌드
eas build --platform android --profile preview

# 운영 빌드 (Google Play AAB)
eas build --platform android --profile production

# 운영 빌드 + Google Play 자동 제출
eas build --platform android --profile production --auto-submit
```
- 빌드 프로필: `preview`(APK 테스트), `production`(Google Play), `production-apk`(운영 APK)
- 앱 재빌드 시 Google Play 재제출 필요 → 백엔드만 변경 시 앱 빌드 불필요
- API 응답 구조 변경 시 **기존 앱 하위 호환** 필수

### 사용자 선호사항
- 모바일 테스트 시 **QR 코드 설치 방식** 선호
- CLAUDE.md는 **항상 최신 상태로 유지**할 것

## GCP 예상 월 과금 내역

GCP 프로젝트 ID: `daham-food` (표시 이름: 다함 VOC)

| 항목 | 대략적 비용 |
|------|------------|
| e2-small VM (24시간) | ~$15-20/월 |
| 30GB 디스크 | ~$1-2/월 |
| Cloud Storage | 용량에 따라 소액 |
| 네트워크 트래픽 | 사용량에 따라 |

**마지막 업데이트**: 2026-04-04

---

## 🔥 Firebase (FCM 푸시 알림 전용)

### 사용 목적
Firebase는 **Android 푸시 알림(FCM) 발송 용도로만 사용**합니다.
- DB는 Supabase, 사진 저장은 GCS, 인증은 자체 JWT — Firebase가 제공하는 다른 서비스(Firestore/Auth/Hosting)는 사용하지 않음
- **Android 푸시는 FCM이 강제** (구글 정책) → 백엔드를 어디에 호스팅하든 FCM 등록은 필수
- iOS 푸시는 추후 활성화 예정 (APNs 인증서 별도 발급 필요)

### Firebase 프로젝트 정보
- **프로젝트 ID**: `daham-food` (표시 이름: `daham-voc`)
- 같은 GCP 프로젝트(`daham-food`)에 Firebase 기능을 추가한 형태
- Firebase 콘솔: https://console.firebase.google.com/project/daham-food
- Android 패키지명: `com.daham.voc`

### 필수 자격증명 파일
| 파일 | 위치 | git | 용도 |
|---|---|---|---|
| `google-services.json` | [mobile/google-services.json](mobile/google-services.json) | ✅ 커밋 | 클라이언트 설정 (api_key는 packageName+SHA-1 제한이라 공개 안전) |
| `fcm-key.json` (Firebase Admin SDK private key) | mobile/ 또는 sample/ | ❌ gitignore | Expo Push Service 가 FCM 호출할 때 사용. **EAS credentials 에 업로드** |

### EAS credentials 설정 (이미 완료)
```bash
cd mobile
eas credentials
# Android → production → Google Service Account
# → Manage your Google Service Account Key for Push Notifications (FCM V1)
# → Set up → fcm-key.json 선택
```
새 키 발급 위치: https://console.firebase.google.com/project/daham-food/settings/serviceaccounts/adminsdk

### 푸시 발송 흐름
```
[웹/관리자 공지 작성]
    ↓ POST /notices (sendPush=true)
[GCP VM 백엔드]
    ↓ pushTokenService 로 대상자 활성 토큰 조회
    ↓ pushSendService → fetch('https://exp.host/--/api/v2/push/send')
[Expo Push Service]
    ↓ FCM v1 API 로 forwarding (등록된 fcm-key.json 사용)
[Firebase FCM]
    ↓
[Android 폰] → OS 알림센터에 표시
```

### 푸시 관련 코드 위치
- 모바일: [usePushNotifications.ts](mobile/src/hooks/usePushNotifications.ts) (토큰 발급/등록 + 알림 탭 시 공지 상세 이동)
- 백엔드: [push-token.service.ts](backend/src/services/push-token.service.ts), [push-send.service.ts](backend/src/services/push-send.service.ts)
- 공지 등록 시 자동 발송: [notice.service.ts](backend/src/services/notice.service.ts) `sendPushForNotice()`

### 주의사항
- 푸시 코드 자체(JS/TSX)는 OTA 가능, 다만 **expo-notifications 모듈 자체는 1.0.4 빌드부터 포함**
- 1.0.3 이하 사용자는 앱 업데이트해야 푸시 받을 수 있음 (자동 업데이트 ON 사용자는 며칠 내 마이그)
- `fcm-key.json` 누설 시 즉시 Firebase 콘솔에서 키 폐기 후 재발급 → EAS credentials 재등록

---

## 📱 모바일 앱 역할별 메뉴 정의

### 역할 계층
- **SUPER_ADMIN**: 최상위 관리자 (전체)
- **HQ_ADMIN**: 본사 관리자 (본사 지역 = 그룹관리자)
- **YEONGNAM_ADMIN**: 영남 관리자 (영남 지역 = 그룹관리자)
- **GROUP_MANAGER**: 그룹 관리자
- **SITE_MANAGER**: 사업장 관리자
- **SITE_STAFF**: 사업장 담당자 (현장 근무자)
- **DELIVERY_DRIVER**: 배송 기사
- **CLIENT**: 고객사 (사업장 담당)
- **CUSTOMER**: 일반 고객 (셀프 가입, 사업장 코드 기반)

### 역할별 기능 매트릭스

| 기능 | 슈퍼관리자 | 본사/영남/그룹 | 사업장관리자 | 사업장담당자 | 배송기사 | 고객사 | 고객 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 홈(오늘의 근무) | X | X | X | O | - | - | - |
| 배식사진 입력 | - | - | - | O | O | - | - |
| 배식사진 조회 | 전체 | 관리지역 | 관리지역 | 자기 사업장 | 코스 사업장 | 자기 사업장 | 자기 사업장 |
| 식수 입력 | - | - | - | O | O | O | 식사유무 |
| 식수 조회 | 전체 | 관리지역 | 관리지역 | 자기 사업장 | 코스 사업장 | 자기 사업장 | - |
| 식단표 | 전체 | 관리지역 | 관리지역 | 자기 사업장 | 코스 사업장 | 자기 사업장 | 자기 사업장 |
| 배송코스 | 전체 | 관리지역 | 관리지역 | - | 자기 코스 | - | - |
| VOC 조회 | 전체 | 관리지역 | 관리지역 | 자기 사업장 | 코스 사업장 | 고객VOC | 자기 VOC |
| VOC 입력 | O | O | O | O | O | O | O |
| 계약서 | 현황 | 현황 | 현황 | 대상자만 | 대상자만 | - | - |
| 출퇴근 | - | - | - | 설정자만 | - | - | - |

### 조건부 표시
- **출퇴근 탭**: `canUseAttendance=true`인 사용자만
- **계약서 탭**: `isContractTarget=true`인 사용자만 (관리자는 현황 조회용으로 항상 표시)
- **배송 탭**: 배송기사 역할만
- **고객(CUSTOMER)**: 사업장 코드로 셀프 회원가입, 해당 사업장에 자동 배정
