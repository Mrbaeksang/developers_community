import { MainLayout } from '@/components/layouts/MainLayout'
import { HeroSection } from '@/components/home/HeroSection'
import { PostList } from '@/components/home/PostList'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { getApiUrl } from '@/lib/api'

async function getPosts() {
  try {
    // 개발 환경에서는 직접 prisma 사용
    if (process.env.NODE_ENV === 'development') {
      const { prisma } = await import('@/lib/prisma')

      const posts = await prisma.mainPost.findMany({
        where: {
          status: 'PUBLISHED',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        include: {
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
      })

      return posts
    }

    // 프로덕션에서는 API 호출
    const res = await fetch(`${getApiUrl()}/api/main/posts?limit=10`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch posts')
    }

    const data = await res.json()
    return data.posts || []
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error)
    return []
  }
}

async function getCategories() {
  try {
    // 개발 환경에서는 직접 prisma 사용
    if (process.env.NODE_ENV === 'development') {
      const { prisma } = await import('@/lib/prisma')

      const categories = await prisma.mainCategory.findMany({
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      })

      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        postCount: category._count.posts,
      }))
    }

    // 프로덕션에서는 API 호출
    const res = await fetch(`${getApiUrl()}/api/main/categories`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch categories')
    }

    const data = await res.json()
    return data.categories || []
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return []
  }
}

export default async function Home() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()])

  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Post List */}
          <main>
            <PostList initialPosts={posts} categories={categories} />
          </main>

          {/* Sidebar */}
          <SidebarContainer />
        </div>
      </div>
    </MainLayout>
  )
}
// test
