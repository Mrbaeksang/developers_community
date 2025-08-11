import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lazy, Suspense } from 'react'
import { UnifiedPostDetail } from '@/components/posts/UnifiedPostDetail'
import CommentSection from '@/components/posts/CommentSection'
import { markdownToHtml } from '@/lib/ui/markdown'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'

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

async function getPost(id: string) {
  try {
    // Vercel 배포 환경에서는 자동으로 URL 감지
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
    const res = await fetch(`${baseUrl}/api/main/posts/${id}`, {
      next: { revalidate: 60 }, // 60초 캐시
    })

    if (!res.ok) {
      if (res.status === 404) {
        return null
      }
      throw new Error('Failed to fetch post')
    }

    const response = await res.json()

    // API 응답이 wrapped 형태인지 확인
    const data = response.data || response

    // 마크다운이 아직 변환되지 않았다면 변환
    if (data && data.content && !data.content.includes('<')) {
      data.content = markdownToHtml(data.content)
    }

    // 댓글도 함께 조회
    try {
      const commentsRes = await fetch(
        `${baseUrl}/api/main/posts/${id}/comments`,
        {
          next: { revalidate: 30 }, // 30초 캐시
        }
      )
      if (commentsRes.ok) {
        const commentsResponse = await commentsRes.json()
        // 댓글도 wrapped response 처리
        const commentsData = commentsResponse.data || commentsResponse
        data.comments = commentsData.comments || commentsData || []
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      data.comments = []
    }

    // Q&A 카테고리 확인
    if (data.category) {
      const qaCategories = ['qa', 'qna', 'question', 'help', '질문', '문의']
      data.isQACategory = qaCategories.some(
        (qa) =>
          data.category.slug.toLowerCase().includes(qa) ||
          data.category.name.toLowerCase().includes(qa)
      )
    }

    return data
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
    description: post.excerpt || post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.metaDescription,
      type: 'article',
      publishedTime: post.createdAt,
      authors: [post.author?.name || 'Unknown'],
      tags: post.tags?.map((tag: { name: string }) => tag.name) || [],
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <UnifiedPostDetail post={post} postType="main" />
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
