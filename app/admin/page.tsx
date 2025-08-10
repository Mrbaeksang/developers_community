import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/core/prisma'
import Link from 'next/link'
import { lazy, Suspense } from 'react'
import { formatCount } from '@/lib/common/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import {
  FileText,
  Users,
  MessageSquare,
  Eye,
  Shield,
  Database,
  FolderOpen,
  Users2,
  Hash,
} from 'lucide-react'

// 레이지 로딩으로 RealtimeDashboard 최적화
const RealtimeDashboard = lazy(() =>
  import('@/components/admin/RealtimeDashboard').then((mod) => ({
    default: mod.RealtimeDashboard,
  }))
)

async function getAdminStats() {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalPosts,
      pendingPosts,
      totalUsers,
      recentUsers,
      totalCommunities,
      weeklyPosts,
      weeklyCommunities,
      totalViews,
      todayPosts,
      todayViews,
    ] = await Promise.all([
      prisma.mainPost.count(),
      prisma.mainPost.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.community.count(),
      prisma.mainPost.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.community.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.mainPost.aggregate({ _sum: { viewCount: true } }),
      prisma.mainPost.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 오늘 생성된 게시글들의 조회수 합계
      prisma.mainPost.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { viewCount: true },
      }),
    ])

    return {
      totalPosts,
      pendingPosts,
      totalUsers,
      recentUsers,
      totalCommunities,
      weeklyPosts,
      weeklyCommunities,
      totalViews: totalViews._sum.viewCount || 0,
      todayPosts,
      todayViews: todayViews._sum.viewCount || 0,
    }
  } catch (error) {
    console.error('관리자 통계 조회 실패:', error)
    return {
      totalPosts: 0,
      pendingPosts: 0,
      totalUsers: 0,
      recentUsers: 0,
      totalCommunities: 0,
      weeklyPosts: 0,
      weeklyCommunities: 0,
      totalViews: 0,
      todayPosts: 0,
      todayViews: 0,
    }
  }
}

// 대시보드 스켈레톤 컴포넌트
function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card
          key={i}
          className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <CardContent className="p-6">
            <SkeletonLoader lines={3} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  })

  // ADMIN 권한만 허용 (절대 권력자)
  if (!user || user.globalRole !== 'ADMIN') {
    redirect('/')
  }

  const stats = await getAdminStats()

  const adminMenus = [
    {
      title: '게시글 승인',
      description: '승인 대기 중인 게시글을 검토하고 승인/거부 처리',
      href: '/admin/pending',
      icon: FileText,
      badge: stats.pendingPosts > 0 ? stats.pendingPosts : null,
      color: stats.pendingPosts > 0 ? 'destructive' : 'secondary',
    },
    {
      title: '게시글 관리',
      description: '메인 사이트와 커뮤니티의 모든 게시글 관리',
      href: '/admin/posts',
      icon: MessageSquare,
      badge: null,
      color: 'secondary',
    },
    {
      title: '사용자 관리',
      description: '사용자 권한, 차단, 활성화 상태 관리',
      href: '/admin/users',
      icon: Users,
      badge: null,
      color: 'secondary',
    },
    {
      title: '커뮤니티 관리',
      description: '생성된 모든 커뮤니티를 관리하고 설정',
      href: '/admin/communities',
      icon: Users2,
      badge: null,
      color: 'secondary',
    },
    {
      title: '카테고리 관리',
      description: '메인 사이트 카테고리를 생성, 수정, 삭제',
      href: '/admin/categories',
      icon: FolderOpen,
      badge: null,
      color: 'secondary',
    },
    {
      title: '태그 관리',
      description: '메인 사이트 태그를 생성, 수정, 삭제하고 통계 확인',
      href: '/admin/tags',
      icon: Hash,
      badge: null,
      color: 'secondary',
    },
    {
      title: '데이터베이스 뷰어',
      description: '모든 테이블의 데이터를 조회하고 검색',
      href: '/admin/database',
      icon: Database,
      badge: null,
      color: 'secondary',
    },
  ]

  const statsCards = [
    {
      title: '전체 사용자',
      value: formatCount(stats.totalUsers),
      icon: Users,
      description: `이번 주 신규 +${stats.recentUsers}명`,
      bgColor: '',
      color: 'text-blue-600',
    },
    {
      title: '전체 조회수',
      value: formatCount(stats.totalViews),
      icon: Eye,
      description: `모든 게시글 조회수 합계 (누적) | 오늘 게시글 조회수: ${formatCount(stats.todayViews)}`,
      bgColor: '',
      color: 'text-green-600',
    },
    {
      title: '전체 게시글',
      value: formatCount(stats.totalPosts),
      icon: FileText,
      description: `이번 주 게시글 +${stats.weeklyPosts}개`,
      bgColor: '',
      color: 'text-purple-600',
    },
    {
      title: '전체 커뮤니티',
      value: formatCount(stats.totalCommunities),
      icon: Users2,
      description: `이번 주 신규 +${stats.weeklyCommunities}개`,
      bgColor: '',
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        </div>
        <p className="text-muted-foreground">
          사이트 전반적인 관리와 통계를 확인하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card, index) => (
          <Card key={index} className={card.bgColor || ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <card.icon
                  className={`h-5 w-5 ${card.color || 'text-muted-foreground'}`}
                />
                <span className={`text-3xl font-bold ${card.color || ''}`}>
                  {card.value}
                </span>
              </div>
              <h3 className="font-medium text-sm">{card.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 관리 메뉴 */}
      <div className="space-y-6">
        {/* 콘텐츠 관리 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">콘텐츠 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminMenus.slice(0, 3).map((menu, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        menu.badge && menu.badge > 0
                          ? 'bg-orange-100 dark:bg-orange-900'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <menu.icon
                        className={`h-5 w-5 ${
                          menu.badge && menu.badge > 0
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    {menu.badge && (
                      <Badge variant="destructive" className="animate-pulse">
                        {menu.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">{menu.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {menu.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    asChild
                    variant={
                      menu.badge && menu.badge > 0 ? 'default' : 'secondary'
                    }
                    className="w-full"
                  >
                    <Link href={menu.href}>바로가기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 시스템 관리 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">시스템 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminMenus.slice(3).map((menu, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <menu.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  <CardTitle className="text-base">{menu.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {menu.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={menu.href}>바로가기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 실시간 모니터링 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">실시간 모니터링</h2>
          <Suspense fallback={<DashboardSkeleton />}>
            <RealtimeDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
