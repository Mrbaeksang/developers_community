import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import dynamic from 'next/dynamic'
import { prisma } from '@/lib/core/prisma'
import { canModifyMainContent } from '@/lib/auth/roles'

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

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params

  const post = await prisma.mainPost.findUnique({
    where: { id },
    select: { title: true },
  })

  return {
    title: post ? `${post.title} 수정` : '게시글 수정',
    description: '게시글을 수정합니다',
  }
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  // 로그인 체크
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 게시글 조회
  const post = await prisma.mainPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      categoryId: true,
      authorId: true,
      authorRole: true,
      status: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  })

  if (!post) {
    notFound()
  }

  // 현재 사용자 정보 조회
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // 수정 권한 확인
  const isAuthor = post.authorId === session.user.id
  const canModify = canModifyMainContent(
    user.globalRole,
    isAuthor,
    post.authorRole
  )

  if (!canModify) {
    redirect(`/main/posts/${id}`)
  }

  // 카테고리 목록 조회
  const categories = await prisma.mainCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      icon: true,
      requiresApproval: true,
    },
    orderBy: { order: 'asc' },
  })

  // PostEditor에 전달할 초기 데이터
  const initialData = {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || '',
    categoryId: post.categoryId,
    tags: post.tags.map((t) => t.tag.slug),
  }

  return (
    <PostEditor
      mode="edit"
      initialData={initialData}
      userRole={user.globalRole}
      postType="main"
      initialCategories={categories}
    />
  )
}
