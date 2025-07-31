import Redis from 'ioredis'

// Redis 클라이언트를 저장할 변수
let redis: Redis | null = null

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
  if (!redis) {
    redis = createRedisClient()
  }
  return redis
}

export { getRedisClient as redis }
