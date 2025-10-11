/**
 * GCP Storage 설정
 * @description Google Cloud Storage 연결 및 버킷 관리
 */

import { Storage, Bucket } from '@google-cloud/storage';
import { env } from './env';

let storage: Storage | null = null;
let bucket: Bucket | null = null;

/**
 * GCP Storage 초기화
 */
export function initializeGCPStorage(): void {
  try {
    // GCP 설정이 없으면 스킵 (개발 환경)
    if (!env.GCP_PROJECT_ID || !env.GCP_BUCKET_NAME) {
      console.log('⚠️  GCP Storage not configured - using mock storage');
      return;
    }

    storage = new Storage({
      projectId: env.GCP_PROJECT_ID,
      keyFilename: env.GCP_KEY_FILE,
    });

    bucket = storage.bucket(env.GCP_BUCKET_NAME);

    console.log('✅ GCP Storage initialized');
  } catch (error: any) {
    console.warn('⚠️  GCP Storage initialization failed:', error.message);
    storage = null;
    bucket = null;
  }
}

/**
 * Storage 인스턴스 가져오기
 */
export function getStorage(): Storage | null {
  return storage;
}

/**
 * Bucket 인스턴스 가져오기
 */
export function getBucket(): Bucket | null {
  return bucket;
}

/**
 * 버킷 설정 (CORS 등)
 */
export async function setupBucket(): Promise<void> {
  if (!bucket) {
    console.log('GCP Storage not configured, skipping bucket setup');
    return;
  }

  try {
    const [exists] = await bucket.exists();

    if (!exists) {
      await bucket.create();
      console.log(`Bucket ${env.GCP_BUCKET_NAME} created`);
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

    console.log('Bucket CORS configured');
  } catch (error: any) {
    console.error('Bucket setup failed:', error.message);
  }
}

/**
 * 파일 경로 생성 헬퍼
 */
export function generateImagePath(
  folder: 'menus' | 'meal-photos' | 'weekly-menus' | 'feedbacks',
  filename: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop();
  return `${folder}/${timestamp}-${randomStr}.${ext}`;
}

/**
 * 공개 URL 생성
 */
export function getPublicUrl(path: string): string {
  if (!env.GCP_BUCKET_NAME) {
    // Mock URL for development
    return `http://localhost:3000/mock-images/${path}`;
  }
  return `https://storage.googleapis.com/${env.GCP_BUCKET_NAME}/${path}`;
}
