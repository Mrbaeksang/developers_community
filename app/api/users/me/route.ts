import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuthAPI } from '@/lib/auth-utils'
import {
  successResponse,
  updatedResponse,
  validationErrorResponse,
} from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { withCSRFProtection } from '@/lib/csrf'

// 프로필 수정 스키마
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .max(50, '이름은 50자 이하로 입력해주세요.')
    .optional(),
  username: z
    .string()
    .min(2, '사용자명은 2자 이상이어야 합니다.')
    .max(20, '사용자명은 20자 이하로 입력해주세요.')
    .optional(),
  bio: z.string().max(500, '자기소개는 500자 이하로 입력해주세요.').optional(),
  showEmail: z.boolean().optional(),
})

// 내 정보 조회 - GET /api/users/me
export async function GET() {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown',
        username: user.username,
        image: user.image || undefined,
        bio: user.bio,
        role: user.globalRole,
        showEmail: user.showEmail,
        joinedAt: user.createdAt.toISOString(),
        joinedTimeAgo: formatTimeAgo(user.createdAt),
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

// 내 정보 수정 - PUT /api/users/me
async function updateProfile(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 요청 데이터 검증
    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      const errors: Record<string, string[]> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }

    const validatedData = validation.data

    // 사용자명 중복 확인 (변경하는 경우만)
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: session.user.id },
        },
      })

      if (existingUser) {
        throwValidationError('이미 사용 중인 사용자명입니다.')
      }
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.username !== undefined && {
          username: validatedData.username,
        }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.showEmail !== undefined && {
          showEmail: validatedData.showEmail,
        }),
      },
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

    return updatedResponse(
      {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name || 'Unknown',
          username: updatedUser.username,
          image: updatedUser.image || undefined,
          bio: updatedUser.bio,
          role: updatedUser.globalRole,
          showEmail: updatedUser.showEmail,
          joinedAt: updatedUser.createdAt.toISOString(),
          joinedTimeAgo: formatTimeAgo(updatedUser.createdAt),
          stats: {
            postCount: updatedUser._count.mainPosts,
            commentCount: updatedUser._count.mainComments,
            likeCount: updatedUser._count.mainLikes,
          },
        },
      },
      '프로필이 업데이트되었습니다.'
    )
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PUT = withCSRFProtection(updateProfile)
