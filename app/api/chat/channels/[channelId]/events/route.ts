import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { NextResponse } from 'next/server'
import {
  handleError,
  throwNotFoundError,
  throwAuthenticationError,
  throwAuthorizationError,
} from '@/lib/api/errors'

// Vercel에서 SSE는 타임아웃 문제로 사용 불가
// 대신 Polling 또는 WebSocket 서비스(Pusher, Ably) 사용 권장

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()
    const { channelId } = await params

    // 채널 정보 조회
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          where: {
            userId: session?.user?.id || '',
          },
        },
      },
    })

    if (!channel) {
      throwNotFoundError('채널을 찾을 수 없습니다.')
    }

    // GLOBAL 채널이 아닌 경우에만 멤버 확인
    if (channel.type !== 'GLOBAL') {
      if (!session?.user?.id) {
        throwAuthenticationError('로그인이 필요합니다.')
      }

      if (channel.members.length === 0) {
        throwAuthorizationError('채팅방에 참여하지 않았습니다.')
      }
    }

    // Polling 방식으로 변경: 클라이언트가 주기적으로 새 메시지 확인
    // 또는 Pusher/Ably 같은 실시간 서비스 사용
    return NextResponse.json({
      success: true,
      data: {
        message:
          'SSE is not supported in Vercel serverless. Use polling or WebSocket service instead.',
        alternatives: {
          polling: '/api/chat/channels/[channelId]/messages',
          websocket: 'Consider using Pusher, Ably, or Supabase Realtime',
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
