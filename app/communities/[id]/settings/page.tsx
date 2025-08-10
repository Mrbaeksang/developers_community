import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import Link from 'next/link'
import { ChevronRight, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GeneralSettings,
  CategorySettings,
  MemberSettings,
  AdvancedSettings,
} from '@/components/communities/settings'

export default async function CommunitySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 커뮤니티 정보 및 권한 확인 (ID 또는 slug로 찾기)
  const community = await prisma.community.findFirst({
    where: {
      OR: [{ id: resolvedParams.id }, { slug: resolvedParams.id }],
    },
    include: {
      members: {
        where: { userId: session.user.id },
      },
      categories: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!community) {
    notFound()
  }

  // 관리자 권한 확인 (OWNER만 설정 가능)
  const membership = community.members[0]
  if (
    !membership ||
    membership.status !== 'ACTIVE' ||
    membership.role !== 'OWNER'
  ) {
    redirect(`/communities/${community.slug}`)
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 브레드크럼 */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/communities" className="hover:text-primary">
            커뮤니티
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/communities/${community.slug}`}
            className="hover:text-primary"
          >
            {community.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">설정</span>
        </nav>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            커뮤니티 설정
          </h1>
          <p className="text-muted-foreground mt-2">
            커뮤니티의 정보와 기능을 관리합니다.
          </p>
        </div>

        {/* 탭 메뉴 */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="categories">카테고리</TabsTrigger>
            <TabsTrigger value="members">멤버 관리</TabsTrigger>
            <TabsTrigger value="advanced">고급 설정</TabsTrigger>
          </TabsList>

          {/* 일반 설정 */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>일반 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <GeneralSettings community={community} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 카테고리 설정 */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>카테고리 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <CategorySettings
                  communityId={community.id}
                  categories={community.categories}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 멤버 관리 */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>멤버 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <MemberSettings
                  communityId={community.id}
                  currentUserId={session.user.id}
                  isOwner={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 고급 설정 */}
          <TabsContent value="advanced">
            <AdvancedSettings community={community} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
