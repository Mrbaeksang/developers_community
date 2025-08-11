import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommunityPostList } from '@/components/communities/CommunityPostList'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'

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

async function getCommunity(idOrSlug: string): Promise<Community | null> {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        visibility: true,
        ownerId: true,
        members: userId
          ? {
              where: { userId },
              select: {
                role: true,
                status: true,
              },
            }
          : undefined,
      },
    })

    if (!community) {
      return null
    }

    // currentMembership 형식으로 변환
    const currentMembership = community.members?.[0] || null

    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      visibility: community.visibility,
      ownerId: community.ownerId,
      currentMembership: currentMembership
        ? {
            role: currentMembership.role,
            status: currentMembership.status,
          }
        : null,
    }
  } catch (error) {
    console.error('Failed to fetch community:', error)
    return null
  }
}

export default async function CommunityPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    category?: string
  }>
}) {
  const { id } = await params
  const { category } = await searchParams
  const session = await auth()
  const community = await getCommunity(id)

  if (!community) {
    notFound()
  }

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

      {/* Post List with integrated filters */}
      <CommunityPostList
        communityId={community.id}
        communitySlug={community.slug}
        currentCategory={category}
        isLoading={false}
      />
    </div>
  )
}
