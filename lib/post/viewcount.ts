/**
 * 공통 viewCount 유틸리티
 * MainPost와 CommunityPost를 위한 통일된 Redis 조회수 처리
 */

import { redis } from '@/lib/core/redis'

// ViewCount 처리 결과 인터페이스
export interface ViewCountResult {
  postId: string
  dbViewCount: number
  redisViewCount: number
  totalViewCount: number
}

// 일괄 ViewCount 조회 옵션
export interface BatchViewCountOptions {
  /**
   * Redis에서 조회수를 가져올 키 패턴
   * - 'hash': post_views 해시 사용 (기본값, 권장)
   * - 'individual': 개별 키 사용 (post:{id}:views)
   */
  keyPattern?: 'hash' | 'individual'

  /**
   * 최대값 사용 여부
   * true: Math.max(dbViewCount, redisViewCount) (기본값)
   * false: dbViewCount + redisViewCount
   */
  useMaxValue?: boolean

  /**
   * 디버그 모드 (로그 출력)
   */
  debug?: boolean
}

/**
 * Redis에서 게시글 조회수를 일괄로 가져오는 통합 함수
 * 기존 getBatchViewCounts의 개선된 버전
 */
export async function getUnifiedBatchViewCounts(
  postIds: string[],
  options: BatchViewCountOptions = {}
): Promise<Map<string, number>> {
  const { keyPattern = 'hash', debug = false } = options

  const viewCountsMap = new Map<string, number>()

  if (postIds.length === 0) {
    return viewCountsMap
  }

  const client = redis()
  if (!client) {
    if (debug) console.warn('Redis client not available')
    return viewCountsMap
  }

  try {
    if (keyPattern === 'hash') {
      // post_views 해시에서 한번에 조회 (권장 방식)
      const pipeline = client.pipeline()
      postIds.forEach((postId) => {
        pipeline.hget('post_views', postId)
      })

      const results = await pipeline.exec()
      if (results) {
        results.forEach((result, index) => {
          const [err, value] = result || [null, null]
          if (!err && value && postIds[index]) {
            viewCountsMap.set(postIds[index], parseInt(value as string))
          } else if (postIds[index]) {
            // Redis에 없으면 0 반환
            viewCountsMap.set(postIds[index], 0)
          }
        })
      }
    } else {
      // 개별 키 방식 (호환성 유지)
      const pipeline = client.pipeline()
      postIds.forEach((postId) => {
        pipeline.get(`post:${postId}:views`)
      })

      const results = await pipeline.exec()
      if (results) {
        results.forEach((result, index) => {
          const [err, value] = result || [null, null]
          if (!err && value && postIds[index]) {
            viewCountsMap.set(postIds[index], parseInt(value as string))
          } else if (postIds[index]) {
            viewCountsMap.set(postIds[index], 0)
          }
        })
      }
    }

    if (debug) {
      console.warn(
        `Fetched view counts for ${postIds.length} posts using ${keyPattern} pattern`
      )
    }
  } catch (error) {
    console.error('Error fetching unified batch view counts:', error)
  }

  return viewCountsMap
}

/**
 * 단일 게시글의 Redis 조회수 가져오기
 */
export async function getSingleViewCount(
  postId: string,
  options: BatchViewCountOptions = {}
): Promise<number> {
  const result = await getUnifiedBatchViewCounts([postId], options)
  return result.get(postId) || 0
}

/**
 * DB viewCount와 Redis viewCount를 결합하여 최종 viewCount 계산
 */
export function combineViewCounts(
  dbViewCount: number,
  redisViewCount: number,
  useMaxValue: boolean = true
): number {
  if (useMaxValue) {
    // 최대값 사용 (DB에 이미 반영된 조회수와 Redis 버퍼 중 큰 값)
    return Math.max(dbViewCount, redisViewCount)
  } else {
    // 합계 사용 (DB 조회수 + Redis 버퍼 조회수)
    return dbViewCount + redisViewCount
  }
}

/**
 * 게시글 목록에 Redis 조회수를 적용하는 헬퍼 함수
 * 모든 API에서 동일한 방식으로 viewCount를 처리할 수 있도록 통일
 */
export async function applyViewCountsToPosts<
  T extends { id: string; viewCount: number },
>(posts: T[], options: BatchViewCountOptions = {}): Promise<T[]> {
  if (posts.length === 0) {
    return posts
  }

  const postIds = posts.map((p) => p.id)
  const viewCountsMap = await getUnifiedBatchViewCounts(postIds, options)

  return posts.map((post) => {
    const redisViews = viewCountsMap.get(post.id) || 0
    const finalViewCount = combineViewCounts(
      post.viewCount,
      redisViews,
      options.useMaxValue
    )

    return {
      ...post,
      viewCount: finalViewCount,
    }
  })
}

// 호환성을 위한 기존 함수 별칭
export const getBatchViewCounts = getUnifiedBatchViewCounts
export const getBatchWeeklyViewCounts = getUnifiedBatchViewCounts
