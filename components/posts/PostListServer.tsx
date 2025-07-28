import { PostList } from '@/components/home/PostList'
import { prisma } from '@/lib/prisma'
import type { Post } from '@/lib/types'

interface PostListServerProps {
  category?: string
  sort?: string
  page?: string
}

export async function PostListServer({
  category,
  sort = 'latest',
  page = '1',
}: PostListServerProps) {
  // 정렬 옵션에 따른 orderBy 설정
  const orderBy =
    sort === 'popular'
      ? { viewCount: 'desc' as const }
      : sort === 'views'
        ? { viewCount: 'desc' as const }
        : { createdAt: 'desc' as const }

  // 페이지네이션 설정
  const pageNumber = parseInt(page)
  const pageSize = 10
  const skip = (pageNumber - 1) * pageSize

  // 카테고리 필터 설정
  const where = {
    status: 'PUBLISHED' as const,
    ...(category && { category: { slug: category } }),
  }

  // 게시글 조회
  const [posts, categories] = await Promise.all([
    prisma.mainPost.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.mainCategory.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
    }),
  ])

  // 타입 변환
  const formattedPosts: Post[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug, // MainPost 모델에 slug 필드가 있음
    content: post.content,
    excerpt: post.excerpt || '',
    type: 'ARTICLE' as const, // MainPost 모델에 type 필드가 없으므로 기본값 설정
    status: post.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED', // 타입 캐스팅
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.approvedAt?.toISOString() || post.createdAt.toISOString(), // approvedAt을 publishedAt으로 매핑
    authorId: post.authorId,
    categoryId: post.categoryId,
    author: {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email,
      image: post.author.image,
    },
    category: post.category
      ? {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
        }
      : undefined,
    tags: post.tags.map((pt) => ({
      id: pt.tag.id,
      tag: {
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      },
    })),
    _count: {
      likes: post._count.likes,
      comments: post._count.comments,
    },
  }))

  const formattedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    postCount: cat._count.posts,
  }))

  return (
    <PostList
      initialPosts={formattedPosts}
      categories={formattedCategories}
      isLoading={false}
    />
  )
}
