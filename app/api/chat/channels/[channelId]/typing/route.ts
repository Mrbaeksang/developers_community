import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { z } from 'zod'
import { broadcastTyping } from '@/lib/chat-broadcast'
import { successResponse, validationErrorResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'

const typingSchema = z.object({
  isTyping: z.boolean(),
})

// POST: 타이핑 상태 업데이트
export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    const userId = session.user.id

    // 채널 정보 조회
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      throw throwNotFoundError('채널을 찾을 수 없습니다.')
    }

    // GLOBAL 채널이 아닌 경우에만 멤버 확인
    if (channel.type !== 'GLOBAL') {
      const channelMember = await prisma.chatChannelMember.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
      })

      if (!channelMember) {
        throw throwAuthorizationError('채팅방에 참여하지 않았습니다.')
      }
    }

    // 요청 본문 검증
    const body = await req.json()
    const validation = typingSchema.safeParse(body)

    if (!validation.success) {
      const errors: Record<string, string[]> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }

    const { isTyping } = validation.data

    // 타이핑 상태 브로드캐스트
    broadcastTyping(channelId, userId, isTyping)

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }
    return handleError(error)
  }
}
