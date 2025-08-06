import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { del } from '@vercel/blob'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwAuthorizationError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'
import { requireAuthAPI } from '@/lib/auth/session'

// 파일 상세 조회 - GET /api/files/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            communityId: true,
          },
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    })

    if (!file) {
      throw throwNotFoundError('파일을 찾을 수 없습니다.')
    }

    // 파일 접근 권한 확인 (업로더이거나 관련 게시글/채팅에 접근 가능한 경우)
    const canAccess =
      file.uploaderId === session.user.id || session.user.role === 'ADMIN'

    if (!canAccess && file.post) {
      // 커뮤니티 멤버십 확인
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: file.post.communityId,
          },
        },
        select: {
          status: true,
        },
      })

      if (!membership || membership.status !== 'ACTIVE') {
        throw throwAuthorizationError('파일에 접근할 수 없습니다.')
      }
    }

    return successResponse({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      type: file.type,
      url: file.url,
      downloadUrl: file.downloadUrl,
      width: file.width,
      height: file.height,
      createdAt: file.createdAt.toISOString(),
      uploader: {
        id: file.uploader.id,
        name: file.uploader.name || 'Unknown',
        username: file.uploader.username,
        image: file.uploader.image || undefined,
      },
      post: file.post
        ? {
            id: file.post.id,
            title: file.post.title,
          }
        : undefined,
      usageCount: file._count.chatMessages + (file.post ? 1 : 0),
    })
  } catch (error) {
    return handleError(error)
  }
}

// 파일 삭제 - DELETE /api/files/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const { id } = await params

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        storedName: true,
        post: {
          select: {
            id: true,
            communityId: true,
          },
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    })

    if (!file) {
      throw throwNotFoundError('파일을 찾을 수 없습니다.')
    }

    // 삭제 권한 확인
    const isUploader = file.uploaderId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    // 커뮤니티 관리자 확인
    let isCommunityAdmin = false
    if (file.post) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: file.post.communityId,
          },
        },
        select: {
          role: true,
        },
      })

      isCommunityAdmin =
        membership?.role === 'OWNER' || membership?.role === 'ADMIN'
    }

    if (!isUploader && !isAdmin && !isCommunityAdmin) {
      throw throwAuthorizationError('파일 삭제 권한이 없습니다.')
    }

    // 파일이 사용 중인지 확인
    if (file.post || file._count.chatMessages > 0) {
      throw throwValidationError('사용 중인 파일은 삭제할 수 없습니다.')
    }

    // Vercel Blob에서 파일 삭제
    try {
      await del(file.storedName, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
    } catch (blobError) {
      console.error('Blob deletion error:', blobError)
      // Blob 삭제 실패해도 DB 레코드는 삭제 진행
    }

    // DB에서 파일 레코드 삭제
    await prisma.file.delete({
      where: { id },
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
