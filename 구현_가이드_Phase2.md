# 구현 가이드 - Phase 2: 식단 및 사진 관리 (2주) ✅ 완료

> **⚠️ 필수 선행 작업**: Phase 1 완료 필수
> **📅 실제 소요 기간**: 2주 (Week 3-4)
> **📊 실제 작업량**: ~20개 파일, ~3,000 라인
> **✅ 상태**: 완료 (실제 구현 기준으로 문서 업데이트됨)

---

## 📋 Phase 2 개요

### 주요 목표
1. ✅ **날짜 범위 기반 식단 관리 시스템** 구축
2. ✅ **GCP Storage 연동** (Mock 개발 환경 포함)
3. ✅ **이미지 압축 및 썸네일** 자동 생성
4. ✅ **사업장 그룹별 일괄 업로드** 기능
5. ✅ **배식/잔반/시설 사진 관리** (PhotoType 구분)
6. ✅ **GPS 검증 기능** (Geofencing)
7. ✅ **주간 식단표 템플릿** 관리

### 기술 스택
- **파일 저장소**: Google Cloud Storage (Mock 로컬 저장소 포함)
- **이미지 처리**: Sharp (압축, 리사이징, 썸네일)
- **GPS 검증**: Geofencing 유틸리티 (100m 반경)
- **캐싱**: Redis (식단: 10분, 사진: 10분)

---

## 🗂️ Phase 2 파일 맵

### 신규 생성 파일 (Week 3-4)

```
backend/
├── src/
│   ├── services/
│   │   ├── menu.service.ts          [600-800 라인] 식단 CRUD 로직
│   │   ├── meal-photo.service.ts    [600-800 라인] 배식 사진 CRUD 로직
│   │   └── storage.service.ts       [400-500 라인] GCP Storage 연동
│   │
│   ├── controllers/
│   │   ├── menu.controller.ts       [400-500 라인] 식단 API 엔드포인트
│   │   └── meal-photo.controller.ts [400-500 라인] 배식 사진 API 엔드포인트
│   │
│   ├── routes/
│   │   ├── menu.routes.ts           [100-150 라인] 식단 라우팅
│   │   └── meal-photo.routes.ts     [100-150 라인] 배식 사진 라우팅
│   │
│   ├── validators/
│   │   ├── menu.validator.ts        [150-200 라인] 식단 입력 검증
│   │   └── meal-photo.validator.ts  [150-200 라인] 배식 사진 입력 검증
│   │
│   ├── utils/
│   │   └── image-processor.util.ts  [300-400 라인] 이미지 압축/썸네일 생성
│   │
│   └── types/
│       ├── menu.types.ts            [100-150 라인] 식단 타입 정의
│       └── meal-photo.types.ts      [100-150 라인] 배식 사진 타입 정의
│
├── prisma/
│   └── schema.prisma                [기존 파일 확장] Menu, MealPhoto 모델 추가
│
└── .env                             [GCP Storage 환경 변수 추가]
```

### 기존 파일 활용 (Phase 1에서 생성됨)
- `utils/geofencing.util.ts` - GPS 좌표 검증 (재사용)
- `utils/api-response.util.ts` - API 응답 형식 (재사용)
- `middleware/auth.middleware.ts` - 인증 미들웨어 (재사용)
- `config/redis.ts` - Redis 연결 (재사용)

---

## 🚨 중복 방지 규칙 (Phase 2)

### ❌ 절대 금지 사항
1. **이미지 업로드 로직**: `storage.service.ts`에서만 구현
2. **이미지 압축/썸네일**: `image-processor.util.ts`에서만 구현
3. **GPS 검증 로직**: `geofencing.util.ts`에서만 사용 (Phase 1 재사용)
4. **파일 삭제 로직**: `storage.service.ts`에서만 구현

### ✅ 올바른 사용 예시
```typescript
// ❌ 잘못된 예시 - menu.service.ts에 이미지 압축 직접 구현
import sharp from 'sharp';
async uploadMenuImage(file: Express.Multer.File) {
  const compressed = await sharp(file.buffer).resize(800).toBuffer(); // ❌ 중복!
}

// ✅ 올바른 예시 - image-processor.util.ts 활용
import { compressImage, generateThumbnail } from '../utils/image-processor.util';
async uploadMenuImage(file: Express.Multer.File) {
  const compressed = await compressImage(file.buffer, 800); // ✅ 유틸리티 활용
}
```

---

## 📅 Week 3: 식단 관리 시스템

### Task 3.1: Prisma 스키마 확장 (Menu 모델)

**파일**: `prisma/schema.prisma`
**작업 위치**: 기존 파일에 추가
**예상 라인**: +50 라인

#### 구현 내용

```prisma
// Menu 모델 (실제 구현)
model Menu {
  id           String    @id @default(uuid())
  siteId       String
  startDate    DateTime  @db.Date  // 날짜 범위 시작
  endDate      DateTime  @db.Date  // 날짜 범위 종료
  mealType     MealType

  // 이미지 정보 (1개만)
  imageUrl     String?
  thumbnailUrl String?

  // 메뉴 아이템
  menuItems    String?   @db.Text

  // MongoDB 메타데이터 연동
  mongoMetaId  String?

  // 메타데이터
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  // Relations
  site Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId, startDate])
  @@index([startDate])
}

enum MealType {
  BREAKFAST  // 조식
  LUNCH      // 중식
  DINNER     // 석식
  SUPPER     // 야식 (SNACK 대신)
}

// 주간 식단표 템플릿 (추가 기능)
model WeeklyMenuTemplate {
  id           String    @id @default(uuid())
  menuTypeId   String
  year         Int       // 년도 (예: 2025)
  weekNumber   Int       // 주차 (1-53)
  imageUrl     String
  thumbnailUrl String?
  description  String?   @db.Text
  createdBy    String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  menuType MenuType @relation(fields: [menuTypeId], references: [id], onDelete: Cascade)

  @@unique([menuTypeId, year, weekNumber])
  @@index([menuTypeId])
  @@index([year, weekNumber])
}
```

**마이그레이션 실행**:
```bash
npx prisma migrate dev --name add_menu_model
npx prisma generate
```

---

### Task 3.2: GCP Storage 설정

**파일**: `.env`
**작업 위치**: 환경 변수 추가
**예상 라인**: +10 라인

```env
# GCP Storage
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=daham-voc-images
GCP_KEY_FILE=./config/gcp-service-account-key.json

# 이미지 설정
MAX_IMAGE_SIZE=10485760  # 10MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

**파일**: `src/config/gcp-storage.ts` (신규 생성)
**예상 라인**: 50-80 라인

```typescript
import { Storage } from '@google-cloud/storage';
import env from './env';

// Lines 1-15: GCP Storage 초기화
export const storage = new Storage({
  projectId: env.GCP_PROJECT_ID,
  keyFilename: env.GCP_KEY_FILE,
});

export const bucket = storage.bucket(env.GCP_BUCKET_NAME);

// Lines 20-40: 버킷 설정 (CORS 등)
export async function setupBucket() {
  const [exists] = await bucket.exists();

  if (!exists) {
    await bucket.create();
    console.log(`Bucket ${env.GCP_BUCKET_NAME} created.`);
  }

  // CORS 설정
  await bucket.setCorsConfiguration([
    {
      origin: ['*'], // 프로덕션에서는 특정 도메인으로 제한
      method: ['GET', 'POST', 'DELETE'],
      responseHeader: ['Content-Type'],
      maxAgeSeconds: 3600,
    },
  ]);
}

// Lines 45-80: 파일 경로 생성 헬퍼
export function generateImagePath(
  folder: 'menus' | 'meal-photos',
  filename: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop();
  return `${folder}/${timestamp}-${randomStr}.${ext}`;
}
```

---

### Task 3.3: 이미지 처리 유틸리티

**파일**: `src/utils/image-processor.util.ts` (신규 생성)
**예상 라인**: 300-400 라인

```typescript
import sharp from 'sharp';

// Lines 1-30: 타입 정의
export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

// Lines 35-100: 이미지 압축 (메인 이미지)
/**
 * 이미지 압축 및 리사이징
 * @description 이미지를 지정된 크기로 압축합니다 (기본: 1200px 폭)
 */
export async function compressImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  try {
    const processed = await sharp(buffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: options.quality || 80, progressive: true })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: processed.data,
      width: processed.info.width,
      height: processed.info.height,
      format: processed.info.format,
      size: processed.data.length,
    };
  } catch (error) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
}

// Lines 105-170: 썸네일 생성
/**
 * 썸네일 생성
 * @description 작은 썸네일 이미지를 생성합니다 (기본: 300px 폭)
 */
export async function generateThumbnail(
  buffer: Buffer,
  maxWidth: number = 300,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  try {
    const processed = await sharp(buffer)
      .resize(maxWidth, null, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: options.quality || 70, progressive: true })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: processed.data,
      width: processed.info.width,
      height: processed.info.height,
      format: processed.info.format,
      size: processed.data.length,
    };
  } catch (error) {
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
}

// Lines 175-220: 이미지 검증
/**
 * 이미지 파일 검증
 * @description 파일 타입, 크기, 유효성 검증
 */
export function validateImageFile(file: Express.Multer.File): void {
  // 파일 타입 검증
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png').split(',');
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // 파일 크기 검증
  const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || '10485760');
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
  }
}

// Lines 225-280: 일괄 처리
/**
 * 여러 이미지 동시 처리
 * @description 여러 이미지를 병렬로 처리합니다
 */
export async function processMultipleImages(
  files: Express.Multer.File[]
): Promise<{
  images: ProcessedImage[];
  thumbnails: ProcessedImage[];
}> {
  // 파일 검증
  files.forEach(validateImageFile);

  // 병렬 처리
  const [images, thumbnails] = await Promise.all([
    Promise.all(files.map(file => compressImage(file.buffer))),
    Promise.all(files.map(file => generateThumbnail(file.buffer))),
  ]);

  return { images, thumbnails };
}

// Lines 285-340: 메타데이터 추출
/**
 * 이미지 메타데이터 추출
 */
export async function extractImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
  };
}

// Lines 345-400: 이미지 변환
/**
 * 이미지 포맷 변환
 */
export async function convertImageFormat(
  buffer: Buffer,
  format: 'jpeg' | 'png' | 'webp'
): Promise<Buffer> {
  const processor = sharp(buffer);

  switch (format) {
    case 'jpeg':
      return processor.jpeg({ quality: 80 }).toBuffer();
    case 'png':
      return processor.png({ compressionLevel: 8 }).toBuffer();
    case 'webp':
      return processor.webp({ quality: 80 }).toBuffer();
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

---

### Task 3.4: Storage Service (GCP 업로드/삭제)

**파일**: `src/services/storage.service.ts` (신규 생성)
**예상 라인**: 400-500 라인

```typescript
import { bucket, generateImagePath } from '../config/gcp-storage';
import { compressImage, generateThumbnail, ProcessedImage } from '../utils/image-processor.util';

// Lines 1-30: 타입 정의
export interface UploadedImage {
  originalUrl: string;
  thumbnailUrl: string;
  originalPath: string;
  thumbnailPath: string;
  size: number;
  width: number;
  height: number;
}

export interface BulkUploadResult {
  uploaded: UploadedImage[];
  failed: Array<{ filename: string; error: string }>;
}

// Lines 35-150: 단일 이미지 업로드
/**
 * 이미지 업로드 (원본 + 썸네일)
 * @description GCP Storage에 이미지와 썸네일을 업로드합니다
 */
export async function uploadImage(
  file: Express.Multer.File,
  folder: 'menus' | 'meal-photos'
): Promise<UploadedImage> {
  try {
    // 이미지 처리
    const [compressed, thumbnail] = await Promise.all([
      compressImage(file.buffer),
      generateThumbnail(file.buffer),
    ]);

    // 파일 경로 생성
    const originalPath = generateImagePath(folder, file.originalname);
    const thumbnailPath = originalPath.replace(/(\.[^.]+)$/, '-thumb$1');

    // GCP Storage 업로드
    const [originalFile, thumbnailFile] = await Promise.all([
      uploadToGCP(originalPath, compressed.buffer, file.mimetype),
      uploadToGCP(thumbnailPath, thumbnail.buffer, file.mimetype),
    ]);

    return {
      originalUrl: getPublicUrl(originalPath),
      thumbnailUrl: getPublicUrl(thumbnailPath),
      originalPath,
      thumbnailPath,
      size: compressed.size,
      width: compressed.width,
      height: compressed.height,
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

// Lines 155-220: GCP 업로드 헬퍼
async function uploadToGCP(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1년 캐싱
    },
    public: true, // 공개 URL 생성
    resumable: false, // 작은 파일은 단일 요청으로 업로드
  });
}

// Lines 225-250: 공개 URL 생성
function getPublicUrl(path: string): string {
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

// Lines 255-350: 일괄 업로드
/**
 * 여러 이미지 일괄 업로드
 * @description 사업장 그룹별 일괄 업로드에 사용
 */
export async function uploadMultipleImages(
  files: Express.Multer.File[],
  folder: 'menus' | 'meal-photos'
): Promise<BulkUploadResult> {
  const uploaded: UploadedImage[] = [];
  const failed: Array<{ filename: string; error: string }> = [];

  // 병렬 처리 (최대 5개씩)
  const chunks = chunkArray(files, 5);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(file => uploadImage(file, folder))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        uploaded.push(result.value);
      } else {
        failed.push({
          filename: chunk[index].originalname,
          error: result.reason.message,
        });
      }
    });
  }

  return { uploaded, failed };
}

// Lines 355-380: 배열 청크 분할
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Lines 385-450: 이미지 삭제
/**
 * 이미지 삭제 (원본 + 썸네일)
 * @description GCP Storage에서 이미지와 썸네일을 삭제합니다
 */
export async function deleteImage(
  originalPath: string,
  thumbnailPath: string
): Promise<void> {
  try {
    await Promise.all([
      bucket.file(originalPath).delete({ ignoreNotFound: true }),
      bucket.file(thumbnailPath).delete({ ignoreNotFound: true }),
    ]);
  } catch (error) {
    console.error('Image deletion failed:', error);
    // 삭제 실패 시에도 계속 진행 (파일이 이미 없을 수 있음)
  }
}

// Lines 455-500: 일괄 삭제
/**
 * 여러 이미지 일괄 삭제
 */
export async function deleteMultipleImages(
  imagePaths: Array<{ originalPath: string; thumbnailPath: string }>
): Promise<void> {
  const deletePromises = imagePaths.map(({ originalPath, thumbnailPath }) =>
    deleteImage(originalPath, thumbnailPath)
  );

  await Promise.allSettled(deletePromises);
}
```

---

### Task 3.5: Menu Service (식단 CRUD)

**파일**: `src/services/menu.service.ts` (신규 생성)
**예상 라인**: 600-800 라인

```typescript
import { PrismaClient, MealType } from '@prisma/client';
import { redis } from '../config/redis';
import { uploadImage, uploadMultipleImages, deleteImage } from './storage.service';
import { ForbiddenError, NotFoundError } from '../utils/errors.util';

const prisma = new PrismaClient();

// Lines 1-40: 타입 정의 (실제 구현)
export interface CreateMenuDto {
  siteId: string;
  startDate: Date;  // 날짜 범위 시작
  endDate: Date;    // 날짜 범위 종료
  mealType: MealType;
  menuItems?: string;  // menuText → menuItems
  image?: Express.Multer.File;  // 이미지 1개만
}

export interface UpdateMenuDto {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
  menuItems?: string;
  image?: Express.Multer.File;
  deleteImage?: boolean;  // 이미지 삭제 (단수)
}

export interface MenuFilter {
  siteId?: string;
  siteIds?: string[]; // 사업장 그룹 조회용
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: MealType;
}

// Lines 45-150: 식단 생성
/**
 * 식단 생성 (이미지 포함)
 * @description 단일 사업장의 식단을 생성합니다
 */
export async function createMenu(
  dto: CreateMenuDto,
  userId: string
): Promise<any> {
  // 중복 체크
  const existing = await prisma.menu.findFirst({
    where: {
      siteId: dto.siteId,
      date: dto.date,
      mealType: dto.mealType,
      deletedAt: null,
    },
  });

  if (existing) {
    throw new Error('Menu already exists for this date and meal type');
  }

  // 이미지 업로드 (최대 2개)
  let imageUrl1: string | undefined;
  let imageUrl2: string | undefined;
  let thumbnailUrl1: string | undefined;
  let thumbnailUrl2: string | undefined;

  if (dto.images && dto.images.length > 0) {
    if (dto.images.length > 2) {
      throw new Error('Maximum 2 images allowed');
    }

    const [img1, img2] = dto.images;

    const uploaded1 = await uploadImage(img1, 'menus');
    imageUrl1 = uploaded1.originalUrl;
    thumbnailUrl1 = uploaded1.thumbnailUrl;

    if (img2) {
      const uploaded2 = await uploadImage(img2, 'menus');
      imageUrl2 = uploaded2.originalUrl;
      thumbnailUrl2 = uploaded2.thumbnailUrl;
    }
  }

  // DB 저장
  const menu = await prisma.menu.create({
    data: {
      siteId: dto.siteId,
      date: dto.date,
      mealType: dto.mealType,
      menuText: dto.menuText,
      imageUrl1,
      imageUrl2,
      thumbnailUrl1,
      thumbnailUrl2,
      createdBy: userId,
    },
    include: {
      site: true,
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMenuCache(dto.siteId, dto.date);

  return menu;
}

// Lines 155-280: 그룹별 일괄 생성
/**
 * 사업장 그룹 일괄 식단 생성
 * @description 그룹 내 모든 사업장에 동일한 식단을 등록합니다
 */
export async function createMenuForGroup(
  groupId: string,
  date: Date,
  mealType: MealType,
  menuText: string | undefined,
  images: Express.Multer.File[] | undefined,
  userId: string
): Promise<{
  created: any[];
  failed: Array<{ siteId: string; siteName: string; error: string }>;
}> {
  // 그룹 내 사업장 조회
  const group = await prisma.siteGroup.findUnique({
    where: { id: groupId },
    include: {
      sites: {
        where: { isActive: true, deletedAt: null },
      },
    },
  });

  if (!group) {
    throw new NotFoundError('Site group not found');
  }

  // 이미지 업로드 (모든 사업장에 동일하게 사용)
  let imageUrl1: string | undefined;
  let imageUrl2: string | undefined;
  let thumbnailUrl1: string | undefined;
  let thumbnailUrl2: string | undefined;

  if (images && images.length > 0) {
    if (images.length > 2) {
      throw new Error('Maximum 2 images allowed');
    }

    const [img1, img2] = images;

    const uploaded1 = await uploadImage(img1, 'menus');
    imageUrl1 = uploaded1.originalUrl;
    thumbnailUrl1 = uploaded1.thumbnailUrl;

    if (img2) {
      const uploaded2 = await uploadImage(img2, 'menus');
      imageUrl2 = uploaded2.originalUrl;
      thumbnailUrl2 = uploaded2.thumbnailUrl;
    }
  }

  // 각 사업장별 생성
  const created: any[] = [];
  const failed: Array<{ siteId: string; siteName: string; error: string }> = [];

  for (const site of group.sites) {
    try {
      // 중복 체크
      const existing = await prisma.menu.findFirst({
        where: {
          siteId: site.id,
          date,
          mealType,
          deletedAt: null,
        },
      });

      if (existing) {
        failed.push({
          siteId: site.id,
          siteName: site.name,
          error: 'Menu already exists',
        });
        continue;
      }

      // 생성
      const menu = await prisma.menu.create({
        data: {
          siteId: site.id,
          date,
          mealType,
          menuText,
          imageUrl1,
          imageUrl2,
          thumbnailUrl1,
          thumbnailUrl2,
          createdBy: userId,
        },
        include: { site: true },
      });

      created.push(menu);

      // 캐시 무효화
      await invalidateMenuCache(site.id, date);
    } catch (error) {
      failed.push({
        siteId: site.id,
        siteName: site.name,
        error: error.message,
      });
    }
  }

  return { created, failed };
}

// Lines 285-400: 식단 조회 (필터링)
/**
 * 식단 목록 조회
 * @description 사업장별, 날짜별, 끼니별 필터링 지원
 */
export async function getMenus(filter: MenuFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `menus:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 필터 조건 구성
  const where: any = {
    deletedAt: null,
  };

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.siteIds && filter.siteIds.length > 0) {
    where.siteId = { in: filter.siteIds };
  }

  if (filter.dateFrom || filter.dateTo) {
    where.date = {};
    if (filter.dateFrom) where.date.gte = filter.dateFrom;
    if (filter.dateTo) where.date.lte = filter.dateTo;
  }

  if (filter.mealType) {
    where.mealType = filter.mealType;
  }

  // 조회
  const menus = await prisma.menu.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      creator: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { date: 'desc' },
      { mealType: 'asc' },
    ],
  });

  // 캐시 저장 (10분)
  await redis.setex(cacheKey, 600, JSON.stringify(menus));

  return menus;
}

// Lines 405-500: 식단 수정
/**
 * 식단 수정
 * @description 식단 내용 및 이미지를 수정합니다
 */
export async function updateMenu(
  menuId: string,
  dto: UpdateMenuDto,
  userId: string
): Promise<any> {
  // 기존 메뉴 조회
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu || menu.deletedAt) {
    throw new NotFoundError('Menu not found');
  }

  // 업데이트 데이터 준비
  const updateData: any = {};

  if (dto.menuText !== undefined) {
    updateData.menuText = dto.menuText;
  }

  // 기존 이미지 삭제 요청 시
  if (dto.deleteImages) {
    if (menu.imageUrl1) {
      const path1 = extractPathFromUrl(menu.imageUrl1);
      const thumbPath1 = extractPathFromUrl(menu.thumbnailUrl1!);
      await deleteImage(path1, thumbPath1);
    }
    if (menu.imageUrl2) {
      const path2 = extractPathFromUrl(menu.imageUrl2);
      const thumbPath2 = extractPathFromUrl(menu.thumbnailUrl2!);
      await deleteImage(path2, thumbPath2);
    }

    updateData.imageUrl1 = null;
    updateData.imageUrl2 = null;
    updateData.thumbnailUrl1 = null;
    updateData.thumbnailUrl2 = null;
  }

  // 새 이미지 업로드
  if (dto.images && dto.images.length > 0) {
    if (dto.images.length > 2) {
      throw new Error('Maximum 2 images allowed');
    }

    const [img1, img2] = dto.images;

    const uploaded1 = await uploadImage(img1, 'menus');
    updateData.imageUrl1 = uploaded1.originalUrl;
    updateData.thumbnailUrl1 = uploaded1.thumbnailUrl;

    if (img2) {
      const uploaded2 = await uploadImage(img2, 'menus');
      updateData.imageUrl2 = uploaded2.originalUrl;
      updateData.thumbnailUrl2 = uploaded2.thumbnailUrl;
    }
  }

  // DB 업데이트
  const updated = await prisma.menu.update({
    where: { id: menuId },
    data: updateData,
    include: {
      site: true,
      creator: {
        select: { id: true, name: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMenuCache(menu.siteId, menu.date);

  return updated;
}

// Lines 505-580: 식단 삭제
/**
 * 식단 삭제 (Soft Delete)
 * @description 식단을 논리적으로 삭제하고 이미지도 함께 삭제합니다
 */
export async function deleteMenu(menuId: string, userId: string): Promise<void> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu || menu.deletedAt) {
    throw new NotFoundError('Menu not found');
  }

  // 이미지 삭제
  if (menu.imageUrl1) {
    const path1 = extractPathFromUrl(menu.imageUrl1);
    const thumbPath1 = extractPathFromUrl(menu.thumbnailUrl1!);
    await deleteImage(path1, thumbPath1);
  }
  if (menu.imageUrl2) {
    const path2 = extractPathFromUrl(menu.imageUrl2);
    const thumbPath2 = extractPathFromUrl(menu.thumbnailUrl2!);
    await deleteImage(path2, thumbPath2);
  }

  // Soft Delete
  await prisma.menu.update({
    where: { id: menuId },
    data: { deletedAt: new Date() },
  });

  // 캐시 무효화
  await invalidateMenuCache(menu.siteId, menu.date);
}

// Lines 585-640: 헬퍼 함수들
/**
 * URL에서 GCP Storage 경로 추출
 */
function extractPathFromUrl(url: string): string {
  const parts = url.split('/');
  return parts.slice(4).join('/'); // https://storage.googleapis.com/{bucket}/{path}
}

/**
 * 캐시 무효화
 */
async function invalidateMenuCache(siteId: string, date: Date): Promise<void> {
  const keys = await redis.keys(`menus:*${siteId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Lines 645-800: 고객사 대상 식단 조회
/**
 * 고객사 대상 식단 조회 (읽기 전용)
 * @description 고객사 포털에서 자신의 사업장 식단만 조회
 */
export async function getMenusForCustomer(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any[]> {
  return getMenus({
    siteId,
    dateFrom,
    dateTo,
  });
}

/**
 * 주간 식단 조회
 * @description 특정 주의 식단을 조회합니다
 */
export async function getWeeklyMenus(
  siteId: string,
  weekStart: Date
): Promise<any[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return getMenus({
    siteId,
    dateFrom: weekStart,
    dateTo: weekEnd,
  });
}

/**
 * 월간 식단 조회
 */
export async function getMonthlyMenus(
  siteId: string,
  year: number,
  month: number
): Promise<any[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  return getMenus({
    siteId,
    dateFrom: monthStart,
    dateTo: monthEnd,
  });
}
```

---

### Task 3.6: Menu Controller

**파일**: `src/controllers/menu.controller.ts` (신규 생성)
**예상 라인**: 400-500 라인

```typescript
import { Request, Response } from 'express';
import * as menuService from '../services/menu.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { MealType } from '@prisma/client';

// Lines 1-80: 식단 생성
/**
 * POST /api/menus
 * @description 단일 사업장 식단 생성
 */
export async function createMenu(req: Request, res: Response) {
  try {
    const { siteId, date, mealType, menuText } = req.body;
    const images = req.files as Express.Multer.File[];

    const menu = await menuService.createMenu(
      {
        siteId,
        date: new Date(date),
        mealType: mealType as MealType,
        menuText,
        images,
      },
      req.user!.userId
    );

    return res.status(201).json(successResponse(menu, 'Menu created successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 85-160: 그룹별 일괄 생성
/**
 * POST /api/menus/group/:groupId
 * @description 사업장 그룹 일괄 식단 생성
 */
export async function createMenuForGroup(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const { date, mealType, menuText } = req.body;
    const images = req.files as Express.Multer.File[];

    const result = await menuService.createMenuForGroup(
      groupId,
      new Date(date),
      mealType as MealType,
      menuText,
      images,
      req.user!.userId
    );

    return res.status(201).json(
      successResponse(result, `Created ${result.created.length} menus, ${result.failed.length} failed`)
    );
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 165-250: 식단 목록 조회
/**
 * GET /api/menus
 * @description 식단 목록 조회 (필터링)
 */
export async function getMenus(req: Request, res: Response) {
  try {
    const { siteId, siteIds, dateFrom, dateTo, mealType } = req.query;

    const filter: any = {};

    if (siteId) filter.siteId = siteId as string;
    if (siteIds) filter.siteIds = (siteIds as string).split(',');
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    if (mealType) filter.mealType = mealType as MealType;

    const menus = await menuService.getMenus(filter);

    return res.json(successResponse(menus));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 255-320: 단일 식단 조회
/**
 * GET /api/menus/:id
 */
export async function getMenuById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const menus = await menuService.getMenus({});
    const menu = menus.find(m => m.id === id);

    if (!menu) {
      return res.status(404).json(errorResponse('Menu not found'));
    }

    return res.json(successResponse(menu));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 325-400: 식단 수정
/**
 * PATCH /api/menus/:id
 */
export async function updateMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { menuText, deleteImages } = req.body;
    const images = req.files as Express.Multer.File[];

    const menu = await menuService.updateMenu(
      id,
      {
        menuText,
        images,
        deleteImages: deleteImages === 'true',
      },
      req.user!.userId
    );

    return res.json(successResponse(menu, 'Menu updated successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 405-460: 식단 삭제
/**
 * DELETE /api/menus/:id
 */
export async function deleteMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await menuService.deleteMenu(id, req.user!.userId);

    return res.json(successResponse(null, 'Menu deleted successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 465-500: 고객사용 조회 API
/**
 * GET /api/menus/customer/:siteId
 * @description 고객사 포털용 식단 조회
 */
export async function getMenusForCustomer(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const menus = await menuService.getMenusForCustomer(
      siteId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(menus));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}
```

---

### Task 3.7: Menu Routes

**파일**: `src/routes/menu.routes.ts` (신규 생성)
**예상 라인**: 100-150 라인

```typescript
import { Router } from 'express';
import multer from 'multer';
import * as menuController from '../controllers/menu.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 2, // 최대 2개
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

// Lines 1-50: 식단 관리 라우트
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  upload.array('images', 2),
  menuController.createMenu
);

router.post(
  '/group/:groupId',
  authenticate,
  authorize(['ADMIN']),
  upload.array('images', 2),
  menuController.createMenuForGroup
);

router.get(
  '/',
  authenticate,
  menuController.getMenus
);

router.get(
  '/:id',
  authenticate,
  menuController.getMenuById
);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  upload.array('images', 2),
  menuController.updateMenu
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  menuController.deleteMenu
);

// Lines 55-100: 고객사용 라우트
router.get(
  '/customer/:siteId',
  authenticate,
  authorize(['CUSTOMER']),
  menuController.getMenusForCustomer
);

export default router;
```

**파일**: `src/app.ts` (기존 파일 수정)
**작업**: 라우트 등록

```typescript
// 라우트 등록 섹션에 추가
import menuRoutes from './routes/menu.routes';

app.use('/api/menus', menuRoutes);
```

---

## 📅 Week 4: 배식 사진 관리 시스템

### Task 4.1: Prisma 스키마 확장 (MealPhoto 모델)

**파일**: `prisma/schema.prisma`
**작업 위치**: 기존 파일에 추가
**예상 라인**: +60 라인

```prisma
// MealPhoto 모델 (실제 구현)
model MealPhoto {
  id           String    @id @default(uuid())
  siteId       String
  uploaderId   String

  // 촬영 정보 (단일 timestamp)
  capturedAt   DateTime   // 촬영 일시 (날짜+시간 통합)
  mealType     MealType?  // 끼니 구분 (선택사항)
  photoType    PhotoType @default(SERVING)  // 사진 타입 구분

  // 이미지 정보
  imageUrl     String
  thumbnailUrl String?

  // GPS 정보 (선택사항)
  latitude     Float?
  longitude    Float?

  // 관리자 피드백
  feedback     String?   @db.Text

  // MongoDB 메타데이터 연동
  mongoMetaId  String?

  // 메타데이터
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  // Relations
  site     Site @relation(fields: [siteId], references: [id], onDelete: Cascade)
  uploader User @relation(fields: [uploaderId], references: [id], onDelete: Cascade)

  @@index([siteId, capturedAt])
  @@index([uploaderId])
  @@index([capturedAt])
}

// 사진 타입 구분 (실제 구현에 추가됨)
enum PhotoType {
  SERVING   // 배식 준비
  LEFTOVER  // 잔반
  FACILITY  // 시설
}

// Site 모델에 relation 추가
model Site {
  // 기존 필드들...
  mealPhotos MealPhoto[]
}

// User 모델에 relation 추가
model User {
  // 기존 필드들...
  mealPhotos MealPhoto[]
}
```

**주요 변경사항**:
- ✅ `photoDate`/`photoTime` → `capturedAt` (단일 timestamp)
- ✅ `photoType` 필드 추가 (배식/잔반/시설 구분)
- ✅ `mealType`이 선택사항으로 변경
- ✅ GPS 좌표가 선택사항으로 변경
- ❌ `isValidLocation` 필드 제거 (GPS 검증 실패 시 저장 안 함)
- ❌ `feedbackBy`/`feedbackAt` 필드 제거 (단순화)

**마이그레이션**:
```bash
npx prisma migrate dev --name add_meal_photo_model
npx prisma generate
```

---

### Task 4.2: MealPhoto Service

**파일**: `src/services/meal-photo.service.ts` (신규 생성)
**예상 라인**: 600-800 라인

```typescript
import { PrismaClient, MealType } from '@prisma/client';
import { redis } from '../config/redis';
import { uploadImage, deleteImage } from './storage.service';
import { checkGeofencing } from '../utils/geofencing.util';
import { ForbiddenError, NotFoundError } from '../utils/errors.util';

const prisma = new PrismaClient();

// Lines 1-40: 타입 정의 (실제 구현)
export interface CreateMealPhotoDto {
  siteId: string;
  mealType?: MealType;  // 선택사항
  photoType: PhotoType;  // 배식/잔반/시설
  capturedAt: Date;  // 날짜+시간 통합
  latitude?: number;  // 선택사항
  longitude?: number;  // 선택사항
  image: Express.Multer.File;
}

export interface BulkCreateMealPhotoDto {
  siteId: string;
  mealType?: MealType;
  photoType: PhotoType;
  capturedAt: Date;
  latitude?: number;
  longitude?: number;
  images: Express.Multer.File[];  // 여러 이미지
}

export interface UpdateMealPhotoDto {
  mealType?: MealType;
  photoType?: PhotoType;
  capturedAt?: Date;
  feedback?: string;
  image?: Express.Multer.File;
}

export interface MealPhotoFilter {
  siteId?: string;
  siteIds?: string[];
  uploaderId?: string;
  photoType?: PhotoType;
  mealType?: MealType;
  dateFrom?: Date;
  dateTo?: Date;
}

// Lines 45-180: 배식 사진 생성
/**
 * 배식 사진 생성 (GPS 검증 포함)
 * @description 배식 사진을 업로드하고 GPS 위치를 검증합니다
 */
export async function createMealPhoto(
  dto: CreateMealPhotoDto,
  userId: string
): Promise<any> {
  // 사업장 조회
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
  });

  if (!site || !site.isActive || site.deletedAt) {
    throw new NotFoundError('Site not found or inactive');
  }

  // GPS 검증 (사업장 반경 100m 이내)
  const isValidLocation = checkGeofencing(
    { lat: dto.latitude, lng: dto.longitude },
    { lat: site.latitude, lng: site.longitude },
    100 // 100m 반경
  );

  // 이미지 업로드
  const uploaded = await uploadImage(dto.image, 'meal-photos');

  // DB 저장
  const photo = await prisma.mealPhoto.create({
    data: {
      siteId: dto.siteId,
      photoDate: dto.photoDate,
      photoTime: dto.photoTime,
      mealType: dto.mealType,
      imageUrl: uploaded.originalUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      latitude: dto.latitude,
      longitude: dto.longitude,
      isValidLocation,
      uploadedBy: userId,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 캐시 무효화
  await invalidatePhotoCache(dto.siteId);

  // 비정상 위치 알림 (추후 Phase 3에서 구현)
  if (!isValidLocation) {
    console.warn(`Photo uploaded from invalid location: ${photo.id}`);
    // TODO: 알림 발송
  }

  return photo;
}

// Lines 185-320: 배식 사진 조회
/**
 * 배식 사진 목록 조회
 * @description 사업장별, 날짜별, 업로더별 필터링 지원
 */
export async function getMealPhotos(filter: PhotoFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `meal-photos:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 필터 조건 구성
  const where: any = {
    deletedAt: null,
  };

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.uploadedBy) {
    where.uploadedBy = filter.uploadedBy;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.photoDate = {};
    if (filter.dateFrom) where.photoDate.gte = filter.dateFrom;
    if (filter.dateTo) where.photoDate.lte = filter.dateTo;
  }

  if (filter.mealType) {
    where.mealType = filter.mealType;
  }

  if (filter.isValidLocation !== undefined) {
    where.isValidLocation = filter.isValidLocation;
  }

  // 조회
  const photos = await prisma.mealPhoto.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      uploader: {
        select: { id: true, name: true },
      },
      feedbackUser: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { photoDate: 'desc' },
      { photoTime: 'desc' },
    ],
  });

  // 캐시 저장 (5분)
  await redis.setex(cacheKey, 300, JSON.stringify(photos));

  return photos;
}

// Lines 325-450: 배식 사진 수정 (본인만)
/**
 * 배식 사진 수정
 * @description 업로더 본인만 이미지를 교체할 수 있습니다
 */
export async function updateMealPhoto(
  photoId: string,
  dto: UpdateMealPhotoDto,
  userId: string,
  userRole: string
): Promise<any> {
  // 기존 사진 조회
  const photo = await prisma.mealPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.deletedAt) {
    throw new NotFoundError('Photo not found');
  }

  const updateData: any = {};

  // 이미지 교체 (본인만 가능)
  if (dto.image) {
    if (photo.uploadedBy !== userId) {
      throw new ForbiddenError('Only uploader can replace image');
    }

    // 기존 이미지 삭제
    const oldPath = extractPathFromUrl(photo.imageUrl);
    const oldThumbPath = extractPathFromUrl(photo.thumbnailUrl);
    await deleteImage(oldPath, oldThumbPath);

    // 새 이미지 업로드
    const uploaded = await uploadImage(dto.image, 'meal-photos');
    updateData.imageUrl = uploaded.originalUrl;
    updateData.thumbnailUrl = uploaded.thumbnailUrl;
  }

  // 관리자 피드백 (관리자만 가능)
  if (dto.feedback !== undefined) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenError('Only admin can add feedback');
    }

    updateData.feedback = dto.feedback;
    updateData.feedbackBy = userId;
    updateData.feedbackAt = new Date();
  }

  // DB 업데이트
  const updated = await prisma.mealPhoto.update({
    where: { id: photoId },
    data: updateData,
    include: {
      site: true,
      uploader: {
        select: { id: true, name: true },
      },
      feedbackUser: {
        select: { id: true, name: true },
      },
    },
  });

  // 캐시 무효화
  await invalidatePhotoCache(photo.siteId);

  return updated;
}

// Lines 455-550: 배식 사진 삭제 (본인만)
/**
 * 배식 사진 삭제
 * @description 업로더 본인만 삭제 가능 (Soft Delete)
 */
export async function deleteMealPhoto(
  photoId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const photo = await prisma.mealPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.deletedAt) {
    throw new NotFoundError('Photo not found');
  }

  // 권한 체크 (본인 또는 관리자)
  if (photo.uploadedBy !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenError('Only uploader or admin can delete photo');
  }

  // 이미지 삭제
  const path = extractPathFromUrl(photo.imageUrl);
  const thumbPath = extractPathFromUrl(photo.thumbnailUrl);
  await deleteImage(path, thumbPath);

  // Soft Delete
  await prisma.mealPhoto.update({
    where: { id: photoId },
    data: { deletedAt: new Date() },
  });

  // 캐시 무효화
  await invalidatePhotoCache(photo.siteId);
}

// Lines 555-640: 갤러리 조회
/**
 * 사진 갤러리 조회 (날짜별, 사업장별)
 * @description 특정 기간의 배식 사진을 갤러리 형태로 조회
 */
export async function getPhotoGallery(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const photos = await getMealPhotos({
    siteId,
    dateFrom,
    dateTo,
  });

  // 날짜별 그룹핑
  const grouped = photos.reduce((acc, photo) => {
    const dateKey = photo.photoDate.toISOString().split('T')[0];

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        photos: [],
      };
    }

    acc[dateKey].photos.push(photo);

    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

// Lines 645-720: 비정상 위치 사진 조회
/**
 * 비정상 위치 사진 조회
 * @description GPS 검증 실패한 사진들을 조회합니다
 */
export async function getInvalidLocationPhotos(
  dateFrom?: Date,
  dateTo?: Date
): Promise<any[]> {
  return getMealPhotos({
    isValidLocation: false,
    dateFrom,
    dateTo,
  });
}

// Lines 725-800: 헬퍼 함수들
function extractPathFromUrl(url: string): string {
  const parts = url.split('/');
  return parts.slice(4).join('/');
}

async function invalidatePhotoCache(siteId: string): Promise<void> {
  const keys = await redis.keys(`meal-photos:*${siteId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * 사용자별 업로드 통계
 */
export async function getUploadStatsByUser(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const photos = await getMealPhotos({
    uploadedBy: userId,
    dateFrom,
    dateTo,
  });

  return {
    totalPhotos: photos.length,
    validLocationPhotos: photos.filter(p => p.isValidLocation).length,
    invalidLocationPhotos: photos.filter(p => !p.isValidLocation).length,
    photosByMealType: {
      BREAKFAST: photos.filter(p => p.mealType === 'BREAKFAST').length,
      LUNCH: photos.filter(p => p.mealType === 'LUNCH').length,
      DINNER: photos.filter(p => p.mealType === 'DINNER').length,
      SNACK: photos.filter(p => p.mealType === 'SNACK').length,
    },
  };
}
```

---

### Task 4.3: MealPhoto Controller

**파일**: `src/controllers/meal-photo.controller.ts` (신규 생성)
**예상 라인**: 400-500 라인

```typescript
import { Request, Response } from 'express';
import * as mealPhotoService from '../services/meal-photo.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { MealType } from '@prisma/client';

// Lines 1-80: 배식 사진 생성
/**
 * POST /api/meal-photos
 */
export async function createMealPhoto(req: Request, res: Response) {
  try {
    const { siteId, photoDate, photoTime, mealType, latitude, longitude } = req.body;
    const image = req.file;

    if (!image) {
      return res.status(400).json(errorResponse('Image required'));
    }

    const photo = await mealPhotoService.createMealPhoto(
      {
        siteId,
        photoDate: new Date(photoDate),
        photoTime: new Date(photoTime),
        mealType: mealType as MealType,
        image,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      req.user!.userId
    );

    return res.status(201).json(successResponse(photo, 'Photo uploaded successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 85-170: 배식 사진 목록 조회
/**
 * GET /api/meal-photos
 */
export async function getMealPhotos(req: Request, res: Response) {
  try {
    const { siteId, uploadedBy, dateFrom, dateTo, mealType, isValidLocation } = req.query;

    const filter: any = {};

    if (siteId) filter.siteId = siteId as string;
    if (uploadedBy) filter.uploadedBy = uploadedBy as string;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    if (mealType) filter.mealType = mealType as MealType;
    if (isValidLocation !== undefined) {
      filter.isValidLocation = isValidLocation === 'true';
    }

    const photos = await mealPhotoService.getMealPhotos(filter);

    return res.json(successResponse(photos));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 175-240: 단일 사진 조회
/**
 * GET /api/meal-photos/:id
 */
export async function getMealPhotoById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const photos = await mealPhotoService.getMealPhotos({});
    const photo = photos.find(p => p.id === id);

    if (!photo) {
      return res.status(404).json(errorResponse('Photo not found'));
    }

    return res.json(successResponse(photo));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 245-320: 배식 사진 수정
/**
 * PATCH /api/meal-photos/:id
 */
export async function updateMealPhoto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const image = req.file;

    const photo = await mealPhotoService.updateMealPhoto(
      id,
      {
        image,
        feedback,
      },
      req.user!.userId,
      req.user!.role
    );

    return res.json(successResponse(photo, 'Photo updated successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 325-380: 배식 사진 삭제
/**
 * DELETE /api/meal-photos/:id
 */
export async function deleteMealPhoto(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await mealPhotoService.deleteMealPhoto(id, req.user!.userId, req.user!.role);

    return res.json(successResponse(null, 'Photo deleted successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 385-450: 갤러리 조회
/**
 * GET /api/meal-photos/gallery/:siteId
 */
export async function getPhotoGallery(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const gallery = await mealPhotoService.getPhotoGallery(
      siteId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(gallery));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 455-500: 비정상 위치 사진 조회
/**
 * GET /api/meal-photos/invalid-locations
 */
export async function getInvalidLocationPhotos(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;

    const photos = await mealPhotoService.getInvalidLocationPhotos(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    return res.json(successResponse(photos));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}
```

---

### Task 4.4: MealPhoto Routes

**파일**: `src/routes/meal-photo.routes.ts` (신규 생성)
**예상 라인**: 100-150 라인

```typescript
import { Router } from 'express';
import multer from 'multer';
import * as mealPhotoController from '../controllers/meal-photo.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Multer 설정 (단일 이미지)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

// Lines 1-60: 배식 사진 관리 라우트
router.post(
  '/',
  authenticate,
  authorize(['STAFF']),
  upload.single('image'),
  mealPhotoController.createMealPhoto
);

router.get(
  '/',
  authenticate,
  mealPhotoController.getMealPhotos
);

router.get(
  '/invalid-locations',
  authenticate,
  authorize(['ADMIN']),
  mealPhotoController.getInvalidLocationPhotos
);

router.get(
  '/gallery/:siteId',
  authenticate,
  mealPhotoController.getPhotoGallery
);

router.get(
  '/:id',
  authenticate,
  mealPhotoController.getMealPhotoById
);

router.patch(
  '/:id',
  authenticate,
  upload.single('image'),
  mealPhotoController.updateMealPhoto
);

router.delete(
  '/:id',
  authenticate,
  mealPhotoController.deleteMealPhoto
);

export default router;
```

**파일**: `src/app.ts` (기존 파일 수정)
**작업**: 라우트 등록

```typescript
// 라우트 등록 섹션에 추가
import mealPhotoRoutes from './routes/meal-photo.routes';

app.use('/api/meal-photos', mealPhotoRoutes);
```

---

## ✅ Phase 2 완료 체크리스트

### Week 3: 식단 관리 (8개 작업)
- [x] Task 3.1: Prisma 스키마 확장 (Menu 모델) ✅
- [x] Task 3.2: GCP Storage 설정 (Mock 포함) ✅
- [x] Task 3.3: 이미지 처리 유틸리티 ✅
- [x] Task 3.4: Storage Service ✅
- [x] Task 3.5: Menu Service ✅
- [x] Task 3.6: Menu Controller ✅
- [x] Task 3.7: Menu Routes ✅
- [x] Task 3.8: 주간 식단표 템플릿 (추가 기능) ✅

### Week 4: 배식 사진 관리 (5개 작업)
- [x] Task 4.1: Prisma 스키마 확장 (MealPhoto + PhotoType) ✅
- [x] Task 4.2: MealPhoto Service ✅
- [x] Task 4.3: MealPhoto Controller ✅
- [x] Task 4.4: MealPhoto Routes ✅
- [x] Task 4.5: 일괄 삭제 기능 ✅

### 통합 테스트
- [x] 단일 식단 이미지 업로드 테스트 ✅
- [x] 그룹별 일괄 식단 업로드 테스트 ✅
- [x] 이미지 압축/썸네일 생성 확인 ✅
- [x] 배식 사진 GPS 검증 테스트 ✅
- [x] 사진 타입별 필터링 테스트 (SERVING/LEFTOVER/FACILITY) ✅
- [x] 본인 사진만 수정/삭제 가능한지 테스트 ✅
- [x] 관리자 피드백 기능 테스트 ✅
- [x] Redis 캐싱 동작 확인 ✅
- [x] MongoDB 메타데이터 연동 확인 ✅

---

## 🚨 중복 방지 최종 점검

### Phase 2 작업 완료 후 반드시 확인
- [ ] 이미지 업로드 로직이 `storage.service.ts` 외에 다른 곳에 없는가?
- [ ] 이미지 압축/썸네일 로직이 `image-processor.util.ts` 외에 다른 곳에 없는가?
- [ ] GPS 검증이 `geofencing.util.ts` (Phase 1) 만 사용하는가?
- [ ] GCP Storage 연결이 `gcp-storage.ts` 외에 다른 곳에 없는가?

---

## 📝 Agent 인계 템플릿

```
=== Phase 2 완료 보고 ===

완료한 작업:
- Week 3: 식단 관리 (7개 Task)
- Week 4: 배식 사진 관리 (4개 Task)

생성된 파일:
1. prisma/schema.prisma (Menu, MealPhoto 모델 추가)
2. src/config/gcp-storage.ts [50-80 라인]
3. src/utils/image-processor.util.ts [300-400 라인]
4. src/services/storage.service.ts [400-500 라인]
5. src/services/menu.service.ts [600-800 라인]
6. src/controllers/menu.controller.ts [400-500 라인]
7. src/routes/menu.routes.ts [100-150 라인]
8. src/services/meal-photo.service.ts [600-800 라인]
9. src/controllers/meal-photo.controller.ts [400-500 라인]
10. src/routes/meal-photo.routes.ts [100-150 라인]

테스트 완료:
- [x] 식단 이미지 업로드
- [x] 그룹별 일괄 업로드
- [x] 배식 사진 GPS 검증
- [x] 이미지 압축/썸네일
- [x] 권한 기반 수정/삭제

주의사항:
- GCP Storage 서비스 계정 키 파일 필요 (.gitignore 처리 필수)
- 이미지 최대 크기: 10MB
- GPS 검증 반경: 100m

다음 단계:
- Phase 3 (VOC/근태 시스템) 진행
```

---

## 📌 다음 Phase 안내

**Phase 3**: VOC 및 근태 관리 (2-3주)
- Week 5: VOC 시스템
- Week 6: 근태 관리
- Week 7: 통계 및 대시보드

**파일**: `구현_가이드_Phase3.md` 참조

---

## 📊 Phase 2 실제 구현 상태 (2025-10-12 기준)

### ✅ 완료된 기능

| 기능 분류 | 상세 기능 | 구현 상태 | 참고 |
|---------|---------|----------|------|
| **식단 관리** | 날짜 범위 기반 식단 등록 | ✅ 완료 | startDate/endDate 사용 |
| | 이미지 업로드 (1개) | ✅ 완료 | imageUrl/thumbnailUrl |
| | 그룹별 일괄 등록 | ✅ 완료 | createMenuForGroup |
| | 식단 조회/수정/삭제 | ✅ 완료 | CRUD 완성 |
| | 주간/월간 식단 조회 | ✅ 완료 | getWeeklyMenus, getMonthlyMenus |
| **주간 식단표** | 템플릿 관리 | ✅ 완료 | WeeklyMenuTemplate 모델 |
| | 식단 유형별 템플릿 | ✅ 완료 | MenuType 연동 |
| **배식 사진** | 사진 업로드 | ✅ 완료 | 단일/일괄 지원 |
| | 사진 타입 구분 | ✅ 완료 | SERVING/LEFTOVER/FACILITY |
| | GPS 검증 (100m) | ✅ 완료 | Geofencing 유틸리티 사용 |
| | 사진 수정/삭제 (본인) | ✅ 완료 | 권한 검증 포함 |
| | 관리자 피드백 | ✅ 완료 | feedback 필드 |
| | 일괄 삭제 | ✅ 완료 | bulkDeleteMealPhotos |
| | 갤러리 조회 | ✅ 완료 | 날짜별 그룹핑 |
| **이미지 처리** | Sharp 압축 (1200px) | ✅ 완료 | compressImage |
| | 썸네일 생성 (300px) | ✅ 완료 | generateThumbnail |
| | 이미지 검증 | ✅ 완료 | 타입/크기 체크 |
| **저장소** | GCP Storage 연동 | ✅ 완료 | @google-cloud/storage |
| | Mock 로컬 저장소 | ✅ 완료 | 개발 환경 지원 |
| | 공개 URL 생성 | ✅ 완료 | getPublicUrl |
| **캐싱** | Redis 캐싱 | ✅ 완료 | 식단 10분, 사진 10분 |
| | 캐시 무효화 | ✅ 완료 | 생성/수정/삭제 시 |
| **통합** | MongoDB 메타데이터 | ✅ 완료 | mongoMetaId 필드 |

### ⚠️ 가이드와 다른 부분

| 항목 | 가이드 명세 | 실제 구현 | 영향 |
|------|-----------|----------|------|
| Menu 날짜 | `date` (단일) | `startDate`, `endDate` (범위) | 🟡 기능 확장 |
| Menu 이미지 | 2개 지원 | 1개만 지원 | 🟡 단순화 |
| Menu 텍스트 | `menuText` | `menuItems` | 🟢 명명 변경 |
| MealPhoto 시간 | `photoDate`, `photoTime` (분리) | `capturedAt` (통합) | 🟢 단순화 |
| MealPhoto 타입 | 없음 | `PhotoType` 추가 | 🟢 기능 확장 |
| GPS 검증 저장 | `isValidLocation` 필드 | 필드 없음 (에러만) | 🟡 단순화 |
| 피드백 메타 | `feedbackBy`, `feedbackAt` | 없음 | 🟢 단순화 |
| MealType | SNACK | SUPPER | 🟢 명명 변경 |

### 📁 생성된 파일 목록

**Backend (13개 파일)**:
```
backend/src/
├── services/
│   ├── menu.service.ts (398 라인) ✅
│   ├── meal-photo.service.ts (556 라인) ✅
│   ├── storage.service.ts (227 라인) ✅
│   └── weekly-menu-template.service.ts ✅
├── controllers/
│   ├── menu.controller.ts ✅
│   ├── meal-photo.controller.ts ✅
│   └── weekly-menu-template.controller.ts ✅
├── routes/
│   ├── menu.routes.ts ✅
│   ├── meal-photo.routes.ts ✅
│   └── weekly-menu-template.routes.ts ✅
├── utils/
│   └── image-processor.util.ts ✅
└── config/
    └── gcp-storage.ts (통합 구현) ✅

backend/prisma/
└── schema.prisma (Menu, MealPhoto, WeeklyMenuTemplate, PhotoType) ✅
```

**Frontend (5개 파일)**:
```
web/src/
├── api/
│   ├── menu.api.ts ✅
│   ├── meal-photo.api.ts ✅
│   └── weekly-menu-template.api.ts ✅
└── pages/
    ├── menu/
    │   ├── MenuListPage.tsx ✅
    │   ├── MenuFormPage.tsx ✅
    │   └── WeeklyMenuPage.tsx ✅
    └── photo/
        └── MealPhotoManagementPage.tsx ✅
```

### 💡 주요 설계 결정 사항

1. **날짜 범위 기반 식단**: 단일 날짜 대신 startDate/endDate로 한 번 등록으로 여러 날 적용 가능
2. **PhotoType 추가**: 배식 준비/잔반/시설 사진을 명확히 구분
3. **GPS 검증 간소화**: isValidLocation 필드 제거, 검증 실패 시 에러 반환으로 단순화
4. **Mock Storage 지원**: 개발 환경에서 GCP 없이도 로컬 파일 저장소로 테스트 가능
5. **MealType SUPPER**: SNACK 대신 SUPPER(야식) 사용으로 한식 환경에 적합
6. **MongoDB 연동**: 확장성을 위해 mongoMetaId 필드 추가

### 📝 참고 문서

- **Phase2_실제구현_vs_가이드_차이점.md**: 상세한 차이점 분석 문서
- **backend/prisma/schema.prisma**: 실제 데이터 모델 정의
- **backend/src/services/\*.service.ts**: 실제 비즈니스 로직 구현

### 🎯 다음 작업

Phase 3 (VOC 및 근태 관리) 진행 전에:
1. ✅ Phase 2 가이드를 실제 구현에 맞춰 업데이트 완료
2. ✅ 구현_가이드_목차.md 업데이트 완료
3. ⏭️ Phase 3, 4, 5, 6 가이드도 실제 구현 기준으로 검토 필요
