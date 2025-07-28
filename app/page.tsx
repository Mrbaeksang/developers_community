import { MainLayout } from '@/components/layouts/MainLayout'
import { HeroSection } from '@/components/home/HeroSection'
import { PostList } from '@/components/home/PostList'
import { Sidebar } from '@/components/home/Sidebar'

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
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/main/posts?limit=10`,
      {
        cache: 'no-store',
      }
    )

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

export default async function Home() {
  const posts = await getPosts()

  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Post List */}
          <main>
            <PostList initialPosts={posts} />
          </main>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </MainLayout>
  )
}
// test
