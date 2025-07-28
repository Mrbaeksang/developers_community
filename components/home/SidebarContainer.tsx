import { Sidebar } from './Sidebar'
import { prisma } from '@/lib/prisma'

async function getSidebarData() {
  try {
    // 서버 컴포넌트에서는 직접 데이터베이스 조회
    const [tags, activeUsers, stats] = await Promise.all([
      // 인기 태그 조회
      prisma.mainTag.findMany({
        take: 5,
        orderBy: {
          postCount: 'desc',
        },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      }),
      // 활발한 사용자 조회
      prisma.user.findMany({
        take: 5,
        orderBy: {
          mainPosts: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: { mainPosts: true },
          },
        },
      }),
      // 통계 조회
      Promise.all([
        prisma.mainPost.count(),
        prisma.communityPost.count(),
        prisma.user.count(),
      ]),
    ])

    const [totalPosts, totalCommunityPosts, totalUsers] = stats

    return {
      trendingTags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag.postCount, // SidebarProps 타입에 맞게 수정
      })),
      activeUsers: activeUsers.map((user) => ({
        id: user.id,
        name: user.name || 'Unknown',
        image: user.image || undefined, // null을 undefined로 변환
        postCount: user._count.mainPosts,
      })),
      stats: {
        totalUsers,
        weeklyPosts: totalPosts, // 임시로 전체 포스트 수 사용
        weeklyComments: 0, // 추후 구현
        activeDiscussions: totalCommunityPosts,
      },
    }
  } catch (error) {
    console.error('사이드바 데이터 조회 실패:', error)
    return {
      trendingTags: [],
      activeUsers: [],
      stats: {
        totalUsers: 0,
        weeklyPosts: 0,
        weeklyComments: 0,
        activeDiscussions: 0,
      },
    }
  }
}

export async function SidebarContainer() {
  const data = await getSidebarData()

  return <Sidebar {...data} />
}
