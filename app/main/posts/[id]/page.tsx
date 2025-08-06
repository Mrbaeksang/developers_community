import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lazy, Suspense } from 'react'
import ClientPostDetail from '@/components/posts/ClientPostDetail'
import { markdownToHtml } from '@/lib/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'

// 레이지 로딩으로 RelatedPosts 최적화
const RelatedPosts = lazy(() => import('@/components/posts/RelatedPosts'))

// 관련 게시물 스켈레톤 컴포넌트
function RelatedPostsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
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
    const baseUrl =
      process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'
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
        <ClientPostDetail post={post} />
        <aside className="space-y-6">
          <Suspense fallback={<RelatedPostsSkeleton />}>
            <RelatedPosts postId={post.id} />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}
