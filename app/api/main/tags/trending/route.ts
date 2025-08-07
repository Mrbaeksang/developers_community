import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { redis } from '@/lib/cache/redis'
import { handleError } from '@/lib/api/errors'

const CACHE_KEY = 'trending:tags'
const CACHE_TTL = 60 * 60 // 1 hour

interface TrendingTag {
  id: string
  name: string
  slug: string
  color: string | null
  postCount: number
  weeklyPosts: number
  trendingScore: number
}

export async function GET() {
  try {
    // Try to get from cache first
    const redisClient = redis()
    const cached = redisClient ? await redisClient.get(CACHE_KEY) : null
    if (cached) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      })
    }

    // Get the date for 7 days ago
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Fetch trending tags with post counts
    const tags = await prisma.mainTag.findMany({
      where: {
        posts: {
          some: {
            post: {
              status: 'PUBLISHED',
              createdAt: {
                gte: weekAgo,
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        postCount: true,
        posts: {
          where: {
            post: {
              status: 'PUBLISHED',
              createdAt: {
                gte: weekAgo,
              },
            },
          },
          select: {
            post: {
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
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    // Calculate trending scores and format data
    const trendingTags: TrendingTag[] = tags
      .map((tag) => {
        const weeklyPosts = tag.posts.length
        const totalViews = tag.posts.reduce(
          (sum, p) => sum + (p.post?.viewCount || 0),
          0
        )
        const totalLikes = tag.posts.reduce(
          (sum, p) => sum + (p.post?._count?.likes || 0),
          0
        )
        const totalComments = tag.posts.reduce(
          (sum, p) => sum + (p.post?._count?.comments || 0),
          0
        )

        // Calculate trending score
        // Score = (weekly posts * 10) + (views / 10) + (likes * 5) + (comments * 3)
        const trendingScore =
          weeklyPosts * 10 +
          Math.floor(totalViews / 10) +
          totalLikes * 5 +
          totalComments * 3

        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color,
          postCount: tag.postCount || tag._count.posts,
          weeklyPosts,
          trendingScore,
        }
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10) // Get top 10 trending tags

    // Cache the result
    if (redisClient) {
      await redisClient.setex(
        CACHE_KEY,
        CACHE_TTL,
        JSON.stringify(trendingTags)
      )
    }

    return NextResponse.json({
      success: true,
      data: trendingTags,
      cached: false,
    })
  } catch (error) {
    return handleError(error)
  }
}
