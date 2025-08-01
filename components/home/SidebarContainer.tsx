'use client'

import { Sidebar } from './Sidebar'

interface SidebarContainerProps {
  sidebarData: {
    trendingTags: Array<{
      id: string
      name: string
      count: number
      color: string
    }>
    activeUsers: Array<{
      id: string
      name: string
      image?: string
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

export function SidebarContainer({ sidebarData }: SidebarContainerProps) {
  return <Sidebar {...sidebarData} />
}
