import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
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

export const metadata: Metadata = {
  title: '게시글 작성',
  description: '새로운 게시글을 작성하세요',
}

interface WritePageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function WritePage({ searchParams }: WritePageProps) {
  const session = await auth()
  const params = await searchParams

  // 로그인 체크
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <PostEditor
      userRole={session.user?.role}
      initialCategorySlug={params.category}
    />
  )
}
