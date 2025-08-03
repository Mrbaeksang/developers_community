import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { handleError, throwNotFoundError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'

// 사용자 프로필 조회 - GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = resolvedParams.id

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        globalRole: true,
        showEmail: true,
        createdAt: true,
        isActive: true,
        isBanned: true,
        _count: {
          select: {
            mainPosts: {
              where: {
                status: 'PUBLISHED',
              },
            },
            mainComments: true,
            mainLikes: true,
          },
        },
      },
    })

    if (!user) {
      throwNotFoundError('사용자를 찾을 수 없습니다.')
    }

    // 비활성화되거나 밴된 사용자 처리
    if (!user.isActive || user.isBanned) {
      throwNotFoundError('사용자를 찾을 수 없습니다.')
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name || 'Unknown',
        username: user.username,
        image: user.image || undefined,
        bio: user.bio,
        role: user.globalRole,
        joinedAt: user.createdAt.toISOString(),
        joinedTimeAgo: formatTimeAgo(user.createdAt),
        // 이메일은 showEmail 설정에 따라 공개
        ...(user.showEmail && { email: user.email }),
        stats: {
          postCount: user._count.mainPosts,
          commentCount: user._count.mainComments,
          likeCount: user._count.mainLikes,
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
