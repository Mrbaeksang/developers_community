'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, FileText, TrendingUp } from 'lucide-react'
import Image from 'next/image'

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

export function ActiveCommunities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveCommunities()
  }, [])

  const fetchActiveCommunities = async () => {
    try {
      const response = await fetch('/api/communities/active?limit=5')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      // successResponse 형식으로 오는 경우 data 필드에서 실제 데이터 추출
      setCommunities(result.data?.communities || [])
    } catch (error) {
      console.error('Failed to fetch active communities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
                  {community.logo ? (
                    <Image
                      src={community.logo}
                      alt={community.name}
                      width={40}
                      height={40}
                      className="rounded-lg border-2 border-black"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-black">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
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
