'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, FileText, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { getAvatarUrl } from '@/lib/community-utils'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  memberCount: number
  totalPosts: number
  weeklyPosts: number
}

// 활발한 커뮤니티 가져오기 함수
const fetchActiveCommunities = async (): Promise<Community[]> => {
  const response = await fetch('/api/communities/active?limit=5')
  if (!response.ok) throw new Error('Failed to fetch active communities')
  const result = await response.json()
  return result.data?.communities || []
}

export function ActiveCommunities() {
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['activeCommunities'],
    queryFn: fetchActiveCommunities,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  })

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-purple-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-bold">활발한 커뮤니티</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (communities.length === 0) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-purple-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-bold">활발한 커뮤니티</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          아직 활발한 커뮤니티가 없습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-2 border-black bg-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-bold">활발한 커뮤니티</h3>
          </div>
          <Link
            href="/communities"
            className="text-xs font-bold hover:underline"
          >
            전체보기 →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.slug}`}
              className="block group"
            >
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0">
                  {(() => {
                    const avatarUrl = community.logo
                      ? getAvatarUrl(community.logo)
                      : ''
                    if (avatarUrl) {
                      return (
                        <Image
                          src={avatarUrl}
                          alt={community.name}
                          width={40}
                          height={40}
                          className="rounded-lg border-2 border-black"
                        />
                      )
                    }
                    return (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-black">
                        <Users className="h-5 w-5" />
                      </div>
                    )
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {community.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {community.memberCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {community.weeklyPosts} 주간
                    </span>
                  </div>
                </div>
                {community.weeklyPosts > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    HOT
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
