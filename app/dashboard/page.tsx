import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/core/prisma'
import { UserStats } from '@/components/dashboard/UserStats'
import {
  ActivityFeed,
  type ActivityItem,
} from '@/components/dashboard/ActivityFeed'
import { DashboardQuickLinks } from '@/components/dashboard/DashboardQuickLinks'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'

async function getDashboardData(userId: string) {
  const [
    user,
    mainPosts,
    communityPosts,
    mainComments,
    mainLikes,
    mainBookmarks,
    communities,
    recentActivities,
  ] = await Promise.all([
    // 사용자 정보
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
      },
    }),
    // 통계 데이터
    prisma.mainPost.count({ where: { authorId: userId, status: 'PUBLISHED' } }),
    prisma.communityPost.count({
      where: { authorId: userId, status: 'PUBLISHED' },
    }),
    prisma.mainComment.count({ where: { authorId: userId } }),
    prisma.mainLike.count({ where: { userId } }),
    prisma.mainBookmark.count({ where: { userId } }),
    prisma.communityMember.count({ where: { userId, status: 'ACTIVE' } }),
    // 최근 활동 데이터
    getRecentActivities(userId),
  ])

  return {
    user,
    stats: {
      totalPosts: mainPosts + communityPosts,
      mainPosts,
      communityPosts,
      mainComments,
      mainLikes,
      mainBookmarks,
      communities,
    },
    activities: recentActivities,
  }
}

async function getRecentActivities(userId: string): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []

  // 최근 작성한 메인 게시글
  const recentMainPosts = await prisma.mainPost.findMany({
    where: { authorId: userId, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      excerpt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  recentMainPosts.forEach((post) => {
    activities.push({
      id: `main-post-${post.id}`,
      type: 'post_created',
      title: '메인 게시글 작성',
      description: post.title,
      timestamp: post.createdAt.toISOString(),
      target: {
        id: post.id,
        title: post.title,
        type: 'main_post',
      },
    })
  })

  // 최근 작성한 커뮤니티 게시글
  const recentCommunityPosts = await prisma.communityPost.findMany({
    where: { authorId: userId, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  recentCommunityPosts.forEach((post) => {
    activities.push({
      id: `community-post-${post.id}`,
      type: 'post_created',
      title: '커뮤니티 게시글 작성',
      description: post.title,
      timestamp: post.createdAt.toISOString(),
      target: {
        id: post.id,
        title: post.title,
        type: 'community_post',
      },
      community: post.community,
    })
  })

  // 최근 댓글
  const recentComments = await prisma.mainComment.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  recentComments.forEach((comment) => {
    activities.push({
      id: `comment-${comment.id}`,
      type: 'comment_added',
      title: '댓글 작성',
      description: comment.content.substring(0, 100),
      timestamp: comment.createdAt.toISOString(),
      target: {
        id: comment.post.id,
        title: comment.post.title,
        type: 'main_post',
      },
    })
  })

  // 최근 좋아요
  const recentLikes = await prisma.mainLike.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  recentLikes.forEach((like) => {
    activities.push({
      id: `like-${like.id}`,
      type: 'post_liked',
      title: '게시글 좋아요',
      description: like.post.title,
      timestamp: like.createdAt.toISOString(),
      target: {
        id: like.post.id,
        title: like.post.title,
        type: 'main_post',
      },
    })
  })

  // 최근 가입한 커뮤니티
  const recentMemberships = await prisma.communityMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: {
      id: true,
      joinedAt: true,
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
    take: 3,
  })

  recentMemberships.forEach((membership) => {
    activities.push({
      id: `membership-${membership.id}`,
      type: 'community_joined',
      title: '커뮤니티 가입',
      description: membership.community.name,
      timestamp: membership.joinedAt.toISOString(),
      target: {
        id: membership.community.id,
        title: membership.community.name,
        slug: membership.community.slug,
        type: 'community',
      },
    })
  })

  // 시간순 정렬
  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10)
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { user, stats, activities } = await getDashboardData(session.user.id)

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 헤더 섹션 */}
      <DashboardHeader user={user} />

      {/* 메인 그리드 레이아웃 */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* 왼쪽: 통계 및 개요 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 사용자 통계 */}
          <section>
            <h2 className="text-xl font-black mb-4">활동 통계</h2>
            <UserStats
              stats={{
                mainPosts: stats.mainPosts,
                communityPosts: stats.communityPosts,
                mainComments: stats.mainComments,
                mainLikes: stats.mainLikes,
                mainBookmarks: stats.mainBookmarks,
              }}
            />
          </section>

          {/* 추가 개요 정보 */}
          <DashboardOverview stats={stats} />

          {/* 최근 활동 피드 (모바일에서는 아래로) */}
          <section className="lg:hidden">
            <ActivityFeed
              activities={activities}
              showUserInfo={false}
              maxItems={5}
            />
          </section>
        </div>

        {/* 오른쪽: 활동 피드 및 빠른 링크 */}
        <div className="space-y-8">
          {/* 최근 활동 피드 (데스크톱) */}
          <section className="hidden lg:block">
            <ActivityFeed
              activities={activities}
              showUserInfo={false}
              maxItems={5}
            />
          </section>

          {/* 빠른 링크 */}
          <DashboardQuickLinks userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
