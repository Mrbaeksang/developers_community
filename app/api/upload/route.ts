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
    const safeName = sanitizeFilename(file.name, {
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

    // Vercel Blob Storage에 파일 업로드 (안전한 파일명 사용)
    const blob = await put(safeName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false, // 이미 해시가 포함되어 있음
    })

    // DB에 파일 정보 저장 (hash 필드 추가)
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.name, // 원본 파일명 저장
        storedName: safeName, // 안전한 파일명 저장
        mimeType: file.type,
        size: file.size,
        type: getFileType(file.type),
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        uploaderId: userId,
        hash: fileHash, // 파일 해시 저장
      },
    })

    return successResponse(
      {
        id: fileRecord.id,
        name: fileRecord.filename,
        size: fileRecord.size,
        type: fileRecord.mimeType,
        url: fileRecord.url,
      },
      undefined,
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
