import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/home/HeroSection'
import { getApiUrl } from '@/lib/api/client'

// Dynamic imports for heavy components
const WeeklyPopularPosts = dynamic(
  () =>
    import('@/components/home/WeeklyPopularPosts').then((mod) => ({
      default: mod.WeeklyPopularPosts,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />
    ),
  }
)

const RecentPosts = dynamic(
  () =>
    import('@/components/home/RecentPosts').then((mod) => ({
      default: mod.RecentPosts,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />
    ),
  }
)

const CategoryGrid = dynamic(
  () =>
    import('@/components/home/CategoryGrid').then((mod) => ({
      default: mod.CategoryGrid,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 h-64 rounded-lg" />
    ),
  }
)

const ActiveCommunities = dynamic(
  () =>
    import('@/components/home/ActiveCommunities').then((mod) => ({
      default: mod.ActiveCommunities,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 h-48 rounded-lg" />
    ),
  }
)

const SidebarContainer = dynamic(
  () =>
    import('@/components/home/SidebarContainer').then((mod) => ({
      default: mod.SidebarContainer,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 h-64 rounded-lg" />
    ),
  }
)

// 서버 사이드에서 필요한 데이터만 가져오기 (클라이언트 컴포넌트에서 직접 호출)

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
      tagsRes.ok ? tagsRes.json() : { data: [] },
      usersRes.ok ? usersRes.json() : { data: [] },
      trendingRes.ok ? trendingRes.json() : { data: { posts: [] } },
    ])

    return {
      trendingTags: tagsData.data?.tags || [],
      activeUsers: usersData.data?.users || [],
      trendingPosts: trendingData.data?.posts || [],
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

export const revalidate = 300 // 5분마다 재검증

export default async function Home() {
  const sidebarData = await getSidebarData()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Content Area */}
          <main className="space-y-8">
            {/* 카테고리 그리드 */}
            <section className="mb-16">
              <h3 className="text-4xl font-black text-center mb-12">
                분야별 탐색
              </h3>
              <CategoryGrid />
            </section>

            {/* 주간 인기 게시글 */}
            <section>
              <WeeklyPopularPosts />
            </section>

            {/* 최근 게시글 */}
            <section>
              <RecentPosts />
            </section>

            {/* 활성 커뮤니티 - 모바일에서만 보이기 */}
            <section className="lg:hidden">
              <ActiveCommunities />
            </section>
          </main>

          {/* Sidebar */}
          <aside className="space-y-6">
            <SidebarContainer sidebarData={sidebarData} />

            {/* 활성 커뮤니티 - 데스크톱에서만 보이기 */}
            <div className="hidden lg:block">
              <ActiveCommunities />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
// test
