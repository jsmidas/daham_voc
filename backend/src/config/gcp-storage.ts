/**
 * GCP Storage 설정
 * @description Google Cloud Storage 연결 및 버킷 관리
 */

import { Storage, Bucket } from '@google-cloud/storage';
import { env } from './env';

let storage: Storage | null = null;
let bucket: Bucket | null = null;
let storageInitialized = false;

/**
 * GCP Storage 초기화
 */
export async function initializeGCPStorage(): Promise<void> {
  try {
    console.log('🔧 GCP Storage 설정 확인:');
    console.log(`   - GCP_PROJECT_ID: ${env.GCP_PROJECT_ID || '(없음)'}`);
    console.log(`   - GCP_BUCKET_NAME: ${env.GCP_BUCKET_NAME || '(없음)'}`);
    console.log(`   - GCP_KEY_FILE: ${env.GCP_KEY_FILE || '(없음)'}`);

    // GCP 설정이 없으면 스킵 (개발 환경)
    if (!env.GCP_PROJECT_ID || !env.GCP_BUCKET_NAME) {
      console.log('⚠️  GCP Storage not configured - using mock storage');
      return;
    }

    // Storage 옵션 설정
    const storageOptions: any = {
      projectId: env.GCP_PROJECT_ID,
    };

    // 키 파일이 설정되어 있고 실제 존재하는 경우에만 사용
    if (env.GCP_KEY_FILE) {
      const fs = require('fs');
      const path = require('path');
      const keyFilePath = path.resolve(env.GCP_KEY_FILE);

      if (fs.existsSync(keyFilePath)) {
        storageOptions.keyFilename = keyFilePath;
        console.log('📁 Using GCP key file:', keyFilePath);
      } else {
        console.log('📁 GCP key file not found at:', keyFilePath);
        console.log('📁 Using Application Default Credentials (GCP VM/Cloud Run)');
      }
    } else {
      console.log('📁 No key file configured, using Application Default Credentials');
    }

    storage = new Storage(storageOptions);
    bucket = storage.bucket(env.GCP_BUCKET_NAME);

    // 버킷 접근 테스트
    try {
      const [exists] = await bucket.exists();
      if (exists) {
        console.log('✅ GCP Storage initialized successfully:', env.GCP_BUCKET_NAME);
        storageInitialized = true;
      } else {
        console.error('❌ Bucket does not exist:', env.GCP_BUCKET_NAME);
        console.log('   버킷을 생성하거나 버킷 이름을 확인하세요.');
        storage = null;
        bucket = null;
      }
    } catch (accessError: any) {
      console.error('❌ Cannot access bucket:', env.GCP_BUCKET_NAME);
      console.error('   Error:', accessError.message);
      console.log('   서비스 계정에 Storage 권한이 있는지 확인하세요.');
      // 접근 테스트 실패해도 일단 초기화는 진행 (나중에 업로드 시 에러 발생)
      console.log('⚠️  GCP Storage initialized but access test failed - uploads may fail');
      storageInitialized = true;
    }
  } catch (error: any) {
    console.error('❌ GCP Storage initialization failed:', error.message);
    console.error('   Full error:', error);
    storage = null;
    bucket = null;
  }
}

/**
 * Storage 초기화 여부 확인
 */
export function isStorageInitialized(): boolean {
  return storageInitialized;
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
