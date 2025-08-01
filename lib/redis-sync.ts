import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

/**
 * Redis에 버퍼링된 조회수를 DB에 동기화
 * Vercel Cron 또는 별도 배치 작업으로 실행
 */
export async function syncViewCounts() {
  const results = { success: 0, failed: 0, total: 0 }

  try {
    // 모든 post 조회수 키 가져오기
    const keys = await redis().keys('post:*:views')
    results.total = keys.length

    if (keys.length === 0) {
      return results
    }

    // 각 키에 대해 조회수 가져오고 DB 업데이트
    for (const key of keys) {
      try {
        // post ID 추출
        const postId = key.split(':')[1]

        // Redis에서 조회수 가져오기
        const viewCount = await redis().get(key)

        if (viewCount && parseInt(viewCount) > 0) {
          // DB에 조회수 업데이트
          await prisma.mainPost.update({
            where: { id: postId },
            data: {
              viewCount: {
                increment: parseInt(viewCount),
              },
            },
          })

          // Redis 키 삭제 (동기화 완료)
          await redis().del(key)

          results.success++
        }
      } catch (error) {
        console.error(`Failed to sync view count for ${key}:`, error)
        results.failed++
      }
    }

    return results
  } catch (error) {
    console.error('Failed to sync view counts:', error)
    throw error
  }
}

/**
 * 커뮤니티 게시글 조회수 동기화
 */
export async function syncCommunityViewCounts() {
  const results = { success: 0, failed: 0, total: 0 }

  try {
    // 모든 community post 조회수 키 가져오기
    const keys = await redis().keys('community:*:post:*:views')
    results.total = keys.length

    if (keys.length === 0) {
      return results
    }

    // 각 키에 대해 조회수 가져오고 DB 업데이트
    for (const key of keys) {
      try {
        // community ID와 post ID 추출
        const parts = key.split(':')
        const communityId = parts[1]
        const postId = parts[3]

        // Redis에서 조회수 가져오기
        const viewCount = await redis().get(key)

        if (viewCount && parseInt(viewCount) > 0) {
          // DB에 조회수 업데이트
          await prisma.communityPost.update({
            where: {
              id: postId,
              communityId: communityId,
            },
            data: {
              viewCount: {
                increment: parseInt(viewCount),
              },
            },
          })

          // Redis 키 삭제 (동기화 완료)
          await redis().del(key)

          results.success++
        }
      } catch (error) {
        console.error(`Failed to sync community view count for ${key}:`, error)
        results.failed++
      }
    }

    return results
  } catch (error) {
    console.error('Failed to sync community view counts:', error)
    throw error
  }
}

/**
 * 모든 조회수 동기화
 */
export async function syncAllViewCounts() {
  const mainResults = await syncViewCounts()
  const communityResults = await syncCommunityViewCounts()

  return {
    main: mainResults,
    community: communityResults,
    total: {
      success: mainResults.success + communityResults.success,
      failed: mainResults.failed + communityResults.failed,
      total: mainResults.total + communityResults.total,
    },
  }
}
