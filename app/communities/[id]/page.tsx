import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, Lock, Users, MessageSquare, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth } from '@/auth'
import { CommunityActions } from '@/components/communities/CommunityActions'
import { CommunityPostList } from '@/components/communities/CommunityPostList'
import CommunityMemberList from '@/components/communities/CommunityMemberList'
import CommunityAnnouncements from '@/components/communities/CommunityAnnouncements'
import CommunityChatSection from '@/components/communities/CommunityChatSection'
import {
  getBannerUrl,
  getBannerType,
  getDefaultBannerById,
} from '@/lib/banner-utils'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
}

interface Announcement {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

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
  categories: Category[]
  announcements: Announcement[]
}

async function getCommunity(idOrSlug: string) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities/${idOrSlug}`,
      {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          Cookie: cookieStore.toString(),
        },
      }
    )

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch community')
    }

    const data = await res.json()
    // API가 중첩된 응답 구조를 반환할 수 있음
    return (data.success && data.data ? data.data : data) as Community
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

  if (!community) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            커뮤니티를 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-gray-600">
            요청하신 커뮤니티가 존재하지 않거나 삭제되었습니다.
          </p>
        </div>
      </div>
    )
  }

  const isOwner = session?.user?.id === community.owner.id
  const isMember = community.currentMembership?.status === 'ACTIVE'
  const isPending = community.currentMembership?.status === 'PENDING'
  const canJoin =
    (!community.currentMembership ||
      community.currentMembership?.status === 'LEFT') &&
    !!session?.user?.id

  return (
    <div className="container max-w-7xl py-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
        {(() => {
          const bannerType = getBannerType(community.banner || '')

          // 배너가 없는 경우 랜덤 기본 배너 적용
          if (bannerType === 'none') {
            const randomBanner = getBannerUrl('')
            return (
              <Image
                src={randomBanner}
                alt={`${community.name} banner`}
                fill
                className="object-cover"
              />
            )
          }

          // 기본 배너인 경우 그라데이션 또는 단색 배경 적용
          if (bannerType === 'default') {
            const bannerId = community.banner?.replace('default:', '')
            const defaultBanner = getDefaultBannerById(bannerId || '')

            if (defaultBanner) {
              return (
                <div className={`absolute inset-0 ${defaultBanner.gradient}`} />
              )
            }
          }

          // 업로드된 이미지인 경우
          if (bannerType === 'upload' && community.banner) {
            return (
              <Image
                src={community.banner}
                alt={`${community.name} banner`}
                fill
                className="object-cover"
              />
            )
          }

          // 기본 그라데이션 (fallback)
          return (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
          )
        })()}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -mt-16 md:-mt-20 bg-white">
          <AvatarImage
            src={
              community.avatar?.startsWith('default:')
                ? undefined
                : community.avatar || undefined
            }
          />
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
        <TabsList
          className={`grid w-full ${community.announcements.length > 0 ? 'grid-cols-4' : 'grid-cols-3'} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
        >
          <TabsTrigger value="posts" className="font-bold">
            게시글
          </TabsTrigger>
          <TabsTrigger value="members" className="font-bold">
            멤버
          </TabsTrigger>
          {community.announcements.length > 0 && (
            <TabsTrigger value="announcements" className="font-bold">
              공지사항
            </TabsTrigger>
          )}
          <TabsTrigger value="rules" className="font-bold">
            규칙
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {community.categories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  style={{
                    backgroundColor: category.color || undefined,
                    color: category.color ? 'white' : undefined,
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            {isMember && (
              <Button
                asChild
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href={`/communities/${community.slug}/write`}>
                  게시글 작성
                </Link>
              </Button>
            )}
          </div>
          <CommunityPostList
            communityId={community.id}
            communitySlug={community.slug}
            page={1}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <CommunityMemberList communityId={community.id} />
        </TabsContent>

        {community.announcements.length > 0 && (
          <TabsContent value="announcements" className="space-y-4">
            <CommunityAnnouncements announcements={community.announcements} />
          </TabsContent>
        )}

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

      {/* Floating Chat Button - 멤버이고 채팅이 활성화된 경우에만 표시 */}
      <CommunityChatSection
        communityId={community.id}
        isMember={isMember}
        allowChat={community.allowChat}
      />
    </div>
  )
}
