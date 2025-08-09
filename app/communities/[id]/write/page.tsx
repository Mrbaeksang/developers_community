import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import dynamic from 'next/dynamic'

const PostEditor = dynamic(
  () =>
    import('@/components/posts/PostEditor').then((mod) => ({
      default: mod.PostEditor,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">에디터 로딩 중...</p>
        </div>
      </div>
    ),
  }
)

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
            href={`/communities/${community.id}`}
            className="hover:text-primary"
          >
            {community.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/communities/${community.id}`}
            className="hover:text-primary"
          >
            게시글
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">글쓰기</span>
        </nav>

        {/* 에디터 */}
        <PostEditor
          postType="community"
          communityId={community.id}
          userRole={session.user.role}
          initialCategories={community.categories}
        />
      </div>
    </div>
  )
}
