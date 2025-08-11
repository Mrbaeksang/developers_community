import sharp from 'sharp'
import { Buffer } from 'buffer'

/**
 * 이미지 리사이징 및 최적화 유틸리티
 * WebP 변환, 품질 조정, 크기 제한 등 지원
 */

export interface ResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  progressive?: boolean
  preserveAspectRatio?: boolean
  generateThumbnail?: boolean
  thumbnailSize?: number
}

export interface ProcessedImage {
  buffer: Buffer
  metadata: {
    width: number
    height: number
    size: number
    format: string
    originalSize: number
    compressionRatio: number
  }
  thumbnail?: Buffer
}

// 이미지 사이즈 프리셋
export const IMAGE_PRESETS = {
  // 썸네일
  THUMBNAIL: { maxWidth: 200, maxHeight: 200, quality: 80 },
  SMALL: { maxWidth: 400, maxHeight: 400, quality: 85 },

  // 일반 이미지
  MEDIUM: { maxWidth: 800, maxHeight: 800, quality: 85 },
  LARGE: { maxWidth: 1200, maxHeight: 1200, quality: 90 },
  HD: { maxWidth: 1920, maxHeight: 1080, quality: 90 },

  // 고화질
  FULL_HD: { maxWidth: 1920, maxHeight: 1080, quality: 95 },
  ULTRA_HD: { maxWidth: 3840, maxHeight: 2160, quality: 95 },

  // 소셜 미디어 최적화
  SOCIAL_SQUARE: { maxWidth: 1080, maxHeight: 1080, quality: 90 },
  SOCIAL_LANDSCAPE: { maxWidth: 1200, maxHeight: 630, quality: 90 },
  SOCIAL_PORTRAIT: { maxWidth: 1080, maxHeight: 1350, quality: 90 },
} as const

// 기본 설정
const DEFAULT_OPTIONS: ResizeOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'webp',
  progressive: true,
  preserveAspectRatio: true,
  generateThumbnail: false,
  thumbnailSize: 200,
}

/**
 * 이미지 리사이징 및 최적화
 * @param input File, Buffer, 또는 ArrayBuffer
 * @param options 리사이징 옵션
 * @returns 처리된 이미지 정보
 */
export async function resizeImage(
  input: File | Buffer | ArrayBuffer,
  options: ResizeOptions = {}
): Promise<ProcessedImage> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  // 입력을 Buffer로 변환
  let buffer: Buffer
  if (input instanceof File) {
    const arrayBuffer = await input.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else if (input instanceof ArrayBuffer) {
    buffer = Buffer.from(input)
  } else {
    buffer = input
  }

  const originalSize = buffer.length

  try {
    // Sharp 인스턴스 생성
    let pipeline = sharp(buffer)

    // 메타데이터 가져오기
    const metadata = await pipeline.metadata()

    // 이미지가 아닌 경우 에러
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image format')
    }

    // 회전 정보가 있으면 자동 회전 (EXIF)
    pipeline = pipeline.rotate()

    // 리사이징 계산
    const { width, height } = calculateDimensions(
      metadata.width,
      metadata.height,
      config.maxWidth || DEFAULT_OPTIONS.maxWidth || 1920,
      config.maxHeight || DEFAULT_OPTIONS.maxHeight || 1080,
      config.preserveAspectRatio !== undefined
        ? config.preserveAspectRatio
        : true
    )

    // 리사이징 적용 (원본보다 작을 때만)
    if (width < metadata.width || height < metadata.height) {
      pipeline = pipeline.resize(width, height, {
        fit: config.preserveAspectRatio ? 'inside' : 'fill',
        withoutEnlargement: true,
      })
    }

    // 포맷 변환 및 품질 설정
    switch (config.format) {
      case 'webp':
        pipeline = pipeline.webp({
          quality: config.quality,
          effort: 6, // 압축 노력 (0-6, 높을수록 느리지만 압축률 좋음)
        })
        break
      case 'avif':
        pipeline = pipeline.avif({
          quality: config.quality,
          effort: 6,
        })
        break
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality: config.quality,
          progressive: config.progressive,
          mozjpeg: true, // 더 나은 압축
        })
        break
      case 'png':
        pipeline = pipeline.png({
          quality: config.quality,
          progressive: config.progressive,
          compressionLevel: 9,
        })
        break
    }

    // 최종 이미지 버퍼 생성
    const processedBuffer = await pipeline.toBuffer()
    const processedMetadata = await sharp(processedBuffer).metadata()

    // 썸네일 생성 (옵션)
    let thumbnailBuffer: Buffer | undefined
    if (config.generateThumbnail && config.thumbnailSize) {
      thumbnailBuffer = await sharp(buffer)
        .rotate()
        .resize(config.thumbnailSize, config.thumbnailSize, {
          fit: 'cover',
          position: 'attention', // 스마트 크롭
        })
        .webp({ quality: 80 })
        .toBuffer()
    }

    return {
      buffer: processedBuffer,
      metadata: {
        width: processedMetadata.width || width,
        height: processedMetadata.height || height,
        size: processedBuffer.length,
        format: config.format || 'webp',
        originalSize,
        compressionRatio: 1 - processedBuffer.length / originalSize,
      },
      thumbnail: thumbnailBuffer,
    }
  } catch {
    throw new Error('이미지 처리 중 오류가 발생했습니다')
  }
}

/**
 * 이미지 크기 계산
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  preserveAspectRatio: boolean
): { width: number; height: number } {
  if (!preserveAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight),
    }
  }

  const aspectRatio = originalWidth / originalHeight

  // 가로가 더 긴 경우
  if (originalWidth > originalHeight) {
    const width = Math.min(originalWidth, maxWidth)
    const height = Math.round(width / aspectRatio)

    // 높이가 초과하면 높이 기준으로 재계산
    if (height > maxHeight) {
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight,
      }
    }

    return { width, height }
  }

  // 세로가 더 긴 경우
  const height = Math.min(originalHeight, maxHeight)
  const width = Math.round(height * aspectRatio)

  // 너비가 초과하면 너비 기준으로 재계산
  if (width > maxWidth) {
    return {
      width: maxWidth,
      height: Math.round(maxWidth / aspectRatio),
    }
  }

  return { width, height }
}

/**
 * 여러 크기의 이미지 생성 (반응형 이미지용)
 */
export async function generateResponsiveImages(
  input: File | Buffer | ArrayBuffer,
  sizes: Array<{ suffix: string; options: ResizeOptions }>
): Promise<Map<string, ProcessedImage>> {
  const results = new Map<string, ProcessedImage>()

  for (const { suffix, options } of sizes) {
    try {
      const processed = await resizeImage(input, options)
      results.set(suffix, processed)
    } catch (error) {
      console.error(`Failed to generate ${suffix} size:`, error)
    }
  }

  return results
}

/**
 * 스마트 이미지 최적화
 * 파일 크기와 품질의 균형을 자동으로 찾음
 */
export async function optimizeImage(
  input: File | Buffer | ArrayBuffer,
  targetSizeKB?: number
): Promise<ProcessedImage> {
  let quality = 85
  let format: ResizeOptions['format'] = 'webp'
  let result: ProcessedImage

  // 첫 번째 시도 - WebP
  result = await resizeImage(input, { quality, format })

  // 목표 크기가 있고 초과한 경우
  if (targetSizeKB && result.metadata.size > targetSizeKB * 1024) {
    // 품질을 점진적으로 낮춤
    for (quality = 80; quality >= 60; quality -= 10) {
      result = await resizeImage(input, { quality, format })
      if (result.metadata.size <= targetSizeKB * 1024) break
    }

    // 여전히 크면 JPEG로 시도
    if (result.metadata.size > targetSizeKB * 1024) {
      format = 'jpeg'
      for (quality = 80; quality >= 60; quality -= 10) {
        result = await resizeImage(input, { quality, format })
        if (result.metadata.size <= targetSizeKB * 1024) break
      }
    }

    // 마지막으로 크기 축소
    if (result.metadata.size > targetSizeKB * 1024) {
      result = await resizeImage(input, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 70,
        format: 'jpeg',
      })
    }
  }

  return result
}

/**
 * 이미지 포맷 감지
 */
export async function detectImageFormat(
  input: File | Buffer | ArrayBuffer
): Promise<string | undefined> {
  let buffer: Buffer
  if (input instanceof File) {
    const arrayBuffer = await input.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else if (input instanceof ArrayBuffer) {
    buffer = Buffer.from(input)
  } else {
    buffer = input
  }

  try {
    const metadata = await sharp(buffer).metadata()
    return metadata.format
  } catch {
    return undefined
  }
}

/**
 * 이미지 유효성 검사
 */
export async function validateImage(
  input: File | Buffer | ArrayBuffer,
  options: {
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    allowedFormats?: string[]
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  let buffer: Buffer
  if (input instanceof File) {
    const arrayBuffer = await input.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else if (input instanceof ArrayBuffer) {
    buffer = Buffer.from(input)
  } else {
    buffer = input
  }

  try {
    const metadata = await sharp(buffer).metadata()

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: '유효하지 않은 이미지 형식입니다' }
    }

    if (options.minWidth && metadata.width < options.minWidth) {
      return {
        valid: false,
        error: `이미지 너비는 최소 ${options.minWidth}px 이상이어야 합니다`,
      }
    }

    if (options.minHeight && metadata.height < options.minHeight) {
      return {
        valid: false,
        error: `이미지 높이는 최소 ${options.minHeight}px 이상이어야 합니다`,
      }
    }

    if (options.maxWidth && metadata.width > options.maxWidth) {
      return {
        valid: false,
        error: `이미지 너비는 최대 ${options.maxWidth}px 이하여야 합니다`,
      }
    }

    if (options.maxHeight && metadata.height > options.maxHeight) {
      return {
        valid: false,
        error: `이미지 높이는 최대 ${options.maxHeight}px 이하여야 합니다`,
      }
    }

    if (options.allowedFormats && metadata.format) {
      if (!options.allowedFormats.includes(metadata.format)) {
        return {
          valid: false,
          error: `지원되지 않는 이미지 형식입니다. 허용: ${options.allowedFormats.join(', ')}`,
        }
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: '이미지를 읽을 수 없습니다' }
  }
}
