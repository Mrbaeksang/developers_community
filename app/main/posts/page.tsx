import { Suspense } from 'react'
import { PostListServer } from '@/components/posts/PostListServer'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiUrl } from '@/lib/api'

export const metadata = {
  title: '게시글 목록 | Dev Community',
  description: '개발자들의 지식 공유 게시글',
}

// 카테고리 필터를 위한 타입
interface PostsPageProps {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>
}

async function getSidebarData() {
  try {
    const [tagsRes, usersRes, trendingRes] = await Promise.all([
      fetch(`${getApiUrl()}/api/main/tags?limit=8`, {
        next: { revalidate: 3600 }, // 1 hour cache for tags
      }),
      fetch(`${getApiUrl()}/api/main/users/active?limit=5`, {
        next: { revalidate: 300 }, // 5 minutes cache for active users
      }),
      fetch(`${getApiUrl()}/api/main/posts/weekly-trending?limit=3`, {
        next: { revalidate: 300 }, // 5 minutes cache for trending
      }),
    ])

    const [tagsData, usersData, trendingData] = await Promise.all([
      tagsRes.ok ? tagsRes.json() : { tags: [] },
      usersRes.ok ? usersRes.json() : { users: [] },
      trendingRes.ok ? trendingRes.json() : { posts: [] },
    ])

    return {
      trendingTags: tagsData.tags || [],
      activeUsers: usersData.users || [],
      trendingPosts: trendingData.posts || [],
    }
  } catch (error) {
    console.error('사이드바 데이터 조회 실패:', error)
    return {
      trendingTags: [],
      activeUsers: [],
      trendingPosts: [],
    }
  }
}

export const revalidate = 60 // 1 minute revalidation for posts page

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams
  const category = params.category
  const sort = params.sort || 'latest'
  const page = params.page || '1'

  const sidebarData = await getSidebarData()

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
              <SidebarContainer sidebarData={sidebarData} />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
  )
}
