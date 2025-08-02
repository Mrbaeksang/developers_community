import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { z } from 'zod'
import {
  broadcastMessageUpdate,
  broadcastMessageDelete,
} from '@/lib/chat-broadcast'

const updateMessageSchema = z.object({
  content: z.string().min(1).max(1000),
})

// PATCH: 메시지 수정
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  try {
    const { channelId, messageId } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.user.id

    // 메시지 조회
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
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

    if (!message) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인 메시지인지 확인
    if (message.authorId !== userId) {
      return NextResponse.json(
        { error: '본인의 메시지만 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 요청 본문 검증
    const body = await req.json()
    const validatedData = updateMessageSchema.parse(body)

    // 메시지 업데이트
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: validatedData.content,
        updatedAt: new Date(),
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

    const messageResponse = {
      id: updatedMessage.id,
      content: updatedMessage.content,
      type: updatedMessage.type,
      createdAt: updatedMessage.createdAt,
      updatedAt: updatedMessage.updatedAt,
      author: {
        id: updatedMessage.author.id,
        username: updatedMessage.author.username,
        name: updatedMessage.author.name,
        image: updatedMessage.author.image || undefined,
      },
      file: updatedMessage.file
        ? {
            id: updatedMessage.file.id,
            filename: updatedMessage.file.filename,
            size: updatedMessage.file.size,
            type: updatedMessage.file.type,
            url: updatedMessage.file.url,
            mimeType: updatedMessage.file.mimeType,
            width: updatedMessage.file.width,
            height: updatedMessage.file.height,
            expiresAt: updatedMessage.file.expiresAt,
            isTemporary: updatedMessage.file.isTemporary,
          }
        : undefined,
    }

    // 실시간으로 다른 사용자들에게 업데이트 브로드캐스트
    broadcastMessageUpdate(channelId, messageResponse)

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

    console.error('Failed to update message:', error)
    return NextResponse.json(
      { error: '메시지 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 메시지 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  try {
    const { channelId, messageId } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.user.id

    // 메시지 조회
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
        file: true,
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인 메시지인지 확인
    if (message.authorId !== userId) {
      return NextResponse.json(
        { error: '본인의 메시지만 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 메시지 삭제
    await prisma.chatMessage.delete({
      where: { id: messageId },
    })

    // 파일이 있고 다른 곳에서 사용되지 않는다면 파일도 삭제 고려
    // (현재는 파일 삭제 로직 없음)

    // 실시간으로 다른 사용자들에게 삭제 이벤트 브로드캐스트
    broadcastMessageDelete(channelId, messageId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete message:', error)
    return NextResponse.json(
      { error: '메시지 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
