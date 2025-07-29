import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CommunityPostEditor } from '@/components/communities/CommunityPostEditor'

export default async function CommunityWritePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 커뮤니티 정보 및 멤버십 확인 (ID 또는 slug로 찾기)
  const community = await prisma.community.findFirst({
    where: {
      OR: [{ id: resolvedParams.id }, { slug: resolvedParams.id }],
    },
    include: {
      members: {
        where: { userId: session.user.id },
      },
      categories: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!community) {
    notFound()
  }

  // 멤버십 확인
  const membership = community.members[0]
  if (!membership || membership.status !== 'ACTIVE') {
    redirect(`/communities/${community.id}`)
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          <Link
            href={`/communities/${community.slug}/posts`}
            className="hover:text-primary"
          >
            게시글
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">글쓰기</span>
        </nav>

        {/* 에디터 */}
        <CommunityPostEditor
          communityId={community.id}
          communitySlug={community.slug}
          categories={community.categories}
          allowFileUpload={community.allowFileUpload}
          maxFileSize={community.maxFileSize}
        />
      </div>
    </div>
  )
}
