'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Hash, Users } from 'lucide-react'
import Link from 'next/link'

interface TrendingTag {
  id: string
  name: string
  count: number
}

interface ActiveUser {
  id: string
  name: string
  image?: string
  postCount: number
}

interface SiteStats {
  totalUsers: number
  weeklyPosts: number
  weeklyComments: number
  activeDiscussions: number
}

interface SidebarProps {
  trendingTags?: TrendingTag[]
  activeUsers?: ActiveUser[]
  stats?: SiteStats
}

export function Sidebar({
  trendingTags = [],
  activeUsers = [],
  stats = {
    totalUsers: 0,
    weeklyPosts: 0,
    weeklyComments: 0,
    activeDiscussions: 0,
  },
}: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* 인기 태그 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            <Hash className="mr-2 inline h-4 w-4" />
            인기 태그
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {trendingTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/main/tags/${encodeURIComponent(tag.name)}`}
              className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
            >
              <span className="text-sm font-medium">#{tag.name}</span>
              <Badge variant="secondary">{tag.count}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* 활발한 사용자 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            <Users className="mr-2 inline h-4 w-4" />
            이번 주 활발한 사용자
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.postCount}개의 글 작성
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 커뮤니티 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">커뮤니티 통계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatItem
            label="전체 회원"
            value={stats.totalUsers.toLocaleString()}
          />
          <StatItem
            label="이번 주 게시물"
            value={stats.weeklyPosts.toLocaleString()}
          />
          <StatItem
            label="이번 주 댓글"
            value={stats.weeklyComments.toLocaleString()}
          />
          <StatItem
            label="활성 토론"
            value={stats.activeDiscussions.toLocaleString()}
          />
        </CardContent>
      </Card>
    </aside>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
