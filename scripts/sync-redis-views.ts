import { prisma } from '@/lib/core/prisma'
import { redis } from '@/lib/core/redis'

async function syncRedisWithDB() {
  console.error('Starting Redis-DB view count synchronization...')

  const client = redis()
  if (!client) {
    console.error('Redis client not available')
    process.exit(1)
  }

  try {
    // 모든 MainPost의 viewCount 가져오기
    const posts = await prisma.mainPost.findMany({
      select: {
        id: true,
        viewCount: true,
        title: true,
      },
    })

    console.error(`Found ${posts.length} posts to sync`)

    // Redis의 모든 조회수 데이터 삭제
    await client.del('post_views')
    console.error('Cleared existing Redis view counts')

    // DB의 viewCount를 Redis에 동기화 (0인 것도 포함)
    for (const post of posts) {
      await client.hset('post_views', post.id, post.viewCount)
      console.error(`Synced ${post.title}: ${post.viewCount} views`)
    }

    // 확인
    const keys = await client.hkeys('post_views')
    console.error(`\nSynced ${keys.length} posts with view counts to Redis`)

    // 몇 개 샘플 확인
    for (const key of keys.slice(0, 5)) {
      const count = await client.hget('post_views', key)
      const post = posts.find((p) => p.id === key)
      console.error(`- ${post?.title || key}: ${count} views`)
    }

    console.error('\nSync completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error during sync:', error)
    process.exit(1)
  }
}

syncRedisWithDB()
