import { NextRequest } from 'next/server'
import { markdownToHtml } from '@/lib/markdown'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { getCachedTrendingPosts } from '@/lib/db/query-cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') // 특정 카테고리만 조회

    // 캐시된 트렌딩 게시글 조회
    const trendingPosts = await getCachedTrendingPosts({
      limit,
      category,
      days: 7,
    })

    // 게시글 데이터 포맷팅 (이미 정렬되고 필터링됨)
    const formattedPosts = trendingPosts.map((post) => ({
      ...post,
      content: markdownToHtml(post.content),
      createdAt: new Date(post.createdAt).toISOString(),
      updatedAt: new Date(post.updatedAt).toISOString(),
      timeAgo: formatTimeAgo(new Date(post.createdAt)),
    }))

    return successResponse({
      posts: formattedPosts,
      period: 'weekly',
    })
  } catch (error) {
    return handleError(error)
  }
}
