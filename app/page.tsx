import dynamic from 'next/dynamic'
import { Metadata } from 'next'
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

export const revalidate = 300 // 5분마다 재검증

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '바이브 코딩 홈 | 코딩 초보부터 AI 개발까지 함께하는 커뮤니티',
    description:
      '바이브 코딩과 웹개발, AI 개발을 배우고 싶다면? 코딩 초보자도 쉽게 시작할 수 있는 개발자 커뮤니티. 프로그래밍 질문답변, 개발 팁, 코딩 독학 가이드까지.',
    keywords:
      '바이브 코딩, 코딩 초보, 웹개발 입문, AI 개발 초보, 프로그래밍 독학, 개발자 되는법, Next.js 튜토리얼, React 기초, 코딩 질문',
    openGraph: {
      title: '바이브 코딩 홈 | 코딩 초보부터 AI 개발까지',
      description:
        '바이브 코딩과 웹개발, AI 개발을 배우고 싶다면? 코딩 초보자도 쉽게 시작할 수 있는 개발자 커뮤니티',
      type: 'website',
      locale: 'ko_KR',
    },
    alternates: {
      canonical: 'https://developers-community-two.vercel.app',
    },
  }
}

export default async function Home() {
  const sidebarData = await getSidebarData()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '바이브 코딩 | Dev Community',
    alternateName: ['Dev Community', '개발자 커뮤니티', 'Vibe Coding'],
    url: 'https://developers-community-two.vercel.app',
    description:
      '바이브 코딩, 웹개발, AI 개발을 함께 배우는 초보자 친화적 개발자 커뮤니티',
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://developers-community-two.vercel.app/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dev Community',
      description: '개발자들을 위한 지식 공유 커뮤니티',
    },
    audience: {
      '@type': 'Audience',
      audienceType: [
        '코딩 초보자',
        '웹 개발자',
        'AI 개발자',
        '프로그래밍 입문자',
      ],
    },
    keywords: [
      '바이브 코딩',
      '코딩 초보',
      '웹개발',
      'AI 개발',
      '프로그래밍 입문',
      '개발자 커뮤니티',
      'Next.js',
      'React',
      '코딩 독학',
    ],
    about: [
      {
        '@type': 'Thing',
        name: '바이브 코딩',
        description: '즐겁고 창의적인 코딩 접근 방식',
      },
      {
        '@type': 'Thing',
        name: '웹개발',
        description: '현대적인 웹 애플리케이션 개발',
      },
      {
        '@type': 'Thing',
        name: 'AI 개발',
        description: '인공지능과 머신러닝 개발',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

          {/* Sidebar - 데스크톱에서만 보이기 */}
          <aside className="hidden lg:block space-y-6">
            <SidebarContainer sidebarData={sidebarData} />

            {/* 활성 커뮤니티 - 데스크톱에서만 보이기 */}
            <ActiveCommunities />
          </aside>
        </div>
      </div>
    </div>
  )
}
// test
