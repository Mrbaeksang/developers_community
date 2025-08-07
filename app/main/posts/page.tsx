import { Suspense } from 'react'
import { PostListServer } from '@/components/posts/PostListServer'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { getApiUrl } from '@/lib/api/client'

export const metadata = {
  title: '게시글 목록 | Dev Community',
  description: '개발자들의 지식 공유 게시글',
}

// 카테고리 필터를 위한 타입
interface PostsPageProps {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>
}

interface TrendingTag {
  id: string
  name: string
  slug: string
  color: string | null
  postCount: number
  weeklyPosts: number
  trendingScore: number
}

interface WeeklyMVPUser {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  globalRole: string
  weeklyStats: {
    postCount: number
    totalViews: number
    totalLikes: number
    totalComments: number
    engagementScore: number
  }
  rank: number
}

interface WeeklyTrendingPost {
  id: string
  title: string
  viewCount: number
  weeklyViews: number
  author: {
    name: string | null
  }
}

async function getSidebarData() {
  try {
    const [tagsRes, usersRes, trendingRes] = await Promise.all([
      fetch(`${getApiUrl()}/api/main/tags/trending?limit=8`, {
        next: { revalidate: 3600 }, // 1 hour cache for tags
      }),
      fetch(`${getApiUrl()}/api/main/users/weekly-mvp?limit=5`, {
        next: { revalidate: 300 }, // 5 minutes cache for active users
      }),
      fetch(`${getApiUrl()}/api/main/posts/weekly-trending?limit=3`, {
        next: { revalidate: 300 }, // 5 minutes cache for trending
      }),
    ])

    const [tagsData, usersData, trendingData] = await Promise.all([
      tagsRes.ok ? tagsRes.json() : { data: [] },
      usersRes.ok ? usersRes.json() : { data: [] },
      trendingRes.ok ? trendingRes.json() : { data: { posts: [] } },
    ])

    // Map the API response to the expected format for Sidebar
    const mappedTags = ((tagsData.data || []) as TrendingTag[]).map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.postCount || tag.weeklyPosts || 0,
      color: tag.color || '#3B82F6',
    }))

    const mappedUsers = ((usersData.data || []) as WeeklyMVPUser[]).map(
      (user) => ({
        id: user.id,
        name: user.name || user.username || 'Unknown',
        image: user.image || undefined,
        postCount: user.weeklyStats?.postCount || 0,
      })
    )

    // For trending posts, map the weekly trending response
    const mappedPosts = (
      (trendingData.data?.items ||
        trendingData.data ||
        []) as WeeklyTrendingPost[]
    ).map((post) => ({
      id: post.id,
      title: post.title,
      viewCount: post.viewCount || 0,
      weeklyViews: post.weeklyViews || post.viewCount || 0,
      author: {
        name: post.author?.name || 'Unknown',
      },
    }))

    return {
      trendingTags: mappedTags,
      activeUsers: mappedUsers,
      trendingPosts: mappedPosts,
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
                    <div
                      key={i}
                      className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6"
                    >
                      <SkeletonLoader lines={4} />
                    </div>
                  ))}
                </div>
              }
            >
              <PostListServer category={category} sort={sort} page={page} />
            </Suspense>
          </div>

          {/* 사이드바 */}
          <aside className="space-y-6">
            <Suspense
              fallback={
                <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
                  <SkeletonLoader lines={10} />
                </div>
              }
            >
              <SidebarContainer sidebarData={sidebarData} />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
  )
}
