/**
 * File Upload Middleware
 * @description Multer 설정 - 메모리 스토리지 사용
 */

import multer from 'multer';
import { validateImageFile } from '../utils/image-processor.util';

/**
 * Multer 메모리 스토리지 설정
 * - 파일을 디스크에 저장하지 않고 Buffer로 메모리에 저장
 * - GCP Storage 업로드 전에 이미지 처리 가능
 */
const storage = multer.memoryStorage();

/**
 * 파일 필터 - 이미지만 허용
 */
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    validateImageFile(file);
    cb(null, true);
  } catch (error: any) {
    cb(error);
  }
};

/**
 * 단일 이미지 업로드 (필드명: image)
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
  },
}).single('image');

/**
 * 여러 이미지 업로드 (필드명: images, 최대 10개)
 */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
    files: 10,
  },
}).array('images', 10);

/**
 * VOC 피드백 이미지 업로드 (필드명: images, 최대 6개)
 */
export const uploadFeedbackImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
    files: 6,
  },
}).array('images', 6);

/**
 * 배식 사진 업로드 (필드명: photos, 최대 6개)
 */
export const uploadMealPhotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '10485760'), // 10MB
    files: 6,
  },
}).array('photos', 6);
