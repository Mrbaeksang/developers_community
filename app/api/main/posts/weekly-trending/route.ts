import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { markdownToHtml } from '@/lib/markdown'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') // 특정 카테고리만 조회

    // Redis에서 주간 조회수 데이터 가져오기

    // 7일간의 날짜 생성
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    // 모든 게시글의 주간 조회수 집계
    const posts = await prisma.mainPost.findMany({
      where: {
        status: 'PUBLISHED',
        ...(category && {
          category: { slug: category },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    // 각 게시글의 주간 조회수 계산
    const postsWithWeeklyViews = await Promise.all(
      posts.map(async (post) => {
        let weeklyViews = 0

        // Redis에서 7일간의 조회수 합산
        for (const date of dates) {
          const dayKey = `post:${post.id}:views:${date}`
          const dayViews = await redis().get(dayKey)
          weeklyViews += parseInt(dayViews || '0')
        }

        // 현재 버퍼링된 조회수도 추가
        const bufferKey = `post:${post.id}:views`
        const bufferedViews = await redis().get(bufferKey)
        weeklyViews += parseInt(bufferedViews || '0')

        return {
          ...post,
          content: markdownToHtml(post.content),
          tags: post.tags.map((postTag) => postTag.tag),
          weeklyViews,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          timeAgo: formatTimeAgo(post.createdAt),
        }
      })
    )

    // 주간 조회수로 정렬하고 상위 N개만 반환
    const trendingPosts = postsWithWeeklyViews
      .sort((a, b) => b.weeklyViews - a.weeklyViews)
      .slice(0, limit)
      .filter((post) => post.weeklyViews > 0) // 조회수 0인 게시글 제외

    return successResponse({
      posts: trendingPosts,
      period: 'weekly',
    })
  } catch (error) {
    return handleError(error)
  }
}
