/**
 * Storage Service
 * @description GCP Storage 이미지 업로드/삭제 서비스
 */

import { getBucket, generateImagePath, getPublicUrl } from '../config/gcp-storage';
import { compressImage, generateThumbnail } from '../utils/image-processor.util';

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

/**
 * 이미지 업로드 (원본 + 썸네일)
 * @description GCP Storage에 이미지와 썸네일을 업로드합니다
 */
export async function uploadImage(
  file: Express.Multer.File,
  folder: 'menus' | 'meal-photos' | 'weekly-menus' | 'feedbacks'
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
    const bucket = getBucket();
    if (bucket) {
      // 실제 GCP 업로드
      await Promise.all([
        uploadToGCP(bucket, originalPath, compressed.buffer, file.mimetype),
        uploadToGCP(bucket, thumbnailPath, thumbnail.buffer, file.mimetype),
      ]);
    } else {
      // Mock storage (개발 환경)
      console.log(`Mock upload: ${originalPath} (${compressed.size} bytes)`);
      console.log(`Mock upload: ${thumbnailPath} (${thumbnail.size} bytes)`);
    }

    return {
      originalUrl: getPublicUrl(originalPath),
      thumbnailUrl: getPublicUrl(thumbnailPath),
      originalPath,
      thumbnailPath,
      size: compressed.size,
      width: compressed.width,
      height: compressed.height,
    };
  } catch (error: any) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

/**
 * GCP 업로드 헬퍼
 */
async function uploadToGCP(
  bucket: any,
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

/**
 * 여러 이미지 일괄 업로드
 * @description 사업장 그룹별 일괄 업로드에 사용
 */
export async function uploadMultipleImages(
  files: Express.Multer.File[],
  folder: 'menus' | 'meal-photos' | 'weekly-menus' | 'feedbacks'
): Promise<BulkUploadResult> {
  const uploaded: UploadedImage[] = [];
  const failed: Array<{ filename: string; error: string }> = [];

  // 병렬 처리 (최대 5개씩)
  const chunks = chunkArray(files, 5);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((file) => uploadImage(file, folder))
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

/**
 * 배열 청크 분할
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 이미지 삭제 (원본 + 썸네일)
 * @description GCP Storage에서 이미지와 썸네일을 삭제합니다
 */
export async function deleteImage(
  originalPath: string,
  thumbnailPath: string
): Promise<void> {
  try {
    const bucket = getBucket();
    if (bucket) {
      // 실제 GCP 삭제
      await Promise.all([
        bucket.file(originalPath).delete({ ignoreNotFound: true }),
        bucket.file(thumbnailPath).delete({ ignoreNotFound: true }),
      ]);
    } else {
      // Mock storage (개발 환경)
      console.log(`Mock delete: ${originalPath}`);
      console.log(`Mock delete: ${thumbnailPath}`);
    }
  } catch (error) {
    console.error('Image deletion failed:', error);
    // 삭제 실패 시에도 계속 진행 (파일이 이미 없을 수 있음)
  }
}

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

/**
 * URL에서 경로 추출
 */
export function extractPathFromUrl(url: string): string {
  // https://storage.googleapis.com/{bucket}/{path} 형식에서 path 추출
  // 또는 http://localhost:3000/mock-images/{path} 형식에서 path 추출
  const parts = url.split('/');
  if (url.includes('localhost')) {
    return parts.slice(4).join('/'); // mock-images 다음부터
  }
  return parts.slice(4).join('/'); // bucket 다음부터
}
