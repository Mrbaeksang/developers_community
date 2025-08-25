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

// 게시글 내용에서 첫 번째 이미지 URL 추출
function extractFirstImage(content: string): string | null {
  // 마크다운 이미지 패턴: ![alt](url)
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/
  const markdownMatch = content.match(markdownImageRegex)
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1]
  }

  // HTML img 태그 패턴: <img src="url">
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/i
  const htmlMatch = content.match(htmlImageRegex)
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1]
  }

  return null
}

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

    // 댓글 조회 - 계층 구조로 가져오기 (parentId가 null인 최상위 댓글만)
    const comments = await prisma.mainComment.findMany({
      where: {
        postId: id,
        parentId: null, // 최상위 댓글만 조회
      },
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
        // 답글들도 함께 가져오기
        replies: {
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
          },
          orderBy: { createdAt: 'asc' }, // 답글은 오래된 것부터
        },
      },
    })

    // Q&A 카테고리 확인 (AI 봇과 동일한 로직)
    let isQACategory = false
    if (post.category) {
      // Q&A 카테고리 ID로 직접 확인 (가장 정확)
      const QA_CATEGORY_ID = 'cmdrfyblq0003u8fsdxrl27g9'
      isQACategory = post.category.id === QA_CATEGORY_ID

      // 백업: 기존 슬러그/이름 기반 확인
      if (!isQACategory) {
        const qaCategories = ['qa', 'qna', 'question', 'help', '질문', '문의']
        isQACategory = qaCategories.some(
          (qa) =>
            post.category.slug.toLowerCase().includes(qa) ||
            post.category.name.toLowerCase().includes(qa)
        )
      }
    }

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
        // replies 배열 추가 - 계층 구조 유지
        replies:
          comment.replies?.map((reply) => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            userId: reply.authorId,
            author: reply.author,
            isEdited: reply.isEdited,
            parentId: reply.parentId,
          })) || [],
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

  // 게시글 내용에서 첫 번째 이미지 추출
  const firstImage = extractFirstImage(post.content)
  const ogImage = firstImage || 'https://devcom.kr/og-image.png'

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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.metaDescription || undefined,
      images: [ogImage],
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const [post, session] = await Promise.all([getPost(id), auth()])

  if (!post) {
    notFound()
  }

  // 게시글의 첫 번째 이미지 추출 (StructuredData용)
  const firstImage = extractFirstImage(post.content)
  const ogImage = firstImage || 'https://devcom.kr/og-image.png'

  return (
    <div className="overflow-x-hidden">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
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
            image: ogImage,
            url: `https://devcom.kr/main/posts/${post.id}`,
          }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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
          <aside className="hidden lg:block space-y-6">
            <Suspense fallback={<RelatedPostsSkeleton />}>
              <RelatedPosts postId={post.id} />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
  )
}
