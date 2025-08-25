import dynamic from 'next/dynamic'
import { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { StructuredData } from '@/components/seo/StructuredData'
import { getApiUrl } from '@/lib/api/client'

// Dynamic imports for heavy components with SSR disabled for Samsung Internet compatibility
const WeeklyPopularPosts = dynamic(
  () =>
    import('@/components/home/WeeklyPopularPosts').then((mod) => ({
      default: mod.WeeklyPopularPosts,
    })),
  {
    ssr: false,
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
    ssr: false,
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
    ssr: false,
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
    ssr: false,
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
    ssr: false,
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
    // 안전한 데이터 처리 - 배열이 아닌 경우 빈 배열로 처리
    const tagsArray = Array.isArray(tagsData?.data) ? tagsData.data : []
    const mappedTags = tagsArray.map((tag: TrendingTag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.postCount || tag.weeklyPosts || 0,
      color: tag.color || '#3B82F6',
    }))

    const usersArray = Array.isArray(usersData?.data) ? usersData.data : []
    const mappedUsers = usersArray.map((user: WeeklyMVPUser) => ({
      id: user.id,
      name: user.name || user.username || 'Unknown',
      image: user.image || undefined,
      postCount: user.weeklyStats?.postCount || 0,
    }))

    // For trending posts, map the weekly trending response
    // API 응답 구조에 따라 적절히 처리
    const postsArray = Array.isArray(trendingData?.data?.items)
      ? trendingData.data.items
      : Array.isArray(trendingData?.data)
        ? trendingData.data
        : []
    const mappedPosts = postsArray.map((post: WeeklyTrendingPost) => ({
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

// ISR (Incremental Static Regeneration) 설정
// 60초마다 페이지를 재생성하여 Active CPU 사용량 대폭 감소
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '바이브 코딩 | 개발자 커뮤니티',
    description:
      '코딩 공부부터 취업까지! React, JavaScript 오류 해결과 실무 팁을 공유하는 개발자 커뮤니티',
    keywords:
      '코딩 공부 어디서 시작, 프로그래밍 언어 추천, 자바스크립트 오류, React 오류 해결, 신입 개발자 취업, 포트폴리오 만들기, ChatGPT 활용법, 코딩 배우기 무료, 개발자 공부 순서, 코딩테스트 준비, 부트캠프 후기, CSS 가운데 정렬',
    openGraph: {
      title: '바이브 코딩 | 개발자 커뮤니티',
      description: '코딩 공부부터 취업까지! React, JS 오류 해결과 실무 팁 공유',
      type: 'website',
      locale: 'ko_KR',
    },
    alternates: {
      canonical: process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr',
    },
  }
}

export default async function Home() {
  const sidebarData = await getSidebarData()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '바이브 코딩 | Dev Community',
    alternateName: [
      '코딩 공부 가이드',
      '프로그래밍 언어 추천 사이트',
      '개발자 커뮤니티',
      '신입 개발자 취업 준비',
    ],
    url: process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr',
    description:
      '코딩 공부 어디서 시작할지 모른다면? 프로그래밍 언어 추천부터 자바스크립트 오류 해결, 신입 개발자 취업까지 도와드립니다!',
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dev Community',
      description: '코딩 공부부터 개발자 취업까지 함께하는 커뮤니티',
    },
    audience: {
      '@type': 'Audience',
      audienceType: [
        '코딩 공부 시작하는 사람',
        '프로그래밍 언어 고민하는 사람',
        '자바스크립트 오류 해결 필요한 사람',
        'React 에러로 고생하는 사람',
        '신입 개발자 취업 준비생',
        '포트폴리오 만들고 싶은 사람',
      ],
    },
    keywords: [
      '코딩 공부 어디서 시작',
      '프로그래밍 언어 추천',
      '자바스크립트 오류',
      'React 오류 해결',
      '신입 개발자 취업',
      '포트폴리오 만들기',
      'ChatGPT 활용법',
      '코딩 배우기 무료',
      '개발자 공부 순서',
      'CSS 가운데 정렬',
      '코딩테스트 준비',
      '부트캠프 후기',
    ],
    about: [
      {
        '@type': 'Thing',
        name: '코딩 공부 시작 방법',
        description:
          '초보자를 위한 코딩 공부 시작 가이드와 프로그래밍 언어 추천',
      },
      {
        '@type': 'Thing',
        name: '프로그래밍 오류 해결',
        description:
          '자바스크립트 오류, React 에러 등 개발 중 발생하는 문제 해결',
      },
      {
        '@type': 'Thing',
        name: '개발자 취업 준비',
        description:
          '신입 개발자 취업을 위한 포트폴리오 제작과 코딩테스트 준비',
      },
      {
        '@type': 'Thing',
        name: 'ChatGPT 코딩 활용',
        description: 'ChatGPT와 AI 도구를 활용한 효율적인 개발 방법',
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <StructuredData type="website" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Content Area */}
          <main className="space-y-8">
            {/* 카테고리 그리드 */}
            <section className="mb-12">
              <h3 className="text-2xl font-bold text-center mb-8">
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
// Supabase migration fixed
