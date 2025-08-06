import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { mainPostSelect } from '@/lib/prisma-select-patterns'

/**
 * Cache tags for invalidation
 */
export const CACHE_TAGS = {
  posts: 'posts',
  mainPosts: 'main-posts',
  communityPosts: (communityId: string) => `community-posts-${communityId}`,
  post: (postId: string) => `post-${postId}`,
  categories: 'categories',
  tags: 'tags',
  user: (userId: string) => `user-${userId}`,
  userPosts: (userId: string) => `user-posts-${userId}`,
  trending: 'trending-posts',
} as const

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Short cache for frequently changing data
  SHORT: { revalidate: 60 }, // 1 minute
  // Medium cache for moderately changing data
  MEDIUM: { revalidate: 300 }, // 5 minutes
  // Long cache for rarely changing data
  LONG: { revalidate: 3600 }, // 1 hour
  // Very long cache for static data
  STATIC: { revalidate: 86400 }, // 24 hours
} as const

/**
 * Cached query for main posts with view counts
 */
export const getCachedMainPosts = unstable_cache(
  async ({
    where,
    orderBy,
    skip,
    take,
    includeViewCounts = true,
  }: {
    where: Record<string, unknown>
    orderBy: Record<string, string | Record<string, string>>
    skip: number
    take: number
    includeViewCounts?: boolean
  }) => {
    // Get posts from database
    const [posts, total] = await Promise.all([
      prisma.mainPost.findMany({
        where,
        orderBy,
        skip,
        take,
        select: mainPostSelect.list,
      }),
      prisma.mainPost.count({ where }),
    ])

    // Get view counts from Redis if needed
    let viewCountsMap = new Map<string, number>()
    if (includeViewCounts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      viewCountsMap = await getBatchViewCounts(postIds)
    }

    // Format posts with view counts
    const formattedPosts = posts.map((post) => {
      const redisViews = viewCountsMap.get(post.id) || 0
      return {
        ...post,
        viewCount: post.viewCount + redisViews,
        tags: post.tags.map((postTag) => postTag.tag),
      }
    })

    return { posts: formattedPosts, total }
  },
  ['main-posts'],
  {
    ...CACHE_CONFIG.SHORT,
    tags: [CACHE_TAGS.mainPosts, CACHE_TAGS.posts],
  }
)

/**
 * Cached query for trending posts
 */
export const getCachedTrendingPosts = unstable_cache(
  async ({
    limit = 10,
    category,
  }: {
    limit?: number
    category?: string | null
  }) => {
    // Get all published posts
    const posts = await prisma.mainPost.findMany({
      where: {
        status: 'PUBLISHED',
        ...(category && {
          category: { slug: category },
        }),
      },
      select: mainPostSelect.list,
    })

    // Get weekly view counts
    const postIds = posts.map((p) => p.id)
    const weeklyViewsMap = await getBatchWeeklyViewCounts(postIds)

    // Format and sort by weekly views
    const postsWithWeeklyViews = posts.map((post) => ({
      ...post,
      tags: post.tags.map(
        (postTag: { tag: (typeof post.tags)[0]['tag'] }) => postTag.tag
      ),
      weeklyViews: weeklyViewsMap.get(post.id) || 0,
    }))

    // Sort and filter
    const trendingPosts = postsWithWeeklyViews
      .sort((a, b) => b.weeklyViews - a.weeklyViews)
      .slice(0, limit)
      .filter((post) => post.weeklyViews > 0)

    return trendingPosts
  },
  ['trending-posts'],
  {
    ...CACHE_CONFIG.MEDIUM,
    tags: [CACHE_TAGS.trending, CACHE_TAGS.posts],
  }
)

/**
 * Cached query for community posts
 */
export const getCachedCommunityPosts = unstable_cache(
  async ({
    communityId,
    where,
    orderBy,
    skip,
    take,
    includeViewCounts = true,
    userId,
  }: {
    communityId: string
    where: Record<string, unknown>
    orderBy: Record<string, string | Record<string, string>>
    skip: number
    take: number
    includeViewCounts?: boolean
    userId?: string
  }) => {
    // Get posts from database with communityId filter
    const postsWhere = { ...where, communityId }
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: postsWhere,
        orderBy,
        skip,
        take,
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          category: true,
          _count: {
            select: { comments: true, likes: true },
          },
          likes: userId
            ? {
                where: { userId },
              }
            : false,
          bookmarks: userId
            ? {
                where: { userId },
              }
            : false,
        },
      }),
      prisma.communityPost.count({ where: postsWhere }),
    ])

    // Get view counts from Redis if needed
    let viewCountsMap = new Map<string, number>()
    if (includeViewCounts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      viewCountsMap = await getBatchViewCounts(postIds)
    }

    // Format posts with user status
    const formattedPosts = posts.map((post) => {
      const redisViews = viewCountsMap.get(post.id) || 0
      return {
        ...post,
        viewCount: post.viewCount + redisViews,
        isLiked: post.likes && post.likes.length > 0,
        isBookmarked: post.bookmarks && post.bookmarks.length > 0,
        likes: undefined,
        bookmarks: undefined,
      }
    })

    return { posts: formattedPosts, total }
  },
  ['community-posts'],
  {
    ...CACHE_CONFIG.SHORT,
    tags: [CACHE_TAGS.posts],
  }
)

/**
 * Cached query for categories
 */
export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.mainCategory.findMany({
      orderBy: { order: 'asc' },
    })
  },
  ['categories'],
  {
    ...CACHE_CONFIG.STATIC,
    tags: [CACHE_TAGS.categories],
  }
)

/**
 * Cached query for tags
 */
export const getCachedTags = unstable_cache(
  async ({ limit = 20 }: { limit?: number }) => {
    return prisma.mainTag.findMany({
      orderBy: { postCount: 'desc' },
      take: limit,
    })
  },
  ['tags'],
  {
    ...CACHE_CONFIG.LONG,
    tags: [CACHE_TAGS.tags],
  }
)

/**
 * Helper to invalidate caches when data changes
 */
export async function invalidateCache(tags: string | string[]) {
  const { revalidateTag } = await import('next/cache')

  if (Array.isArray(tags)) {
    tags.forEach((tag) => revalidateTag(tag))
  } else {
    revalidateTag(tags)
  }
}

/**
 * Get batch view counts from Redis
 */
async function getBatchViewCounts(
  postIds: string[]
): Promise<Map<string, number>> {
  const viewCountsMap = new Map<string, number>()

  try {
    const redisClient = redis()
    if (!redisClient) return viewCountsMap

    const pipeline = redisClient.pipeline()
    postIds.forEach((id) => {
      pipeline.hget('post_views', id)
    })

    const results = await pipeline.exec()
    if (results) {
      results.forEach((result, index) => {
        const [err, value] = result
        if (!err && value) {
          viewCountsMap.set(postIds[index], parseInt(value as string) || 0)
        }
      })
    }
  } catch (error) {
    console.error('Failed to get batch view counts:', error)
  }

  return viewCountsMap
}

/**
 * Get batch weekly view counts from Redis
 */
async function getBatchWeeklyViewCounts(
  postIds: string[]
): Promise<Map<string, number>> {
  const viewCountsMap = new Map<string, number>()

  try {
    const redisClient = redis()
    if (!redisClient) return viewCountsMap

    // Get current week start date
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const pipeline = redisClient.pipeline()

    // Get weekly views for each post
    postIds.forEach((id) => {
      // Get views for last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + i)
        const dateKey = date.toISOString().split('T')[0]
        pipeline.hget(`post_views:daily:${dateKey}`, id)
      }
    })

    const results = await pipeline.exec()
    if (results) {
      // Process results - 7 results per post
      postIds.forEach((postId, postIndex) => {
        let weeklyTotal = 0
        for (let i = 0; i < 7; i++) {
          const resultIndex = postIndex * 7 + i
          if (results[resultIndex]) {
            const [err, value] = results[resultIndex]
            if (!err && value) {
              weeklyTotal += parseInt(value as string) || 0
            }
          }
        }
        viewCountsMap.set(postId, weeklyTotal)
      })
    }
  } catch (error) {
    console.error('Failed to get batch weekly view counts:', error)
  }

  return viewCountsMap
}
