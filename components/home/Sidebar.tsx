'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Hash, Users, Calendar } from 'lucide-react'
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

interface SidebarProps {
  trendingTags?: TrendingTag[]
  activeUsers?: ActiveUser[]
}

export function Sidebar({
  trendingTags = mockTrendingTags,
  activeUsers = mockActiveUsers,
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
              href={`/tags/${tag.name}`}
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
          <StatItem label="전체 회원" value="1,234" />
          <StatItem label="이번 주 게시물" value="89" />
          <StatItem label="이번 주 댓글" value="456" />
          <StatItem label="활성 토론" value="23" />
        </CardContent>
      </Card>

      {/* 이벤트/공지 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center text-base font-medium">
            <Calendar className="mr-2 h-4 w-4" />
            이번 주 이벤트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm">🎉 첫 게시물 작성 이벤트 진행 중!</p>
          <Button className="w-full" size="sm" asChild>
            <Link href="/events">자세히 보기</Link>
          </Button>
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

// 임시 데이터
const mockTrendingTags: TrendingTag[] = [
  { id: '1', name: 'react', count: 156 },
  { id: '2', name: 'nextjs', count: 142 },
  { id: '3', name: 'typescript', count: 98 },
  { id: '4', name: 'tailwindcss', count: 87 },
  { id: '5', name: 'prisma', count: 65 },
]

const mockActiveUsers: ActiveUser[] = [
  { id: '1', name: '김개발', postCount: 12 },
  { id: '2', name: '이코딩', postCount: 9 },
  { id: '3', name: '박프로', postCount: 7 },
  { id: '4', name: '최해커', postCount: 6 },
]
