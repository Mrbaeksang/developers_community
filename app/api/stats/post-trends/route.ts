import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { requireRoleAPI } from '@/lib/auth-utils'
import { subDays, format } from 'date-fns'

export async function GET() {
  try {
    // 인증 확인 (관리자만)
    const authResult = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Redis에서 캐시 확인
    const client = redis()
    const cacheKey = 'stats:post-trends'

    if (client) {
      const cached = await client.get(cacheKey)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: JSON.parse(cached),
        })
      }
    }

    // 날짜 범위 설정
    const now = new Date()
    const last30Days = subDays(now, 30)
    const last7Days = subDays(now, 7)

    // 1. 일별 게시글 작성 트렌드
    const dailyPostTrends = await prisma.$queryRaw<
      Array<{ date: Date; main_posts: bigint; community_posts: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'main' THEN 1 END) as main_posts,
        COUNT(CASE WHEN type = 'community' THEN 1 END) as community_posts
      FROM (
        SELECT created_at, 'main' as type FROM "MainPost" WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT created_at, 'community' as type FROM "CommunityPost" WHERE created_at >= ${last30Days}
      ) as all_posts
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // 2. 카테고리별 게시글 분포
    const [mainCategoryDist, communityCategoryDist] = await prisma.$transaction(
      [
        // 메인 카테고리별
        prisma.mainPost.groupBy({
          by: ['categoryId'],
          where: { createdAt: { gte: last7Days } },
          _count: { id: true },
          orderBy: { categoryId: 'asc' },
        }),
        // 커뮤니티 카테고리별
        prisma.communityPost.groupBy({
          by: ['categoryId'],
          where: { createdAt: { gte: last7Days } },
          _count: { id: true },
          orderBy: { categoryId: 'asc' },
        }),
      ]
    )

    // 카테고리 정보 가져오기
    const mainCategoryIds = mainCategoryDist
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null)
    const communityCategoryIds = communityCategoryDist
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null)

    const [mainCategories, communityCategories] = await prisma.$transaction([
      prisma.mainCategory.findMany({
        where: { id: { in: mainCategoryIds } },
        select: { id: true, name: true },
      }),
      prisma.communityCategory.findMany({
        where: { id: { in: communityCategoryIds } },
        select: { id: true, name: true },
      }),
    ])

    // 3. 태그별 트렌드 (TOP 20)
    const tagTrends = await prisma.$queryRaw<
      Array<{ tag_name: string; post_count: bigint; growth_rate: number }>
    >`
      WITH tag_counts AS (
        SELECT 
          t.name as tag_name,
          COUNT(CASE WHEN mp.created_at >= ${last7Days} THEN 1 END) as recent_count,
          COUNT(CASE WHEN mp.created_at >= ${subDays(now, 14)} AND mp.created_at < ${last7Days} THEN 1 END) as previous_count,
          COUNT(*) as total_count
        FROM "MainTag" t
        INNER JOIN "MainPostTag" mpt ON t.id = mpt.tag_id
        INNER JOIN "MainPost" mp ON mpt.post_id = mp.id
        WHERE mp.created_at >= ${subDays(now, 14)}
        GROUP BY t.name
      )
      SELECT 
        tag_name,
        recent_count as post_count,
        CASE 
          WHEN previous_count = 0 THEN 100
          ELSE ROUND(((recent_count - previous_count) * 100.0 / previous_count)::numeric, 2)
        END as growth_rate
      FROM tag_counts
      WHERE recent_count > 0
      ORDER BY recent_count DESC
      LIMIT 20
    `

    // 4. 게시글 품질 통계
    const postQualityStats = await prisma.$queryRaw<
      Array<{
        avg_views: number
        avg_likes: number
        avg_comments: number
        engagement_rate: number
      }>
    >`
      WITH post_stats AS (
        SELECT 
          AVG(view_count) as avg_views,
          AVG(like_count) as avg_likes,
          AVG(comment_count) as avg_comments,
          AVG(CASE WHEN view_count > 0 THEN (like_count + comment_count * 2.0) / view_count ELSE 0 END) as engagement_rate
        FROM (
          SELECT 
            p.view_count,
            COALESCE(l.like_count, 0) as like_count,
            COALESCE(c.comment_count, 0) as comment_count
          FROM "MainPost" p
          LEFT JOIN (
            SELECT post_id, COUNT(*) as like_count
            FROM "MainLike"
            GROUP BY post_id
          ) l ON p.id = l.post_id
          LEFT JOIN (
            SELECT post_id, COUNT(*) as comment_count
            FROM "MainComment"
            GROUP BY post_id
          ) c ON p.id = c.post_id
          WHERE p.created_at >= ${last7Days}
        ) as post_metrics
      )
      SELECT 
        ROUND(avg_views::numeric, 2) as avg_views,
        ROUND(avg_likes::numeric, 2) as avg_likes,
        ROUND(avg_comments::numeric, 2) as avg_comments,
        ROUND(engagement_rate::numeric, 4) as engagement_rate
      FROM post_stats
    `

    // 5. 인기 게시글 TOP 10
    const topPosts = await prisma.mainPost.findMany({
      where: { createdAt: { gte: last7Days } },
      select: {
        id: true,
        title: true,
        viewCount: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 10,
    })

    // 6. 게시글 상태별 통계
    const [mainPostStatusStats, communityPublishedCount] =
      await prisma.$transaction([
        // 메인 게시글
        prisma.mainPost.groupBy({
          by: ['status'],
          _count: { id: true },
          orderBy: { status: 'asc' },
        }),
        // 커뮤니티 게시글 (대부분 PUBLISHED)
        prisma.communityPost.count({
          where: { status: 'PUBLISHED' },
        }),
      ])

    // 결과 정리
    const result = {
      dailyTrends: dailyPostTrends.map((d) => ({
        date: format(d.date, 'yyyy-MM-dd'),
        mainPosts: Number(d.main_posts),
        communityPosts: Number(d.community_posts),
        total: Number(d.main_posts) + Number(d.community_posts),
      })),
      categoryDistribution: {
        main: mainCategoryDist.map((c) => {
          const category = mainCategories.find((cat) => cat.id === c.categoryId)
          const count =
            typeof c._count === 'object' && c._count?.id ? c._count.id : 0
          return {
            categoryId: c.categoryId,
            categoryName: category?.name || 'Unknown',
            count,
          }
        }),
        community: communityCategoryDist.map((c) => {
          const category = communityCategories.find(
            (cat) => cat.id === c.categoryId
          )
          const count =
            typeof c._count === 'object' && c._count?.id ? c._count.id : 0
          return {
            categoryId: c.categoryId,
            categoryName: category?.name || 'Unknown',
            count,
          }
        }),
      },
      tagTrends: tagTrends.map((t) => ({
        tagName: t.tag_name,
        postCount: Number(t.post_count),
        growthRate: Number(t.growth_rate),
      })),
      postQuality: postQualityStats[0] || {
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        engagementRate: 0,
      },
      topPosts: topPosts.map((p) => ({
        id: p.id,
        title: p.title,
        viewCount: p.viewCount,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        author: p.author
          ? {
              id: p.author.id,
              username: p.author.username,
              name: p.author.name,
              image: p.author.image,
            }
          : null,
      })),
      postStatus: {
        main: {
          draft: (() => {
            const stat = mainPostStatusStats.find((s) => s.status === 'DRAFT')
            return stat && typeof stat._count === 'object' && stat._count?.id
              ? stat._count.id
              : 0
          })(),
          pending: (() => {
            const stat = mainPostStatusStats.find((s) => s.status === 'PENDING')
            return stat && typeof stat._count === 'object' && stat._count?.id
              ? stat._count.id
              : 0
          })(),
          published: (() => {
            const stat = mainPostStatusStats.find(
              (s) => s.status === 'PUBLISHED'
            )
            return stat && typeof stat._count === 'object' && stat._count?.id
              ? stat._count.id
              : 0
          })(),
          rejected: (() => {
            const stat = mainPostStatusStats.find(
              (s) => s.status === 'REJECTED'
            )
            return stat && typeof stat._count === 'object' && stat._count?.id
              ? stat._count.id
              : 0
          })(),
          archived: (() => {
            const stat = mainPostStatusStats.find(
              (s) => s.status === 'ARCHIVED'
            )
            return stat && typeof stat._count === 'object' && stat._count?.id
              ? stat._count.id
              : 0
          })(),
          deleted: (() => {
            const stat = mainPostStatusStats.find((s) => s.status === 'DELETED')
            return stat && typeof stat._count === 'object' && stat._count?.id
              ? stat._count.id
              : 0
          })(),
        },
        community: {
          published: communityPublishedCount,
        },
      },
      generatedAt: new Date().toISOString(),
    }

    // Redis에 캐시 (10분)
    if (client) {
      await client.setex(cacheKey, 600, JSON.stringify(result))
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Post trends stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch post trends statistics',
      },
      { status: 500 }
    )
  }
}
