/**
 * 이미지 처리 유틸리티
 * @description Sharp를 사용한 이미지 압축, 리사이징, 썸네일 생성
 */

import sharp from 'sharp';

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
  } catch (error: any) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
}

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
  } catch (error: any) {
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
}

/**
 * 이미지 파일 검증
 * @description 파일 타입, 크기, 유효성 검증
 */
export function validateImageFile(file: Express.Multer.File): void {
  // 파일 타입 검증 (HEIC/HEIF는 아이폰 기본 포맷)
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/heic,image/heif').split(',');
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // 파일 크기 검증
  const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || '10485760'); // 10MB
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
  }
}

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
    Promise.all(files.map((file) => compressImage(file.buffer))),
    Promise.all(files.map((file) => generateThumbnail(file.buffer))),
  ]);

  return { images, thumbnails };
}

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
