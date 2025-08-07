import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { UnifiedPostDetail } from '@/components/posts/UnifiedPostDetail'
import { CommunityCommentSection } from '@/components/communities/CommunityCommentSection'

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
  likeCount: number
  commentCount: number
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
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    const res = await fetch(
      `${process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/api/communities/${communityId}/posts/${postId}`,
      {
        cache: 'no-store',
        headers: {
          Cookie: cookieStore.toString(),
        },
      }
    )

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch post')
    }

    const data = await res.json()
    // API가 중첩된 응답 구조를 반환할 수 있음
    return (data.success && data.data ? data.data : data) as Post
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
      <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
        <UnifiedPostDetail
          post={post}
          postType="community"
          currentUserId={session?.user?.id}
        />

        {/* Comments Section */}
        <CommunityCommentSection
          postId={post.id}
          communityId={post.community.id}
          currentUserId={session?.user?.id}
        />
      </div>
    </div>
  )
}
