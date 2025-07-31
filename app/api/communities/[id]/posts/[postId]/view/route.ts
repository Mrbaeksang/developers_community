import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/communities/[id]/posts/[postId]/view - 조회수 증가 (Redis 버퍼링)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await auth()

    // 커뮤니티 확인
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 게시글 확인 (작성자 확인용)
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: community.id,
      },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 작성자 본인은 조회수 증가 안함
    if (session?.user?.id === post.authorId) {
      return NextResponse.json({ success: true })
    }

    // Redis에 조회수 버퍼링
    const viewKey = `community:${community.id}:post:${postId}:views`
    const redisClient = redis()

    // 조회수 증가
    await redisClient.incr(viewKey)

    // TTL 설정 (24시간)
    await redisClient.expire(viewKey, 86400)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to increment view count:', error)
    // Redis 오류 시에도 정상 응답 (사용자 경험 우선)
    return NextResponse.json({ success: true })
  }
}
