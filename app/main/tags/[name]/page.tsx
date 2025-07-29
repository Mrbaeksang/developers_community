import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PostList } from '@/components/home/PostList'
import { Badge } from '@/components/ui/badge'
import { Hash, FileText } from 'lucide-react'
import type { Post } from '@/lib/types'

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
                  },
                },
                tags: {
                  include: {
                    tag: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
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

    // 게시글 데이터 변환 (Post 타입에 맞게)
    const posts: Post[] = tag.posts
      .filter((p) => p.post) // null 체크
      .map(({ post }) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || undefined,
        authorId: post.authorId,
        author: {
          id: post.author.id,
          name: post.author.name,
          email: post.author.email,
          image: post.author.image,
        },
        categoryId: post.categoryId,
        category: post.category,
        status: post.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        viewCount: post.viewCount,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        tags: post.tags.map((t) => ({
          id: t.tag.id,
          name: t.tag.name,
          slug: t.tag.slug,
          color: '#64748b', // 기본 색상
          postCount: 0,
        })),
        _count: {
          comments: post._count.comments,
          likes: post._count.likes,
        },
      }))

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
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            해당 태그의 게시글이 없습니다
          </h2>
          <p className="text-muted-foreground">
            #{data.tag.name} 태그가 달린 게시글이 아직 없습니다.
          </p>
        </div>
      )}
    </div>
  )
}
