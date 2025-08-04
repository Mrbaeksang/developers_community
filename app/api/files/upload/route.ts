import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FileType } from '@prisma/client'
import { put } from '@vercel/blob'
import {
  requireAuthAPI,
  checkBanStatus,
  getCommunityMembership,
} from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwValidationError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'
import { withRateLimit } from '@/lib/rate-limiter'

// 파일 타입 확인 함수
function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (mimeType.includes('pdf') || mimeType.includes('document'))
    return 'DOCUMENT'
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar')
  )
    return 'ARCHIVE'
  return 'OTHER'
}

// 이미지 크기 체크 (간단한 구현)
async function getImageDimensions(): Promise<{
  width?: number
  height?: number
}> {
  // 실제 구현에서는 sharp 또는 다른 이미지 처리 라이브러리 사용
  // 여기서는 간단히 null 반환
  return { width: undefined, height: undefined }
}

// POST: 파일 업로드
// TODO: 실제 파일 저장 구현 필요 (Vercel Blob, S3, Cloudinary 등)
// 현재는 메타데이터만 DB에 저장하고 실제 파일은 저장하지 않음
async function uploadFile(req: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const formData = await req.formData()
    const file = formData.get('file') as File
    const communityId = formData.get('communityId') as string | null
    const postId = formData.get('postId') as string | null

    if (!file) {
      throwValidationError('파일이 필요합니다')
    }

    // 파일 크기 체크 (기본 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throwValidationError('파일 크기는 10MB를 초과할 수 없습니다')
    }

    // 커뮤니티별 파일 크기 제한 체크
    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { maxFileSize: true, allowFileUpload: true },
      })

      if (!community) {
        throwNotFoundError('커뮤니티를 찾을 수 없습니다')
      }

      // 커뮤니티 멤버십 확인
      const membership = await getCommunityMembership(
        session.user.id,
        communityId
      )
      if (!membership) {
        throwAuthorizationError('커뮤니티 멤버가 아닙니다')
      }

      if (!community.allowFileUpload) {
        throwAuthorizationError('이 커뮤니티는 파일 업로드를 허용하지 않습니다')
      }

      if (file.size > community.maxFileSize) {
        throwValidationError(
          `파일 크기는 ${community.maxFileSize / 1024 / 1024}MB를 초과할 수 없습니다`
        )
      }
    }

    // 파일 타입 확인
    const fileType = getFileType(file.type)

    // Vercel Blob Storage에 파일 업로드
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // 이미지인 경우 크기 정보 가져오기
    let width: number | undefined
    let height: number | undefined
    if (fileType === 'IMAGE') {
      const dimensions = await getImageDimensions()
      width = dimensions.width
      height = dimensions.height
    }

    // 파일 정보 DB 저장
    const savedFile = await prisma.file.create({
      data: {
        filename: file.name,
        storedName: blob.pathname,
        mimeType: file.type,
        size: file.size,
        type: fileType,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        width,
        height,
        uploaderId: session.user.id,
        postId: postId || undefined,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return successResponse(
      {
        id: savedFile.id,
        filename: savedFile.filename,
        url: savedFile.url,
        downloadUrl: savedFile.downloadUrl,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        type: savedFile.type,
        width: savedFile.width,
        height: savedFile.height,
        uploadedAt: savedFile.createdAt,
        uploader: savedFile.uploader,
      },
      undefined,
      201
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용
export const POST = withRateLimit(uploadFile, 'upload')
