import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'
import { withCSRFProtection } from '@/lib/csrf'

// GET: 현재 고정 상태 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { id } = await params

    const post = await prisma.mainPost.findUnique({
      where: { id },
      select: { isPinned: true },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다.')
    }

    return successResponse({ isPinned: post.isPinned })
  } catch (error) {
    return handleError(error)
  }
}

// PATCH: 고정/고정해제 토글
async function togglePostPin(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { id } = await params

    // 현재 고정 상태 확인
    const currentPost = await prisma.mainPost.findUnique({
      where: { id },
      select: { isPinned: true, status: true },
    })

    if (!currentPost) {
      throwNotFoundError('게시글을 찾을 수 없습니다.')
    }

    // PUBLISHED 상태인 게시글만 고정 가능
    if (currentPost.status !== 'PUBLISHED') {
      throwValidationError('게시된 글만 고정할 수 있습니다.')
    }

    // 고정 상태 토글
    const updatedPost = await prisma.mainPost.update({
      where: { id },
      data: { isPinned: !currentPost.isPinned },
      select: {
        id: true,
        isPinned: true,
      },
    })

    return successResponse({
      success: true,
      isPinned: updatedPost.isPinned,
      message: updatedPost.isPinned
        ? '게시글이 고정되었습니다.'
        : '게시글 고정이 해제되었습니다.',
    })
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PATCH = withCSRFProtection(togglePostPin)
