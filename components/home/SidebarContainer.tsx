import { Sidebar } from './Sidebar'

interface SidebarContainerProps {
  sidebarData: {
    trendingTags: Array<{
      id: string
      name: string
      count: number
    }>
    activeUsers: Array<{
      id: string
      name: string
      image: string | undefined
      postCount: number
    }>
    stats: {
      totalUsers: number
      weeklyPosts: number
      weeklyComments: number
      activeDiscussions: number
    }
  }
}

export async function SidebarContainer({ sidebarData }: SidebarContainerProps) {
  return <Sidebar {...sidebarData} />
}
