import { notFound } from 'next/navigation'
import { prisma } from '@/lib/core/prisma'
import { PostList } from '@/components/home/PostList'
import { Badge } from '@/components/ui/badge'
import { Hash, FileText } from 'lucide-react'
import type { MainPostFormatted } from '@/lib/post/types'
import { formatMainPostForResponse } from '@/lib/post/display'
import { EmptyState } from '@/components/shared/EmptyState'

interface TagPageProps {
  params: Promise<{
    name: string
  }>
}

async function getTagWithPosts(tagName: string) {
  try {
    const decodedTagName = decodeURIComponent(tagName)

    const tag = await prisma.mainTag.findFirst({
      where: {
        name: decodedTagName,
      },
      include: {
        posts: {
          where: {
            post: {
              status: 'PUBLISHED',
            },
          },
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                content: true,
                excerpt: true,
                status: true,
                viewCount: true,
                authorId: true,
                categoryId: true,
                createdAt: true,
                updatedAt: true,
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
                    comments: true,
                    likes: true,
                  },
                },
              },
            },
          },
          orderBy: {
            post: {
              createdAt: 'desc',
            },
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!tag) {
      return null
    }

    // 게시글 데이터 변환 (MainPostFormatted 타입에 맞게)
    const posts: MainPostFormatted[] = tag.posts
      .filter((p) => p.post) // null 체크
      .map(({ post }) =>
        formatMainPostForResponse({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          createdAt: post.createdAt,
          isPinned: false,
          status: post.status,
          viewCount: post.viewCount,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          bookmarkCount: 0,
          author: post.author,
          category: post.category,
          tags: post.tags,
          _count: {
            likes: post._count.likes,
            comments: post._count.comments,
            bookmarks: 0,
          },
        })
      ) as MainPostFormatted[]

    return {
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: tag._count.posts,
      },
      posts,
    }
  } catch (error) {
    console.error('태그별 게시글 조회 실패:', error)
    return null
  }
}

export async function generateMetadata({ params }: TagPageProps) {
  const { name } = await params
  const data = await getTagWithPosts(name)

  if (!data) {
    return {
      title: '태그를 찾을 수 없습니다',
    }
  }

  return {
    title: `#${data.tag.name} 태그 게시글`,
    description: `${data.tag.name} 태그가 달린 ${data.posts.length}개의 게시글을 확인하세요.`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { name } = await params
  const data = await getTagWithPosts(name)

  if (!data) {
    notFound()
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      {/* 태그 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Hash className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">#{data.tag.name}</h1>
          <Badge variant="secondary" className="text-sm">
            {data.tag.postCount}개 게시글
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {data.tag.name} 태그가 달린 게시글을 모아보세요.
        </p>
      </div>

      {/* 게시글 목록 */}
      {data.posts.length > 0 ? (
        <PostList initialPosts={data.posts} />
      ) : (
        <EmptyState
          icon={FileText}
          title="해당 태그의 게시글이 없습니다"
          description={`#${data.tag.name} 태그가 달린 게시글이 아직 없습니다.`}
          size="lg"
        />
      )}
    </div>
  )
}
