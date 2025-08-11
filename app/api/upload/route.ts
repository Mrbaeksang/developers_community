import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { put } from '@vercel/blob'
import { requireAuthAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'
import { withSecurity } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'
import { allowedFileTypes } from '@/lib/validations/upload'
import {
  sanitizeFilename,
  validateMimeType,
  validateFileSize,
  generateFileHash,
} from '@/lib/utils/file-sanitizer'
import { resizeImage, IMAGE_PRESETS } from '@/lib/utils/image-resizer'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// 파일 타입 변환
function getFileType(
  mimeType: string
): 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'ARCHIVE' | 'OTHER' {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  )
    return 'DOCUMENT'
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive')
  )
    return 'ARCHIVE'
  return 'OTHER'
}

async function uploadFile(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Promise<Record<string, string | string[]>> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    const userId = session.user.id

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      throwValidationError('파일이 없습니다')
    }

    // 파일 크기 검증
    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      throwValidationError('파일 크기는 10MB를 초과할 수 없습니다')
    }

    // MIME 타입 검증
    const allAllowedTypes = Object.values(
      allowedFileTypes
    ).flat() as readonly string[]
    if (!validateMimeType(file, allAllowedTypes)) {
      throwValidationError('지원되지 않는 파일 형식입니다')
    }

    // 파일명 sanitization
    let safeName = sanitizeFilename(file.name, {
      maxLength: 255,
      preserveExtension: true,
      addHash: true,
    })

    // 파일 해시 생성 (중복 체크용)
    const fileHash = await generateFileHash(file)

    // 중복 파일 체크 (같은 해시를 가진 파일이 있는지)
    const existingFile = await prisma.file.findFirst({
      where: {
        hash: fileHash,
        uploaderId: userId,
      },
      select: {
        id: true,
        url: true,
        filename: true,
        size: true,
        mimeType: true,
      },
    })

    // 중복 파일이 있으면 기존 파일 정보 반환
    if (existingFile) {
      return successResponse(
        {
          id: existingFile.id,
          name: existingFile.filename,
          size: existingFile.size,
          type: existingFile.mimeType,
          url: existingFile.url,
        },
        '동일한 파일이 이미 업로드되어 있습니다.',
        200
      )
    }

    // 이미지인 경우 리사이징 처리
    let uploadBuffer: Buffer | File = file
    let finalMimeType = file.type
    let finalSize = file.size
    let imageMetadata: {
      width?: number
      height?: number
      originalSize?: number
      compressionRatio?: number
      thumbnailUrl?: string
    } | null = null

    if (file.type.startsWith('image/')) {
      try {
        // 이미지 리사이징 (LARGE 프리셋 사용, WebP 변환)
        const processed = await resizeImage(file, {
          ...IMAGE_PRESETS.LARGE,
          format: 'webp',
          generateThumbnail: true,
          thumbnailSize: 200,
        })

        uploadBuffer = processed.buffer
        finalMimeType = 'image/webp'
        finalSize = processed.metadata.size

        // 이미지 메타데이터 저장
        imageMetadata = {
          width: processed.metadata.width,
          height: processed.metadata.height,
          originalSize: file.size,
          compressionRatio: Math.round(
            processed.metadata.compressionRatio * 100
          ),
        }

        // 썸네일 업로드
        if (processed.thumbnail) {
          const thumbName = safeName.replace(/\.[^.]+$/, '_thumb.webp')
          const thumbBlob = await put(thumbName, processed.thumbnail, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
            contentType: 'image/webp',
          })
          imageMetadata.thumbnailUrl = thumbBlob.url
        }

        // 파일명을 .webp로 변경
        safeName = safeName.replace(/\.[^.]+$/, '.webp')
      } catch (error) {
        console.error('Image resize failed, using original:', error)
        // 리사이징 실패 시 원본 사용
      }
    }

    // Vercel Blob Storage에 파일 업로드 (안전한 파일명 사용)
    const blob = await put(safeName, uploadBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false, // 이미 해시가 포함되어 있음
      contentType: finalMimeType,
    })

    // DB에 파일 정보 저장 (hash 필드 추가)
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.name, // 원본 파일명 저장
        storedName: safeName, // 안전한 파일명 저장
        mimeType: finalMimeType, // 최종 MIME 타입 (이미지는 webp)
        size: finalSize, // 최종 파일 크기
        type: getFileType(file.type),
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        uploaderId: userId,
        hash: fileHash, // 파일 해시 저장
        metadata: imageMetadata || undefined, // 이미지 메타데이터
      },
    })

    return successResponse(
      {
        id: fileRecord.id,
        name: fileRecord.filename,
        size: fileRecord.size,
        type: fileRecord.mimeType,
        url: fileRecord.url,
        metadata: imageMetadata,
      },
      imageMetadata ? '이미지가 최적화되어 업로드되었습니다.' : undefined,
      201
    )
  } catch (error) {
    return handleError(error)
  }
}

// 통합 보안 미들웨어 적용 - 새로운 보안 시스템 사용
export const POST = withSecurity(uploadFile, {
  action: ActionCategory.FILE_UPLOAD,
  requireCSRF: true,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})
