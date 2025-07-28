import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PostDetail from '@/components/posts/PostDetail'
import CommentSection from '@/components/posts/CommentSection'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function getPost(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/main/posts/${id}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 404) {
        return null
      }
      throw new Error('Failed to fetch post')
    }

    return res.json()
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
      authors: [post.author.name || post.author.username],
      tags:
        post.tags?.map((tag: { tag: { name: string } }) => tag.tag.name) || [],
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
      <div className="max-w-4xl mx-auto">
        <PostDetail post={post} />
        <CommentSection postId={post.id} initialComments={[]} />
      </div>
    </div>
  )
}
