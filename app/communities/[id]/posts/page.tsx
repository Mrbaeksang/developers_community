import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommunityPostList } from '@/components/communities/CommunityPostList'
import { auth } from '@/auth'

interface Community {
  id: string
  name: string
  slug: string
  visibility: 'PUBLIC' | 'PRIVATE'
  ownerId: string
  currentMembership: {
    role: 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER'
    status: 'PENDING' | 'ACTIVE' | 'BANNED' | 'LEFT'
  } | null
}

async function getCommunity(idOrSlug: string) {
  try {
    const res = await fetch(
      `${process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/api/communities/${idOrSlug}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch community')
    }

    const data = await res.json()
    return data as Community
  } catch (error) {
    console.error('Failed to fetch community:', error)
    notFound()
  }
}

export default async function CommunityPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    page?: string
    category?: string
    search?: string
    sort?: string
  }>
}) {
  const { id } = await params
  const { page = '1', category, search, sort = 'latest' } = await searchParams
  const session = await auth()
  const community = await getCommunity(id)

  const isMember = community.currentMembership?.status === 'ACTIVE'
  const canWrite = isMember && community.currentMembership?.status !== 'BANNED'

  // 비공개 커뮤니티 접근 제한
  if (
    community.visibility === 'PRIVATE' &&
    !isMember &&
    session?.user?.id !== community.ownerId
  ) {
    notFound()
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/communities" className="hover:text-foreground">
              커뮤니티
            </Link>
            <span>/</span>
            <Link
              href={`/communities/${community.slug}`}
              className="hover:text-foreground"
            >
              {community.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">게시글</span>
          </nav>
          <h1 className="text-3xl font-black">{community.name} 게시글</h1>
        </div>

        {canWrite && (
          <Button
            asChild
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            <Link href={`/communities/${community.slug}/write`}>
              <Plus className="h-4 w-4 mr-2" />
              게시글 작성
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="게시글 검색..."
              className="pl-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              defaultValue={search}
            />
          </div>
        </div>

        <Select defaultValue={sort}>
          <SelectTrigger className="w-[180px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
            <SelectItem value="commented">댓글순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Post List */}
      <CommunityPostList
        communityId={community.id}
        communitySlug={community.slug}
        page={parseInt(page)}
        category={category}
        search={search}
        sort={sort}
      />
    </div>
  )
}
