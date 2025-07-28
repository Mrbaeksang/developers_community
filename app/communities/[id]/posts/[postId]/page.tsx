import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { CommunityPostDetail } from '@/components/communities/CommunityPostDetail'

interface Post {
  id: string
  title: string
  content: string
  viewCount: number
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  category: {
    id: string
    name: string
    color: string | null
  } | null
  community: {
    id: string
    name: string
    slug: string
    visibility: 'PUBLIC' | 'PRIVATE'
    ownerId: string
    members: Array<{
      role: string
      status: string
    }>
  }
  _count: {
    comments: number
    likes: number
  }
  isLiked: boolean
  isBookmarked: boolean
  files: {
    id: string
    filename: string
    size: number
    mimeType: string
    url: string
  }[]
}

async function getPost(communityId: string, postId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities/${communityId}/posts/${postId}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch post')
    }

    const data = await res.json()
    return data as Post
  } catch (error) {
    console.error('Failed to fetch post:', error)
    notFound()
  }
}

export default async function CommunityPostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>
}) {
  const { id, postId } = await params
  const session = await auth()
  const post = await getPost(id, postId)

  // 비공개 커뮤니티 접근 체크는 API에서 처리됨

  return (
    <div className="container max-w-4xl py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/communities" className="hover:text-foreground">
          커뮤니티
        </Link>
        <span>/</span>
        <Link
          href={`/communities/${post.community.slug}`}
          className="hover:text-foreground"
        >
          {post.community.name}
        </Link>
        <span>/</span>
        <Link
          href={`/communities/${post.community.slug}/posts`}
          className="hover:text-foreground"
        >
          게시글
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">
          {post.title}
        </span>
      </nav>

      {/* Post Detail */}
      <CommunityPostDetail post={post} currentUserId={session?.user?.id} />
    </div>
  )
}
