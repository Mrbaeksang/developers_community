import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, MessageSquare, Users, Heart } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getDashboardStats(userId: string) {
  const [mainPosts, communityPosts, comments, likes, communities] = await Promise.all([
    prisma.mainPost.count({ where: { authorId: userId } }),
    prisma.communityPost.count({ where: { authorId: userId } }),
    prisma.mainComment.count({ where: { authorId: userId } }),
    prisma.mainLike.count({ where: { userId } }),
    prisma.communityMember.count({ where: { userId, status: 'ACTIVE' } })
  ])

  return {
    totalPosts: mainPosts + communityPosts,
    mainPosts,
    communityPosts,
    comments,
    likes,
    communities
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const stats = await getDashboardStats(session.user.id)

  return (
    <div className="container max-w-7xl py-8">
      <h1 className="text-3xl font-black mb-8">대시보드</h1>
      
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 게시글</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              메인 {stats.mainPosts} · 커뮤니티 {stats.communityPosts}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">댓글</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.comments}</div>
            <p className="text-xs text-muted-foreground">작성한 댓글 수</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">좋아요</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.likes}</div>
            <p className="text-xs text-muted-foreground">누른 좋아요 수</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">커뮤니티</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.communities}</div>
            <p className="text-xs text-muted-foreground">가입한 커뮤니티</p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 링크 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>내 활동</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/profile/${session.user.id}`} className="block p-2 hover:bg-secondary rounded">
              → 내 프로필 보기
            </Link>
            <Link href="/posts/write" className="block p-2 hover:bg-secondary rounded">
              → 새 게시글 작성
            </Link>
            <Link href="/communities" className="block p-2 hover:bg-secondary rounded">
              → 커뮤니티 둘러보기
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>계정 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/settings/profile" className="block p-2 hover:bg-secondary rounded">
              → 프로필 편집
            </Link>
            <Link href="/settings/account" className="block p-2 hover:bg-secondary rounded">
              → 계정 설정
            </Link>
            <Link href="/settings/notifications" className="block p-2 hover:bg-secondary rounded">
              → 알림 설정
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
