import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { put } from '@vercel/blob'
import { requireAuthAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'
import { withSecurity } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'

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

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      throwValidationError('파일 크기는 10MB를 초과할 수 없습니다')
    }

    // Vercel Blob Storage에 파일 업로드
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // DB에 파일 정보 저장
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.name,
        storedName: blob.pathname,
        mimeType: file.type,
        size: file.size,
        type: getFileType(file.type),
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        uploaderId: userId,
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
