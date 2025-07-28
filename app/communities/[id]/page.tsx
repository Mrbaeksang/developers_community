import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  Lock,
  Users,
  MessageSquare,
  Calendar,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth } from '@/auth'
import { CommunityActions } from '@/components/communities/CommunityActions'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  rules: string | null
  avatar: string | null
  banner: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  postCount: number
  allowFileUpload: boolean
  allowChat: boolean
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
  currentMembership: {
    role: 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER'
    status: 'PENDING' | 'ACTIVE' | 'BANNED' | 'LEFT'
  } | null
}

async function getCommunity(idOrSlug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities/${idOrSlug}`,
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

// 클라이언트 컴포넌트로 분리

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const community = await getCommunity(id)

  const isOwner = session?.user?.id === community.owner.id
  const isMember = community.currentMembership?.status === 'ACTIVE'
  const isPending = community.currentMembership?.status === 'PENDING'
  const canJoin = !community.currentMembership && !!session?.user?.id

  return (
    <div className="container max-w-7xl py-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        {community.banner && (
          <img
            src={community.banner}
            alt={`${community.name} banner`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -mt-16 md:-mt-20 bg-white">
          <AvatarImage src={community.avatar || undefined} />
          <AvatarFallback className="text-2xl md:text-3xl font-black bg-primary/20">
            {community.name[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2">{community.name}</h1>
              <p className="text-muted-foreground mb-4">@{community.slug}</p>
              <div className="flex items-center gap-4 text-sm">
                <Badge
                  variant={
                    community.visibility === 'PUBLIC' ? 'default' : 'secondary'
                  }
                  className="gap-1"
                >
                  {community.visibility === 'PUBLIC' ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {community.visibility === 'PUBLIC' ? '공개' : '비공개'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold">{community._count.members}</span>
                  <span className="text-muted-foreground">멤버</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold">{community._count.posts}</span>
                  <span className="text-muted-foreground">게시글</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {new Date(community.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <CommunityActions
              community={community}
              isOwner={isOwner}
              isMember={isMember}
              isPending={isPending}
              canJoin={canJoin}
              isAuthenticated={!!session?.user?.id}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {community.description && (
        <Card className="mb-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap">{community.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger value="posts" className="font-bold">
            게시글
          </TabsTrigger>
          <TabsTrigger value="members" className="font-bold">
            멤버
          </TabsTrigger>
          <TabsTrigger value="rules" className="font-bold">
            규칙
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-bold text-lg mb-2">아직 게시글이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 게시글을 작성해보세요!
              </p>
              {isMember && (
                <Button
                  asChild
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                >
                  <Link href={`/communities/${community.slug}/write`}>
                    게시글 작성
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <h3 className="font-bold text-lg">운영진</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <AvatarImage src={community.owner.image || undefined} />
                  <AvatarFallback className="font-bold">
                    {community.owner.name?.[0] ||
                      community.owner.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">
                    {community.owner.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">소유자</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <h3 className="font-bold text-lg">커뮤니티 규칙</h3>
            </CardHeader>
            <CardContent>
              {community.rules ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{community.rules}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  아직 규칙이 설정되지 않았습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
