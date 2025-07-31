import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth-helpers'
import { z } from 'zod'
import { broadcastMessage } from '../events/route'

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
      return NextResponse.json(
        { error: '채널을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // GLOBAL 채널이 아닌 경우에만 인증 및 멤버 확인
    if (channel.type !== 'GLOBAL') {
      if (!checkAuth(session)) {
        return NextResponse.json(
          { error: '로그인이 필요합니다.' },
          { status: 401 }
        )
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
        return NextResponse.json(
          { error: '채팅방에 참여하지 않았습니다.' },
          { status: 403 }
        )
      }
    }

    // 쿼리 파라미터 처리
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // 메시지 조회
    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId,
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

    return NextResponse.json({
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
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: '메시지를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 메시지 전송
export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()
    const { channelId } = await params

    // 인증 확인
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 채널 정보 조회
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      return NextResponse.json(
        { error: '채널을 찾을 수 없습니다.' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: '채팅방에 참여하지 않았습니다.' },
          { status: 403 }
        )
      }
    }

    // 요청 본문 검증
    const body = await req.json()
    const validatedData = messageSchema.parse(body)

    // 파일이 첨부된 경우 파일 존재 확인
    if (validatedData.fileId) {
      const file = await prisma.file.findUnique({
        where: { id: validatedData.fileId },
      })

      if (!file || file.uploaderId !== userId) {
        return NextResponse.json(
          { error: '파일을 찾을 수 없거나 권한이 없습니다.' },
          { status: 400 }
        )
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

    // 마지막 읽은 시간 업데이트 (GLOBAL이 아닌 경우만)
    if (channel.type !== 'GLOBAL') {
      await prisma.chatChannelMember.update({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      })
    }

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

    return NextResponse.json({
      message: messageResponse,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '잘못된 요청입니다.', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: '메시지 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
