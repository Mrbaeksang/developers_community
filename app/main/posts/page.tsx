import { Suspense } from 'react'
import { PostListServer } from '@/components/posts/PostListServer'
import { SidebarContainer } from '@/components/home/SidebarContainer'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { prisma } from '@/lib/core/prisma'

export const metadata = {
  title: '게시글 목록 | Dev Community',
  description: '개발자들의 지식 공유 게시글',
}

// 카테고리 필터를 위한 타입
interface PostsPageProps {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>
}

async function getSidebarData() {
  try {
    // 트렌딩 태그 조회 (Prisma 직접 사용)
    const trendingTags = await prisma.mainTag.findMany({
      orderBy: { postCount: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        postCount: true,
      },
    })

    // 주간 활성 사용자 조회
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeUsers = await prisma.user.findMany({
      where: {
        mainPosts: {
          some: {
            createdAt: { gte: weekAgo },
            status: 'PUBLISHED',
          },
        },
      },
      orderBy: {
        mainPosts: {
          _count: 'desc',
        },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        _count: {
          select: {
            mainPosts: true,
          },
        },
      },
    })

    // 주간 트렌딩 게시글 조회
    const trendingPosts = await prisma.mainPost.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: weekAgo },
      },
      orderBy: { viewCount: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        viewCount: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    })

    // 형식 맞추기
    const mappedTags = trendingTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.postCount,
      color: tag.color || '#3B82F6',
    }))

    const mappedUsers = activeUsers.map((user) => ({
      id: user.id,
      name: user.name || user.username || 'Unknown',
      image: user.image || undefined,
      postCount: user._count.mainPosts,
    }))

    const mappedPosts = trendingPosts.map((post) => ({
      id: post.id,
      title: post.title,
      viewCount: post.viewCount,
      weeklyViews: post.viewCount,
      author: {
        name: post.author.name || 'Unknown',
      },
    }))

    return {
      trendingTags: mappedTags,
      activeUsers: mappedUsers,
      trendingPosts: mappedPosts,
    }
  } catch (error) {
    console.error('사이드바 데이터 조회 실패:', error)
    return {
      trendingTags: [],
      activeUsers: [],
      trendingPosts: [],
    }
  }
}

export const revalidate = 0 // Dynamic rendering for posts page to prevent cache issues

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = (await searchParams) || {}
  const category = params.category || undefined
  const sort = params.sort || 'latest'
  const page = params.page || '1'

  const sidebarData = await getSidebarData()

  return (
    <div className="w-full overflow-x-hidden">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">게시글</h1>
          <p className="text-muted-foreground">
            개발자들이 공유하는 지식과 경험을 만나보세요
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6"
                    >
                      <SkeletonLoader lines={4} />
                    </div>
                  ))}
                </div>
              }
            >
              <PostListServer category={category} sort={sort} page={page} />
            </Suspense>
          </div>

          {/* 사이드바 */}
          <aside className="hidden lg:block space-y-6">
            <Suspense
              fallback={
                <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-6">
                  <SkeletonLoader lines={10} />
                </div>
              }
            >
              <SidebarContainer sidebarData={sidebarData} />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
  )
}
