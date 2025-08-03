import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PostDetail from '@/components/posts/PostDetail'
import CommentSection from '@/components/posts/CommentSection'
import RelatedPosts from '@/components/posts/RelatedPosts'
import { markdownToHtml } from '@/lib/markdown'

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
      cache: 'no-store',
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
          cache: 'no-store',
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
        <div className="space-y-8">
          <PostDetail post={post} />
          <CommentSection
            postId={post.id}
            initialComments={post.comments || []}
          />
        </div>
        <aside className="space-y-6">
          <RelatedPosts postId={post.id} />
        </aside>
      </div>
    </div>
  )
}
