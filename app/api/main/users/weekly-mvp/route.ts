import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { redisCache, REDIS_TTL } from '@/lib/cache/redis'
import { handleError } from '@/lib/api/errors'

interface WeeklyMVPUser {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  bio: string | null
  globalRole: string
  weeklyStats: {
    postCount: number
    totalViews: number
    totalLikes: number
    totalComments: number
    engagementScore: number
  }
  rank: number
}

export async function GET() {
  try {
    // Redis 캐싱 적용 - getOrSet 패턴 사용 (게시글 API와 동일)
    const mvpUsers = await redisCache.getOrSet(
      'api:cache:weekly:mvp:users',
      async () => {
        // Get the date for 7 days ago
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        // Fetch users with activity in the last week
        const users = await prisma.user.findMany({
          where: {
            isActive: true,
            isBanned: false,
            OR: [
              {
                mainPosts: {
                  some: {
                    status: 'PUBLISHED',
                    createdAt: {
                      gte: weekAgo,
                    },
                  },
                },
              },
              {
                mainComments: {
                  some: {
                    createdAt: {
                      gte: weekAgo,
                    },
                  },
                },
              },
              {
                mainLikes: {
                  some: {
                    createdAt: {
                      gte: weekAgo,
                    },
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            bio: true,
            globalRole: true,
            mainPosts: {
              where: {
                status: 'PUBLISHED',
                createdAt: {
                  gte: weekAgo,
                },
              },
              select: {
                viewCount: true,
                _count: {
                  select: {
                    likes: true,
                    comments: true,
                  },
                },
              },
            },
            mainComments: {
              where: {
                createdAt: {
                  gte: weekAgo,
                },
              },
              select: {
                id: true,
              },
            },
          },
        })

        // Calculate engagement scores and format data
        const mvpUsers: WeeklyMVPUser[] = users
          .map((user) => {
            const postCount = user.mainPosts.length
            const totalViews = user.mainPosts.reduce(
              (sum, post) => sum + post.viewCount,
              0
            )
            const totalLikes = user.mainPosts.reduce(
              (sum, post) => sum + post._count.likes,
              0
            )
            const totalComments = user.mainPosts.reduce(
              (sum, post) => sum + post._count.comments,
              0
            )
            const userComments = user.mainComments.length

            // Calculate engagement score
            // Score = (posts * 100) + (views / 5) + (likes * 10) + (received comments * 5) + (made comments * 3)
            const engagementScore =
              postCount * 100 +
              Math.floor(totalViews / 5) +
              totalLikes * 10 +
              totalComments * 5 +
              userComments * 3

            return {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              image: user.image,
              bio: user.bio,
              globalRole: user.globalRole,
              weeklyStats: {
                postCount,
                totalViews,
                totalLikes,
                totalComments,
                engagementScore,
              },
              rank: 0, // Will be set after sorting
            }
          })
          .sort(
            (a, b) =>
              b.weeklyStats.engagementScore - a.weeklyStats.engagementScore
          )
          .slice(0, 5) // Get top 5 MVP users
          .map((user, index) => ({
            ...user,
            rank: index + 1,
          }))

        return mvpUsers
      },
      REDIS_TTL.API_LONG // 4시간 캐싱
    )

    return NextResponse.json({
      success: true,
      data: mvpUsers,
    })
  } catch (error) {
    return handleError(error)
  }
}
