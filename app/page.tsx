import { HeroSection } from '@/components/home/HeroSection'
import { WeeklyPopularPosts } from '@/components/home/WeeklyPopularPosts'
import { RecentPosts } from '@/components/home/RecentPosts'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { ActiveCommunities } from '@/components/home/ActiveCommunities'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { getApiUrl } from '@/lib/api'

// 서버 사이드에서 필요한 데이터만 가져오기 (클라이언트 컴포넌트에서 직접 호출)

async function getSidebarData() {
  try {
    const [tagsRes, usersRes, statsRes] = await Promise.all([
      fetch(`${getApiUrl()}/api/main/tags?limit=5`, { cache: 'no-store' }),
      fetch(`${getApiUrl()}/api/main/users/active?limit=5`, {
        cache: 'no-store',
      }),
      fetch(`${getApiUrl()}/api/main/stats`, { cache: 'no-store' }),
    ])

    const [tagsData, usersData, statsData] = await Promise.all([
      tagsRes.ok ? tagsRes.json() : { tags: [] },
      usersRes.ok ? usersRes.json() : { users: [] },
      statsRes.ok ? statsRes.json() : { stats: {} },
    ])

    return {
      trendingTags: tagsData.tags || [],
      activeUsers: usersData.users || [],
      stats: statsData.stats || {
        totalUsers: 0,
        weeklyPosts: 0,
        weeklyComments: 0,
        activeDiscussions: 0,
      },
    }
  } catch (error) {
    console.error('사이드바 데이터 조회 실패:', error)
    return {
      trendingTags: [],
      activeUsers: [],
      stats: {
        totalUsers: 0,
        weeklyPosts: 0,
        weeklyComments: 0,
        activeDiscussions: 0,
      },
    }
  }
}

export const revalidate = 0 // 캐싱 비활성화

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
            <section>
              <h2 className="text-2xl font-bold mb-4">게시판 둘러보기</h2>
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
