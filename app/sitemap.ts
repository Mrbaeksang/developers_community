import { MetadataRoute } from 'next'
import { getApiUrl } from '@/lib/api/client'

interface MainPost {
  id: string
  slug: string
  updatedAt: string
  status: string
}

interface MainCategory {
  id: string
  slug: string
  updatedAt: string
}

interface Community {
  id: string
  slug: string
  updatedAt: string
  visibility: string
}

interface CommunityPost {
  id: string
  slug: string
  updatedAt: string
  community: {
    slug: string
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'

  // 기본 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/main/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  try {
    // 메인 게시글들 가져오기
    const mainPostsResponse = await fetch(
      `${getApiUrl()}/api/main/posts?limit=1000&status=PUBLISHED`,
      {
        next: { revalidate: 3600 }, // 1시간 캐시
      }
    )

    const mainPosts: MainPost[] = mainPostsResponse.ok
      ? (await mainPostsResponse.json()).data?.posts || []
      : []

    // 메인 카테고리들 가져오기
    const mainCategoriesResponse = await fetch(
      `${getApiUrl()}/api/main/categories`,
      {
        next: { revalidate: 3600 },
      }
    )

    const mainCategoriesData = mainCategoriesResponse.ok
      ? await mainCategoriesResponse.json()
      : { data: [] }

    const mainCategories: MainCategory[] = Array.isArray(
      mainCategoriesData.data
    )
      ? mainCategoriesData.data
      : []

    // 공개 커뮤니티들 가져오기
    const communitiesResponse = await fetch(
      `${getApiUrl()}/api/communities?visibility=PUBLIC&limit=500`,
      {
        next: { revalidate: 3600 },
      }
    )

    const communities: Community[] = communitiesResponse.ok
      ? (await communitiesResponse.json()).data?.communities || []
      : []

    // 커뮤니티 게시글들 가져오기 (공개 커뮤니티만)
    const communityPosts: CommunityPost[] = []
    for (const community of communities) {
      try {
        const postsResponse = await fetch(
          `${getApiUrl()}/api/communities/${community.slug}/posts?limit=200&status=PUBLISHED`,
          {
            next: { revalidate: 3600 },
          }
        )
        if (postsResponse.ok) {
          const posts = (await postsResponse.json()).data?.posts || []
          communityPosts.push(...posts)
        }
      } catch (error) {
        console.error(`커뮤니티 ${community.slug} 게시글 조회 실패:`, error)
      }
    }

    // 메인 게시글 사이트맵
    const mainPostsSitemap: MetadataRoute.Sitemap = mainPosts.map((post) => ({
      url: `${baseUrl}/main/posts/${post.id}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // 메인 카테고리 사이트맵
    const mainCategoriesSitemap: MetadataRoute.Sitemap = mainCategories.map(
      (category) => ({
        url: `${baseUrl}/main/categories/${category.slug}`,
        lastModified: new Date(category.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    )

    // 커뮤니티 사이트맵
    const communitiesSitemap: MetadataRoute.Sitemap = communities.map(
      (community) => ({
        url: `${baseUrl}/communities/${community.slug}`,
        lastModified: new Date(community.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
    )

    // 커뮤니티 게시글 사이트맵
    const communityPostsSitemap: MetadataRoute.Sitemap = communityPosts.map(
      (post) => ({
        url: `${baseUrl}/communities/${post.community.slug}/posts/${post.id}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })
    )

    // 모든 사이트맵 합치기
    return [
      ...staticPages,
      ...mainPostsSitemap,
      ...mainCategoriesSitemap,
      ...communitiesSitemap,
      ...communityPostsSitemap,
    ]
  } catch (error) {
    console.error('사이트맵 생성 중 오류 발생:', error)
    // 오류 발생시 최소한 정적 페이지라도 반환
    return staticPages
  }
}
