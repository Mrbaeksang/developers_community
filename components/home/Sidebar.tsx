'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-black flex items-center">
            <Hash className="mr-2 h-5 w-5" />
            인기 태그
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2">
          {trendingTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/main/tags/${encodeURIComponent(tag.name)}`}
              className="flex items-center justify-between rounded-lg p-3 border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 bg-secondary/50"
            >
              <span className="text-sm font-bold">#{tag.name}</span>
              <Badge className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
                {tag.count}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* 활발한 사용자 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-black flex items-center">
            <Users className="mr-2 h-5 w-5" />
            이번 주 활발한 사용자
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 rounded-lg p-3 bg-secondary/50 border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
            >
              <Avatar className="h-10 w-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AvatarImage src={user.image || ''} alt={user.name} />
                <AvatarFallback className="text-sm font-bold bg-primary/20">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {user.postCount}개의 글 작성
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 커뮤니티 통계 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-black">커뮤니티 통계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  )
}
