# Phase 2 실제 구현 vs 구현 가이드 차이점 분석

> **작성일**: 2025-10-12
> **목적**: 구현 가이드와 실제 구현 간의 차이점을 식별하고 문서를 업데이트

---

## 🔍 전체 요약

Phase 2 구현 가이드는 **구현되지 않은 것으로 표시**되어 있으나, **실제로는 대부분 구현 완료**되었습니다.

**주요 발견사항**:
1. ✅ 모든 파일이 생성됨 (서비스, 컨트롤러, 라우트, 스키마)
2. ⚠️ **데이터 모델이 가이드와 다르게 구현됨** (중요!)
3. ⚠️ **일부 필드명과 구조가 변경됨**
4. ✅ 핵심 기능은 모두 구현됨 (이미지 업로드, GPS 검증, 캐싱)

---

## 📊 주요 차이점

### 1. Menu 모델 (가장 큰 차이점)

#### 가이드 사양:
```prisma
model Menu {
  id          String   @id @default(uuid())
  siteId      String   @map("site_id")
  date        DateTime  // ⚠️ 단일 날짜
  mealType    MealType @map("meal_type")

  // ⚠️ 이미지 2개
  imageUrl1   String?  @map("image_url_1")
  imageUrl2   String?  @map("image_url_2")
  thumbnailUrl1 String? @map("thumbnail_url_1")
  thumbnailUrl2 String? @map("thumbnail_url_2")

  menuText    String?  @map("menu_text") @db.Text  // ⚠️ menuText
  createdBy   String   @map("created_by")

  @@unique([siteId, date, mealType])
}
```

#### 실제 구현:
```prisma
model Menu {
  id           String    @id @default(uuid())
  siteId       String
  startDate    DateTime  @db.Date  // ✅ 날짜 범위 (변경됨!)
  endDate      DateTime  @db.Date  // ✅ 날짜 범위 (변경됨!)
  mealType     MealType

  // ✅ 이미지 1개만 (변경됨!)
  imageUrl     String?
  thumbnailUrl String?

  menuItems    String?   @db.Text  // ✅ menuItems (이름 변경!)
  mongoMetaId  String?   // ✅ MongoDB 메타데이터 (추가됨!)

  @@index([siteId, startDate])  // ⚠️ 유니크 제약 조건 없음!
}
```

**차이점 요약**:
| 항목 | 가이드 | 실제 구현 | 영향도 |
|-----|--------|----------|--------|
| 날짜 필드 | `date` (단일) | `startDate`, `endDate` (범위) | 🔴 **높음** |
| 이미지 개수 | 2개 | 1개 | 🔴 **높음** |
| 메뉴 텍스트 | `menuText` | `menuItems` | 🟡 중간 |
| 생성자 | `createdBy` | 없음 | 🟡 중간 |
| 메타데이터 | 없음 | `mongoMetaId` | 🟢 낮음 |
| 유니크 제약 | @@unique | 없음 | 🔴 **높음** |

---

### 2. MealPhoto 모델

#### 가이드 사양:
```prisma
model MealPhoto {
  id          String   @id @default(uuid())
  siteId      String   @map("site_id")

  // ⚠️ 날짜와 시간 분리
  photoDate   DateTime @map("photo_date")
  photoTime   DateTime @map("photo_time")
  mealType    MealType @map("meal_type")  // ⚠️ 필수

  imageUrl    String   @map("image_url")
  thumbnailUrl String  @map("thumbnail_url")

  // GPS
  latitude    Float
  longitude   Float
  isValidLocation Boolean @default(true) @map("is_valid_location")  // ⚠️ 있음

  // 메타데이터
  uploadedBy  String   @map("uploaded_by")
  uploadedAt  DateTime @default(now()) @map("uploaded_at")

  // 피드백
  feedback    String?  @db.Text
  feedbackBy  String?  @map("feedback_by")  // ⚠️ 있음
  feedbackAt  DateTime? @map("feedback_at")  // ⚠️ 있음
}
```

#### 실제 구현:
```prisma
model MealPhoto {
  id           String    @id @default(uuid())
  siteId       String
  uploaderId   String  // ✅ 이름 변경

  // ✅ 단일 timestamp (변경됨!)
  capturedAt   DateTime
  mealType     MealType?  // ✅ Optional! (변경됨!)
  photoType    PhotoType @default(SERVING)  // ✅ 새로운 필드!

  imageUrl     String
  thumbnailUrl String?

  // GPS
  latitude     Float?  // ✅ Optional!
  longitude    Float?  // ✅ Optional!
  // ⚠️ isValidLocation 필드 없음!

  // 피드백
  feedback     String?   @db.Text
  // ⚠️ feedbackBy, feedbackAt 필드 없음!

  mongoMetaId  String?  // ✅ MongoDB 메타데이터 (추가됨!)
}
```

**차이점 요약**:
| 항목 | 가이드 | 실제 구현 | 영향도 |
|-----|--------|----------|--------|
| 시간 필드 | `photoDate`, `photoTime` | `capturedAt` | 🟡 중간 |
| 사진 타입 | 없음 | `photoType` (SERVING/LEFTOVER/FACILITY) | 🔴 **높음** |
| GPS 검증 | `isValidLocation` | 없음 | 🔴 **높음** |
| 피드백 메타 | `feedbackBy`, `feedbackAt` | 없음 | 🟡 중간 |
| 끼니 타입 | 필수 | Optional | 🟡 중간 |
| GPS 좌표 | 필수 | Optional | 🟡 중간 |

---

### 3. Enum 차이점

#### MealType
**가이드**:
```prisma
enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK  // ⚠️ 간식
}
```

**실제**:
```prisma
enum MealType {
  BREAKFAST  // 조식
  LUNCH      // 중식
  DINNER     // 석식
  SUPPER     // ⚠️ 야식 (SNACK 대신!)
}
```

#### PhotoType (가이드에 없음!)
**실제 구현**:
```prisma
enum PhotoType {
  SERVING   // 배식 준비
  LEFTOVER  // 잔반
  FACILITY  // 시설
}
```

---

### 4. Service 레이어 차이점

#### Menu Service

**가이드 DTO**:
```typescript
export interface CreateMenuDto {
  siteId: string;
  date: Date;  // ⚠️ 단일 날짜
  mealType: MealType;
  menuText?: string;  // ⚠️ menuText
  images?: Express.Multer.File[];  // ⚠️ 최대 2개
}
```

**실제 구현 DTO**:
```typescript
export interface CreateMenuDto {
  siteId: string;
  startDate: Date;  // ✅ 날짜 범위
  endDate: Date;    // ✅ 날짜 범위
  mealType: MealType;
  menuItems?: string;  // ✅ menuItems
  image?: Express.Multer.File;  // ✅ 1개만!
}
```

#### MealPhoto Service

**가이드 DTO**:
```typescript
export interface CreateMealPhotoDto {
  siteId: string;
  photoDate: Date;  // ⚠️ 날짜
  photoTime: Date;  // ⚠️ 시간
  mealType: MealType;  // ⚠️ 필수
  image: Express.Multer.File;
  latitude: number;
  longitude: number;
}
```

**실제 구현 DTO**:
```typescript
export interface CreateMealPhotoDto {
  siteId: string;
  mealType?: MealType;  // ✅ Optional!
  photoType: PhotoType;  // ✅ 추가됨!
  capturedAt: Date;  // ✅ 단일 timestamp
  latitude?: number;  // ✅ Optional
  longitude?: number;  // ✅ Optional
  image: Express.Multer.File;
}
```

---

### 5. GPS 검증 로직 차이

#### 가이드:
- `isValidLocation` 필드에 검증 결과 저장
- 비정상 위치 사진 필터링 API 제공

#### 실제 구현:
- ✅ GPS 검증은 `meal-photo.service.ts`에서 수행됨
- ⚠️ 하지만 `isValidLocation` 필드가 DB에 없음!
- ⚠️ 검증 실패 시 에러만 throw하고 저장 안 함

**실제 코드**:
```typescript
// meal-photo.service.ts:66-85
const isWithinRange = checkGeofencing(userCoord, siteCoord, allowedRadius);

if (!isWithinRange) {
  const info = getGeofencingInfo(userCoord, siteCoord, allowedRadius);
  throw new Error(info.message);  // ⚠️ 저장 안 하고 에러!
}
```

---

### 6. 구현된 기능 vs 가이드 명세

| 기능 | 가이드 명세 | 실제 구현 | 상태 |
|------|-----------|----------|------|
| 이미지 업로드 | ✅ GCP Storage | ✅ GCP Storage (+ Mock 지원) | ✅ 완료 |
| 이미지 압축 | ✅ Sharp | ✅ Sharp | ✅ 완료 |
| 썸네일 생성 | ✅ 300px | ✅ 300px | ✅ 완료 |
| GPS 검증 | ✅ Geofencing | ✅ Geofencing (100m) | ✅ 완료 |
| Redis 캐싱 | ✅ 10분 | ✅ 10분 (menu), 10분 (photo) | ✅ 완료 |
| 그룹 일괄 등록 | ✅ 명세됨 | ✅ 구현됨 | ✅ 완료 |
| 주간/월간 조회 | ✅ 명세됨 | ✅ 구현됨 | ✅ 완료 |
| 식단 2개 이미지 | ✅ 명세됨 | ⚠️ 1개만 구현 | ⚠️ 차이 |
| GPS 결과 저장 | ✅ isValidLocation | ❌ 필드 없음 | ❌ 미구현 |
| 피드백 메타데이터 | ✅ feedbackBy/At | ❌ 필드 없음 | ❌ 미구현 |
| 비정상 위치 필터링 | ✅ 명세됨 | ❌ 필드 없음으로 불가능 | ❌ 미구현 |

---

## 📁 파일 생성 현황

### 가이드에서 생성 예정으로 명시한 파일

| 파일 | 가이드 | 실제 | 상태 |
|------|--------|------|------|
| `prisma/schema.prisma` | Menu, MealPhoto 모델 | ✅ 있음 (구조 다름) | ⚠️ 차이 |
| `src/config/gcp-storage.ts` | 50-80 라인 | ❌ 없음 (통합됨) | ⚠️ 차이 |
| `src/utils/image-processor.util.ts` | 300-400 라인 | ✅ 있음 | ✅ 완료 |
| `src/services/storage.service.ts` | 400-500 라인 | ✅ 227 라인 | ✅ 완료 |
| `src/services/menu.service.ts` | 600-800 라인 | ✅ 398 라인 | ✅ 완료 |
| `src/controllers/menu.controller.ts` | 400-500 라인 | ✅ 있음 | ✅ 완료 |
| `src/routes/menu.routes.ts` | 100-150 라인 | ✅ 있음 | ✅ 완료 |
| `src/services/meal-photo.service.ts` | 600-800 라인 | ✅ 556 라인 | ✅ 완료 |
| `src/controllers/meal-photo.controller.ts` | 400-500 라인 | ✅ 있음 | ✅ 완료 |
| `src/routes/meal-photo.routes.ts` | 100-150 라인 | ✅ 있음 | ✅ 완료 |

**추가 구현된 파일 (가이드에 없음)**:
- `backend/src/controllers/weekly-menu-template.controller.ts`
- `backend/src/services/weekly-menu-template.service.ts`
- `backend/src/routes/weekly-menu-template.routes.ts`
- `web/src/pages/menu/WeeklyMenuPage.tsx`
- `web/src/api/weekly-menu-template.api.ts`

---

## 🎯 권장 조치사항

### 1. 우선순위: 높음 (🔴)

#### A. 구현 가이드 업데이트
- [ ] Menu 모델 명세를 실제 구현에 맞게 수정
  - 단일 날짜 → 날짜 범위 (startDate/endDate)
  - 이미지 2개 → 이미지 1개
  - menuText → menuItems
- [ ] MealPhoto 모델 명세 수정
  - photoDate/photoTime → capturedAt
  - photoType 필드 추가
  - 선택적 필드 반영 (mealType?, latitude?, longitude?)
- [ ] MealType enum 수정 (SNACK → SUPPER)
- [ ] PhotoType enum 추가

#### B. 기능 보완 (선택적)
가이드 명세대로 구현하려면:
- [ ] Menu에 이미지 2개 지원 추가 (imageUrl2, thumbnailUrl2)
- [ ] MealPhoto에 isValidLocation 필드 추가
- [ ] MealPhoto에 feedbackBy, feedbackAt 필드 추가
- [ ] GPS 검증 실패 시에도 저장하고 isValidLocation=false로 표시
- [ ] 비정상 위치 사진 필터링 API 구현

### 2. 우선순위: 중간 (🟡)

- [ ] GCP Storage 설정 파일 분리 (`gcp-storage.ts`) 또는 가이드에서 제거
- [ ] 파일 라인 수 가이드라인 업데이트 (실제 구현 기준)
- [ ] 누락된 Relations 추가 (Menu.creator, MealPhoto.feedbackUser)

### 3. 우선순위: 낮음 (🟢)

- [ ] 구현_가이드_목차.md에서 Phase 2 상태를 "완료"로 업데이트
- [ ] 주간 식단표 템플릿 기능을 가이드에 추가 (이미 구현됨)

---

## 🔄 다음 단계

1. **결정 필요**:
   - **A안**: 가이드를 실제 구현에 맞춰 업데이트
   - **B안**: 실제 구현을 가이드 명세에 맞춰 수정
   - **C안**: 하이브리드 (중요한 부분만 맞춤)

2. **권장**: **A안** (가이드를 실제 구현에 맞춰 업데이트)
   - 이유: 실제 구현이 이미 동작하고 있고, 핵심 기능은 모두 구현됨
   - 장점: 빠른 문서화, 현실 반영
   - 단점: 일부 기능 (GPS 결과 저장, 피드백 메타) 누락

3. **Phase 2 체크리스트 업데이트**:
   ```
   ### Week 3: 식단 관리 (7개 작업)
   - [x] Task 3.1: Prisma 스키마 확장 (Menu 모델) ⚠️ 구조 다름
   - [x] Task 3.2: GCP Storage 설정 ⚠️ 통합 구현
   - [x] Task 3.3: 이미지 처리 유틸리티 ✅
   - [x] Task 3.4: Storage Service ✅
   - [x] Task 3.5: Menu Service ⚠️ DTO 다름
   - [x] Task 3.6: Menu Controller ✅
   - [x] Task 3.7: Menu Routes ✅

   ### Week 4: 배식 사진 관리 (4개 작업)
   - [x] Task 4.1: Prisma 스키마 확장 (MealPhoto 모델) ⚠️ 구조 다름
   - [x] Task 4.2: MealPhoto Service ⚠️ GPS 저장 안 됨
   - [x] Task 4.3: MealPhoto Controller ✅
   - [x] Task 4.4: MealPhoto Routes ✅
   ```

---

## 💡 결론

Phase 2는 **대부분 구현 완료**되었지만, **구현 방식이 가이드와 다름**.

**핵심 차이점**:
1. Menu는 날짜 범위로 구현 (단일 날짜 X)
2. Menu는 이미지 1개만 지원 (2개 X)
3. MealPhoto는 photoType으로 구분 (가이드에 없음)
4. GPS 검증 실패 시 저장 안 됨 (가이드는 저장)

**권장사항**: 구현 가이드를 실제 구현에 맞춰 업데이트하고, Phase 2 상태를 "완료"로 변경
