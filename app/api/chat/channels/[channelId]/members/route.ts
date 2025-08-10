import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { handleError } from '@/lib/api/errors'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    // 채널 멤버 조회
    const members = await prisma.chatChannelMember.findMany({
      where: {
        channelId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        members: members.map((m) => ({
          userId: m.userId,
          joinedAt: m.joinedAt,
          ...m.user,
        })),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
