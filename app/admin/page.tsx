import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  MessageSquare,
  Heart,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react'

async function getAdminStats() {
  try {
    const [
      totalPosts,
      pendingPosts,
      totalUsers,
      totalComments,
      totalLikes,
      totalViews,
      recentUsers,
    ] = await Promise.all([
      prisma.mainPost.count(),
      prisma.mainPost.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
      prisma.mainComment.count(),
      prisma.mainLike.count(),
      prisma.mainPost.aggregate({ _sum: { viewCount: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
          },
        },
      }),
    ])

    return {
      totalPosts,
      pendingPosts,
      totalUsers,
      totalComments,
      totalLikes,
      totalViews: totalViews._sum.viewCount || 0,
      recentUsers,
    }
  } catch (error) {
    console.error('관리자 통계 조회 실패:', error)
    return {
      totalPosts: 0,
      pendingPosts: 0,
      totalUsers: 0,
      totalComments: 0,
      totalLikes: 0,
      totalViews: 0,
      recentUsers: 0,
    }
  }
}

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/signin')
  }

  // 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  })

  if (!user || (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')) {
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
  ]

  const statsCards = [
    {
      title: '전체 게시글',
      value: stats.totalPosts,
      icon: FileText,
      description: '승인된 게시글 수',
    },
    {
      title: '승인 대기',
      value: stats.pendingPosts,
      icon: Clock,
      description: '검토가 필요한 게시글',
      alert: stats.pendingPosts > 0,
    },
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      icon: Users,
      description: '등록된 사용자 수',
    },
    {
      title: '이번 주 신규',
      value: stats.recentUsers,
      icon: Users,
      description: '최근 7일간 가입자',
    },
    {
      title: '전체 댓글',
      value: stats.totalComments,
      icon: MessageSquare,
      description: '작성된 댓글 수',
    },
    {
      title: '전체 좋아요',
      value: stats.totalLikes,
      icon: Heart,
      description: '받은 좋아요 수',
    },
    {
      title: '전체 조회수',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      description: '누적 조회수',
    },
    {
      title: '시스템 상태',
      value: '정상',
      icon: CheckCircle,
      description: '모든 서비스 정상 작동',
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

      {/* 승인 대기 알림 */}
      {stats.pendingPosts > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {stats.pendingPosts}개의 게시글이 승인을 기다리고 있습니다
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    검토가 필요한 게시글을 확인해주세요.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/admin/pending">지금 검토하기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <Card key={index} className={card.alert ? 'border-orange-200' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
                <card.icon
                  className={`h-8 w-8 ${card.alert ? 'text-orange-600' : 'text-muted-foreground'}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminMenus.map((menu, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <menu.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">{menu.title}</CardTitle>
                </div>
                {menu.badge && (
                  <Badge variant={menu.color as any}>{menu.badge}</Badge>
                )}
              </div>
              <CardDescription>{menu.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={menu.href}>{menu.title} 바로가기</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
