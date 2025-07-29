import { HeroSection } from '@/components/home/HeroSection'
import { PostList } from '@/components/home/PostList'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { getApiUrl } from '@/lib/api'

async function getPosts() {
  try {
    const res = await fetch(`${getApiUrl()}/api/main/posts?limit=10`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch posts')
    }

    const data = await res.json()
    return data.posts || []
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error)
    return []
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${getApiUrl()}/api/main/categories`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch categories')
    }

    const data = await res.json()
    return data.categories || []
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return []
  }
}

async function getSidebarData() {
  try {
    const [tagsRes, usersRes, statsRes] = await Promise.all([
      fetch(`${getApiUrl()}/api/main/tags?limit=5`, { cache: 'no-store' }),
      fetch(`${getApiUrl()}/api/main/users/active?limit=5`, { cache: 'no-store' }),
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
  const [posts, categories, sidebarData] = await Promise.all([
    getPosts(), 
    getCategories(),
    getSidebarData()
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Post List */}
          <main>
            <PostList initialPosts={posts} categories={categories} />
          </main>

          {/* Sidebar */}
          <SidebarContainer sidebarData={sidebarData} />
        </div>
      </div>
    </div>
  )
}
// test
