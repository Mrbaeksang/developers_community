import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI } from '@/lib/auth/session'
import { z } from 'zod'
import { broadcastMessage } from '@/lib/chat/broadcast'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
  throwValidationError,
} from '@/lib/api/errors'

const messageSchema = z.object({
  content: z.string().min(1).max(1000),
  fileId: z.string().optional(), // 파일 첨부용
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'), // 메시지 타입
})

// GET: 채팅 메시지 목록 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()
    const { channelId } = await params
    const userId = session?.user?.id

    // 채널 정보 조회
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      throw throwNotFoundError('채널을 찾을 수 없습니다.')
    }

    // GLOBAL 채널이 아닌 경우에만 인증 및 멤버 확인
    if (channel.type !== 'GLOBAL') {
      if (!session?.user?.id) {
        throw throwAuthorizationError('로그인이 필요합니다.')
      }

      // 채널 멤버 확인 (여기서는 userId가 확실히 있음)
      const channelMember = await prisma.chatChannelMember.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId,
          },
        },
      })

      if (!channelMember) {
        throw throwAuthorizationError('채팅방에 참여하지 않았습니다.')
      }
    }

    // 쿼리 파라미터 처리
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const after = searchParams.get('after')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // 메시지 조회
    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId,
        ...(after && {
          createdAt: {
            gt: new Date(after),
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        file: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
    })

    // 페이지네이션 정보
    let nextCursor: string | null = null
    if (messages.length > limit) {
      const nextItem = messages.pop()
      if (nextItem) {
        nextCursor = nextItem.id
      }
    }

    // 메시지 순서 역순으로 변경 (최신 메시지가 아래에 오도록)
    messages.reverse()

    // 마지막 읽은 시간 업데이트 (로그인한 사용자만)
    if (userId) {
      await prisma.chatChannelMember.updateMany({
        where: {
          userId,
          channelId,
        },
        data: {
          lastReadAt: new Date(),
        },
      })
    }

    return successResponse({
      messages: messages.map((message) => {
        return {
          id: message.id,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          author: {
            id: message.author.id,
            username: message.author.username,
            name: message.author.name,
            image: message.author.image || undefined,
          },
          file: message.file
            ? {
                id: message.file.id,
                filename: message.file.filename,
                size: message.file.size,
                type: message.file.type,
                url: message.file.url,
                mimeType: message.file.mimeType,
                width: message.file.width,
                height: message.file.height,
                expiresAt: message.file.expiresAt,
                isTemporary: message.file.isTemporary,
              }
            : undefined,
        }
      }),
      nextCursor,
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST: 새 메시지 전송
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
    const validation = messageSchema.safeParse(body)

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

    const validatedData = validation.data

    // 파일이 첨부된 경우 파일 존재 확인
    if (validatedData.fileId) {
      const file = await prisma.file.findUnique({
        where: { id: validatedData.fileId },
      })

      if (!file || file.uploaderId !== userId) {
        throw throwValidationError('파일을 찾을 수 없거나 권한이 없습니다.')
      }
    }

    // 메시지 생성
    const message = await prisma.chatMessage.create({
      data: {
        content: validatedData.content,
        type: validatedData.type,
        authorId: userId,
        channelId,
        fileId: validatedData.fileId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        file: true,
      },
    })

    // 마지막 읽은 시간 업데이트 (GLOBAL 채널도 포함 - 본인 메시지는 읽음 처리)
    // GLOBAL 채널의 경우 ChatChannelMember가 없을 수 있으므로 upsert 사용
    await prisma.chatChannelMember.upsert({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
      update: {
        lastReadAt: new Date(),
      },
      create: {
        userId,
        channelId,
        lastReadAt: new Date(),
      },
    })

    const messageResponse = {
      id: message.id,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      author: {
        id: message.author.id,
        username: message.author.username,
        name: message.author.name,
        image: message.author.image || undefined,
      },
      file: message.file
        ? {
            id: message.file.id,
            filename: message.file.filename,
            size: message.file.size,
            type: message.file.type,
            url: message.file.url,
            mimeType: message.file.mimeType,
            width: message.file.width,
            height: message.file.height,
            expiresAt: message.file.expiresAt,
            isTemporary: message.file.isTemporary,
          }
        : undefined,
    }

    // 실시간으로 다른 사용자들에게 메시지 브로드캐스트
    broadcastMessage(channelId, messageResponse)

    return successResponse({
      message: messageResponse,
    })
  } catch (error) {
    return handleError(error)
  }
}
