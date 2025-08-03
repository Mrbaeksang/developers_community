import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { throwNotFoundError } from '@/lib/error-handler'

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
      throw throwNotFoundError('Community not found')
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
      throw throwNotFoundError('Post not found')
    }

    // 작성자 본인은 조회수 증가 안함
    if (session?.user?.id === post.authorId) {
      return successResponse({ success: true })
    }

    // Redis에 조회수 버퍼링
    const viewKey = `community:${community.id}:post:${postId}:views`

    // 조회수 증가
    await redis().incr(viewKey)

    // TTL 설정 (24시간)
    await redis().expire(viewKey, 86400)

    return successResponse({ success: true })
  } catch {
    // Redis 오류 시에도 정상 응답 (사용자 경험 우선)
    return successResponse({ success: true })
  }
}
