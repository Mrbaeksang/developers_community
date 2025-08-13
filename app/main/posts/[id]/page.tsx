import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lazy, Suspense } from 'react'
import { UnifiedPostDetail } from '@/components/posts/UnifiedPostDetail'
import CommentSection from '@/components/posts/CommentSection'
import { markdownToHtml } from '@/lib/ui/markdown'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { StructuredData } from '@/components/seo/StructuredData'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'

// 레이지 로딩으로 RelatedPosts 최적화
const RelatedPosts = lazy(() => import('@/components/posts/RelatedPosts'))

// 관련 게시물 스켈레톤 컴포넌트
function RelatedPostsSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonLoader lines={5} />
    </div>
  )
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// ✅ Prisma 직접 사용 - API 호출 제거
async function getPost(id: string) {
  try {
    const post = await prisma.mainPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            globalRole: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
            comments: true,
          },
        },
      },
    })

    if (!post || post.status !== 'PUBLISHED') {
      return null
    }

    // 조회수 증가 (비동기로 처리)
    prisma.mainPost
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(console.error) // 에러 무시 (조회수는 중요하지 않음)

    // 댓글 조회
    const comments = await prisma.mainComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            globalRole: true,
          },
        },
        // MainComment에는 likes 관계가 없음
      },
    })

    // Q&A 카테고리 확인
    const qaCategories = ['qa', 'qna', 'question', 'help', '질문', '문의']
    const isQACategory = qaCategories.some(
      (qa) =>
        post.category.slug.toLowerCase().includes(qa) ||
        post.category.name.toLowerCase().includes(qa)
    )

    // 날짜를 string으로 변환하고 마크다운 변환
    const htmlContent = await markdownToHtml(post.content)

    return {
      ...post,
      content: htmlContent,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      approvedAt: post.approvedAt?.toISOString() || null,
      tags: post.tags.map((t) => ({
        ...t.tag,
        name: t.tag.name,
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        userId: comment.authorId,
        author: comment.author,
        isEdited: comment.isEdited,
        parentId: comment.parentId,
      })),
      isQACategory,
    }
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
    }
  }

  return {
    title: post.title,
    description: post.excerpt || post.metaDescription || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.metaDescription || undefined,
      type: 'article',
      publishedTime: post.createdAt,
      authors: [post.author?.name || 'Unknown'],
      tags: post.tags?.map((tag: { name: string }) => tag.name) || [],
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const [post, session] = await Promise.all([getPost(id), auth()])

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <StructuredData
        type="article"
        data={{
          title: post.title,
          description: post.excerpt || post.metaDescription || post.title,
          author: {
            name: post.author?.name || 'Unknown',
            url: `https://devcom.kr/profile/${post.author?.id}`,
          },
          publishedAt: post.createdAt,
          updatedAt: post.updatedAt,
          image: 'https://devcom.kr/og-image.png',
          url: `https://devcom.kr/main/posts/${post.id}`,
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <UnifiedPostDetail
            post={post}
            postType="main"
            currentUserId={session?.user?.id}
          />
          <CommentSection
            postId={post.id}
            postType="main"
            initialComments={post.comments || []}
            isQAPost={post.isQACategory || false}
          />
        </div>
        <aside className="space-y-6">
          <Suspense fallback={<RelatedPostsSkeleton />}>
            <RelatedPosts postId={post.id} />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}
