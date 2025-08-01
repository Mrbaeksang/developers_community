import Redis from 'ioredis'

// Redis 클라이언트를 저장할 변수
let redisClient: Redis | null = null

// Redis 클라이언트 생성 함수
function createRedisClient() {
  // 프로덕션 환경 변수 체크
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not defined in environment variables')
  }

  const client = new Redis(process.env.REDIS_URL, {
    // 프로덕션 최적화 설정
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,

    // 연결 타임아웃 설정
    connectTimeout: 10000,

    // 재연결 전략
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },

    // 에러 핸들링
    reconnectOnError(err) {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        // Redis가 읽기 전용 모드일 때만 재연결
        return true
      }
      return false
    },
  })

  // 연결 이벤트 핸들링
  client.on('connect', () => {
    // console.log('Redis 연결 성공')
  })

  client.on('error', (err) => {
    console.error('Redis 연결 에러:', err)
  })

  client.on('ready', () => {
    // console.log('Redis 준비 완료')
  })

  // 개발 환경에서 Redis 연결 상태 확인용
  if (process.env.NODE_ENV === 'development') {
    client
      .ping()
      .then(() => {
        // console.log('Redis PING 성공')
      })
      .catch((err) => {
        console.error('Redis PING 실패:', err)
      })
  }

  return client
}

// Redis 클라이언트 getter
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient()
  }
  return redisClient
}

// 내보내기
export const redis = getRedisClient()

// 조회수 증가 및 마일스톤 체크 함수
export async function incrementViewCount(postId: string): Promise<number> {
  try {
    const client = getRedisClient()
    // 조회수 증가
    const viewCount = await client.hincrby('post_views', postId, 1)

    // 마일스톤 체크 (100, 500, 1000, 5000, 10000 등)
    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000]

    for (const milestone of milestones) {
      if (viewCount === milestone) {
        // 마일스톤 이벤트 저장
        const event = {
          postId,
          viewCount: milestone,
          timestamp: new Date().toISOString(),
        }

        // 리스트에 추가 (최신 순)
        await client.lpush('view_milestones', JSON.stringify(event))

        // 최대 100개만 유지
        await client.ltrim('view_milestones', 0, 99)

        // 24시간 후 자동 삭제를 위한 TTL 설정
        await client.expire('view_milestones', 86400)

        break
      }
    }

    return viewCount
  } catch (error) {
    console.error('Error incrementing view count:', error)
    // 에러 시 0 반환
    return 0
  }
}

// 조회수 가져오기
export async function getViewCount(postId: string): Promise<number> {
  try {
    const client = getRedisClient()
    const count = await client.hget('post_views', postId)
    return count ? parseInt(count) : 0
  } catch (error) {
    console.error('Error getting view count:', error)
    return 0
  }
}

// 여러 게시글의 조회수 한번에 가져오기
export async function getViewCounts(
  postIds: string[]
): Promise<Map<string, number>> {
  try {
    if (postIds.length === 0) {
      return new Map()
    }

    const client = getRedisClient()
    const pipeline = client.pipeline()
    postIds.forEach((id) => pipeline.hget('post_views', id))

    const results = await pipeline.exec()
    const viewCounts = new Map<string, number>()

    if (results) {
      results.forEach((result, index) => {
        const [err, value] = result
        if (!err && value) {
          viewCounts.set(postIds[index], parseInt(value as string))
        } else {
          viewCounts.set(postIds[index], 0)
        }
      })
    }

    return viewCounts
  } catch (error) {
    console.error('Error getting view counts:', error)
    return new Map()
  }
}
