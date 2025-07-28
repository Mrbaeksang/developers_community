import { Suspense } from 'react'
import { PostListServer } from '@/components/posts/PostListServer'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: '게시글 목록 | Dev Community',
  description: '개발자들의 지식 공유 게시글',
}

// 카테고리 필터를 위한 타입
interface PostsPageProps {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams
  const category = params.category
  const sort = params.sort || 'latest'
  const page = params.page || '1'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">게시글</h1>
          <p className="text-muted-foreground">
            개발자들이 공유하는 지식과 경험을 만나보세요
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              }
            >
              <PostListServer category={category} sort={sort} page={page} />
            </Suspense>
          </div>

          {/* 사이드바 */}
          <aside className="space-y-6">
            <Suspense fallback={<Skeleton className="h-96" />}>
              <SidebarContainer />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
  )
}
