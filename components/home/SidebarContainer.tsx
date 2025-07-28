import { Sidebar } from './Sidebar'
import { getApiUrl } from '@/lib/api'

async function getSidebarData() {
  try {
    const baseUrl = getApiUrl()

    // 병렬로 모든 데이터 조회
    const [tagsRes, usersRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/main/tags?limit=5`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/main/users/active?limit=5`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/main/stats`, { cache: 'no-store' }),
    ])

    const [tagsData, usersData, statsData] = await Promise.all([
      tagsRes.json(),
      usersRes.json(),
      statsRes.json(),
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

export async function SidebarContainer() {
  const data = await getSidebarData()

  return <Sidebar {...data} />
}
