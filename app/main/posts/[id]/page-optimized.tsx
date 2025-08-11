import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lazy, Suspense } from 'react'
import { UnifiedPostDetail } from '@/components/posts/UnifiedPostDetail'
import CommentSection from '@/components/posts/CommentSection'
import { markdownToHtml } from '@/lib/ui/markdown'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { prisma } from '@/lib/core/prisma'

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

    // 날짜를 string으로 변환
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      approvedAt: post.approvedAt?.toISOString() || null,
      tags: post.tags.map((t) => t.tag),
    }
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return null
  }
}

// 관련 게시글 가져오기 (Prisma 직접 사용)
async function getRelatedPosts(postId: string, categoryId: string) {
  try {
    const posts = await prisma.mainPost.findMany({
      where: {
        id: { not: postId },
        categoryId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
    })

    return posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error('Failed to fetch related posts:', error)
    return []
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
    title: post.metaTitle || post.title,
    description:
      post.metaDescription || post.excerpt || '개발자 커뮤니티 게시글',
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      type: 'article',
      authors: [post.author.name || 'Unknown'],
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  // 마크다운을 HTML로 변환
  const htmlContent = await markdownToHtml(post.content)

  // 관련 게시물 가져오기
  const relatedPosts = await getRelatedPosts(post.id, post.category.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 게시글 상세 */}
        <UnifiedPostDetail
          post={{
            ...post,
            content: htmlContent,
            _count: post._count,
            likeCount: post._count.likes,
            bookmarkCount: post._count.bookmarks,
            commentCount: post._count.comments,
          }}
          type="main"
        />

        {/* 댓글 섹션 */}
        <Suspense fallback={<SkeletonLoader lines={10} />}>
          <CommentSection
            postId={post.id}
            postType="main"
            postTitle={post.title}
            categorySlug={post.category.slug}
          />
        </Suspense>

        {/* 관련 게시물 */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">관련 게시글</h2>
            <Suspense fallback={<RelatedPostsSkeleton />}>
              <RelatedPosts posts={relatedPosts} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}
