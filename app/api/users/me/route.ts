import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { requireAuthAPI } from '@/lib/auth/session'
import {
  successResponse,
  updatedResponse,
  validationErrorResponse,
} from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { withSecurity } from '@/lib/security/compatibility'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'

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

    // Redis 캐시 키 생성 - 사용자별로 고유한 캐시
    const cacheKey = generateCacheKey('user:me', {
      userId: session.user.id,
    })

    // Redis 캐싱 적용 - 내 정보는 5분 캐싱
    const cachedUserData = await redisCache.getOrSet(
      cacheKey,
      async () => {
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
          return null
        }

        return {
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
        }
      },
      REDIS_TTL.API_MEDIUM // 5분 캐싱
    )

    if (!cachedUserData) {
      throwNotFoundError('사용자를 찾을 수 없습니다.')
    }

    return successResponse(cachedUserData)
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

    // Redis 캐시 무효화 - 사용자 정보가 변경되었으므로 캐시 삭제
    await redisCache.delPattern(`api:cache:user:me:*userId*${session.user.id}*`)
    await redisCache.delPattern(
      `api:cache:user:posts:*userId*${session.user.id}*`
    )

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
export const PUT = withSecurity(updateProfile, { requireCSRF: true })
