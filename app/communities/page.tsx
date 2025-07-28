import Link from 'next/link'
import { Users, Plus, Lock, Globe, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  avatar: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  postCount: number
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  _count: {
    members: number
    posts: number
  }
}

async function getCommunities(searchParams: {
  page?: string
  search?: string
}) {
  const page = searchParams.page || '1'
  const search = searchParams.search || ''

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities?page=${page}&search=${search}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      throw new Error('Failed to fetch communities')
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error('Failed to fetch communities:', error)
    return {
      communities: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    }
  }
}

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const { communities, pagination } = await getCommunities(resolvedSearchParams)

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">커뮤니티</h1>
          <p className="text-muted-foreground">
            관심사가 비슷한 개발자들과 함께 지식을 공유하세요
          </p>
        </div>
        <Button
          asChild
          className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <Link href="/communities/create">
            <Plus className="h-4 w-4 mr-2" />
            커뮤니티 만들기
          </Link>
        </Button>
      </div>

      {/* Communities Grid */}
      {communities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community: Community) => (
            <Link key={community.id} href={`/communities/${community.slug}`}>
              <Card className="h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <AvatarImage src={community.avatar || undefined} />
                      <AvatarFallback className="text-xl font-bold bg-primary/20">
                        {community.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-lg truncate">
                        {community.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        @{community.slug}
                      </p>
                    </div>
                    <Badge
                      variant={
                        community.visibility === 'PUBLIC'
                          ? 'default'
                          : 'secondary'
                      }
                      className="flex-shrink-0"
                    >
                      {community.visibility === 'PUBLIC' ? (
                        <Globe className="h-3 w-3 mr-1" />
                      ) : (
                        <Lock className="h-3 w-3 mr-1" />
                      )}
                      {community.visibility === 'PUBLIC' ? '공개' : '비공개'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {community.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {community.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">
                        {community._count.members}
                      </span>
                      <span className="text-muted-foreground">멤버</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">
                        {community._count.posts}
                      </span>
                      <span className="text-muted-foreground">게시글</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Avatar className="h-6 w-6 border border-black">
                      <AvatarImage src={community.owner.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {community.owner.name?.[0] ||
                          community.owner.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-bold">
                        {community.owner.name || 'Unknown'}
                      </span>
                      이(가) 운영
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-bold text-lg mb-2">아직 커뮤니티가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              첫 번째 커뮤니티를 만들어보세요!
            </p>
            <Button
              asChild
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              <Link href="/communities/create">
                <Plus className="h-4 w-4 mr-2" />
                커뮤니티 만들기
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/communities?page=${pageNum}`}
                className={`px-4 py-2 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ${
                  pagination.page === pageNum
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white hover:bg-secondary'
                }`}
              >
                {pageNum}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
}
