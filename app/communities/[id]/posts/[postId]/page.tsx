import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { UnifiedPostDetail } from '@/components/posts/UnifiedPostDetail'
import CommentSection from '@/components/posts/CommentSection'
import { prisma } from '@/lib/core/prisma'
import { incrementViewCount } from '@/lib/core/redis'

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

async function getPost(
  communityId: string,
  postId: string
): Promise<Post | null> {
  try {
    const session = await auth()
    const userId = session?.user?.id

    // 먼저 커뮤니티와 게시글 조회
    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        communityId,
        status: 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        community: {
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
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : undefined,
        bookmarks: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : undefined,
        files: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
          },
        },
      },
    })

    if (!post) {
      return null
    }

    // 비공개 커뮤니티 접근 체크
    const isMember = post.community.members?.[0]?.status === 'ACTIVE'
    const isOwner = userId === post.community.ownerId

    if (post.community.visibility === 'PRIVATE' && !isMember && !isOwner) {
      return null
    }

    // Redis에서 조회수 증가
    const redisViewCount = await incrementViewCount(postId)
    const finalViewCount = redisViewCount || post.viewCount

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      viewCount: finalViewCount,
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      category: post.category,
      community: {
        ...post.community,
        members: post.community.members || [],
      },
      _count: post._count,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isLiked: !!post.likes?.length,
      isBookmarked: !!post.bookmarks?.length,
      files: post.files,
    }
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return null
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

  if (!post) {
    notFound()
  }

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
            href={`/communities/${post.community.id}`}
            className="hover:text-foreground"
          >
            {post.community.name}
          </Link>
          <span>/</span>
          <Link
            href={`/communities/${post.community.id}`}
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
        <CommentSection
          postId={post.id}
          postType="community"
          communityId={post.community.id}
          initialComments={[]}
          isMember={
            post.community.members?.[0]?.status === 'ACTIVE' ||
            session?.user?.id === post.community.ownerId
          }
          communityName={post.community.name}
        />
      </div>
    </div>
  )
}
