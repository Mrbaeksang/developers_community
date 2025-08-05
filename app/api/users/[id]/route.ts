import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { handleError, throwNotFoundError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import { userSelect } from '@/lib/prisma-select-patterns'

// 사용자 프로필 조회 - GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = resolvedParams.id

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const includeActivities = searchParams.get('includeActivities') === 'true'

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('user:profile', {
      userId,
      includeActivities,
    })

    // Redis 캐싱 적용 - 사용자 프로필은 10분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 사용자 정보 조회 - 선택 패턴 사용
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            ...userSelect.profile,
            _count: {
              select: {
                mainPosts: {
                  where: {
                    status: 'PUBLISHED',
                  },
                },
                mainComments: true,
                mainLikes: true,
                communityPosts: {
                  where: {
                    status: 'PUBLISHED',
                  },
                },
                communityComments: true,
                communityLikes: true,
                ownedCommunities: true,
                communityMemberships: true,
              },
            },
          },
        })

        if (!user) {
          return null
        }

        // 비활성화되거나 밴된 사용자 처리
        if (!user.isActive || user.isBanned) {
          return null
        }

        // 최근 활동 조회 (선택적)
        let recentActivities = null
        if (includeActivities) {
          // 최근 게시글과 댓글 조회
          const [recentPosts, recentComments] = await Promise.all([
            // 최근 메인 게시글
            prisma.mainPost.findMany({
              where: {
                authorId: userId,
                status: 'PUBLISHED',
              },
              select: {
                id: true,
                title: true,
                slug: true,
                createdAt: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                _count: {
                  select: {
                    comments: true,
                    likes: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            }),
            // 최근 메인 댓글
            prisma.mainComment.findMany({
              where: {
                authorId: userId,
              },
              select: {
                id: true,
                content: true,
                createdAt: true,
                post: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            }),
          ])

          recentActivities = {
            posts: recentPosts.map((post) => ({
              ...post,
              type: 'post' as const,
              timeAgo: formatTimeAgo(post.createdAt),
            })),
            comments: recentComments.map((comment) => ({
              ...comment,
              type: 'comment' as const,
              timeAgo: formatTimeAgo(comment.createdAt),
            })),
          }
        }

        return {
          user: {
            id: user.id,
            name: user.name || 'Unknown',
            username: user.username,
            image: user.image || undefined,
            bio: user.bio || undefined,
            role: user.globalRole,
            joinedAt: user.createdAt.toISOString(),
            joinedTimeAgo: formatTimeAgo(user.createdAt),
            // 이메일은 showEmail 설정에 따라 공개
            ...(user.showEmail && { email: user.email }),
            stats: {
              postCount: user._count.mainPosts + user._count.communityPosts,
              commentCount:
                user._count.mainComments + user._count.communityComments,
              likeCount: user._count.mainLikes + user._count.communityLikes,
              communityCount: user._count.ownedCommunities,
              membershipCount: user._count.communityMemberships,
            },
          },
          ...(recentActivities && { activities: recentActivities }),
        }
      },
      REDIS_TTL.API_MEDIUM * 2 // 10분 캐싱
    )

    if (!cachedData) {
      throwNotFoundError('사용자를 찾을 수 없습니다.')
    }

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
