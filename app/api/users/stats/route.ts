import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// 내 활동 통계 조회 - GET /api/users/stats
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 기본 통계 조회
    const [
      totalPosts,
      publishedPosts,
      pendingPosts,
      totalComments,
      totalLikes,
      totalBookmarks,
      receivedLikes,
      recentActivity,
    ] = await Promise.all([
      // 전체 게시글 수
      prisma.mainPost.count({
        where: { authorId: userId },
      }),
      // 게시된 게시글 수
      prisma.mainPost.count({
        where: {
          authorId: userId,
          status: 'PUBLISHED',
        },
      }),
      // 승인 대기 게시글 수
      prisma.mainPost.count({
        where: {
          authorId: userId,
          status: 'PENDING',
        },
      }),
      // 총 댓글 수
      prisma.mainComment.count({
        where: { authorId: userId },
      }),
      // 누른 좋아요 수
      prisma.mainLike.count({
        where: { userId },
      }),
      // 북마크 수
      prisma.mainBookmark.count({
        where: { userId },
      }),
      // 받은 좋아요 수 (내 게시글에 대한)
      prisma.mainLike.count({
        where: {
          post: {
            authorId: userId,
          },
        },
      }),
      // 최근 7일간 활동
      prisma.mainPost.count({
        where: {
          authorId: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // 카테고리별 게시글 분포
    const postsByCategory = await prisma.mainPost.groupBy({
      by: ['categoryId'],
      where: {
        authorId: userId,
        status: 'PUBLISHED',
      },
      _count: {
        id: true,
      },
    })

    // 카테고리 정보 추가
    const categoryStats = await Promise.all(
      postsByCategory.map(async (stat) => {
        const category = await prisma.mainCategory.findUnique({
          where: { id: stat.categoryId },
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        })
        return {
          category,
          postCount: stat._count.id,
        }
      })
    )

    // 월별 게시글 작성 통계 (최근 6개월)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyPosts = await prisma.mainPost.groupBy({
      by: ['createdAt'],
      where: {
        authorId: userId,
        status: 'PUBLISHED',
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
    })

    // 월별 데이터 정리
    const monthlyStats = monthlyPosts.reduce(
      (acc: Record<string, number>, post) => {
        const month = post.createdAt.toISOString().slice(0, 7) // YYYY-MM
        acc[month] = (acc[month] || 0) + post._count.id
        return acc
      },
      {}
    )

    return NextResponse.json({
      stats: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          pending: pendingPosts,
          draft: totalPosts - publishedPosts - pendingPosts,
        },
        engagement: {
          comments: totalComments,
          likes: totalLikes,
          bookmarks: totalBookmarks,
          receivedLikes,
        },
        activity: {
          recentPosts: recentActivity,
          categoryDistribution: categoryStats,
          monthlyPosts: monthlyStats,
        },
      },
    })
  } catch (error) {
    console.error('활동 통계 조회 실패:', error)
    return NextResponse.json(
      { error: '활동 통계 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
