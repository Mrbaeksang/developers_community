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
    trendingPosts: Array<{
      id: string
      title: string
      viewCount: number
      weeklyViews: number
      author: {
        name: string
      }
    }>
  }
}

export async function SidebarContainer({ sidebarData }: SidebarContainerProps) {
  return <Sidebar {...sidebarData} />
}
