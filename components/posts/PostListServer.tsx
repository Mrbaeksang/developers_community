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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: 'PUBLISHED',
    ...(category && { category: { slug: category } }),
  }

  // 게시글 조회 - isPinned 우선 정렬 추가
  const [postsData, categories] = await Promise.all([
    prisma.mainPost.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' as const }, // 고정 게시글 우선
        orderBy,
      ],
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
        posts: {
          where: {
            status: 'PUBLISHED',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    }),
  ])

  // 타입 변환
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedPosts: Post[] = postsData.map((post: any) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt || '',
    type: 'ARTICLE' as const,
    status: post.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.approvedAt?.toISOString() || post.createdAt.toISOString(),
    authorId: post.authorId,
    categoryId: post.categoryId,
    isPinned: post.isPinned,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: post.tags.map((pt: any) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
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
    postCount: cat.posts.length,
  }))

  return (
    <PostList
      initialPosts={formattedPosts}
      categories={formattedCategories}
      isLoading={false}
      currentCategory={category}
    />
  )
}
