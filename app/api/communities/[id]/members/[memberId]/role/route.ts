import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth-utils'
import { CommunityRole } from '@prisma/client'
import { z } from 'zod'

// 역할 변경 요청 스키마
const updateRoleSchema = z.object({
  role: z.enum(['MEMBER', 'MODERATOR', 'ADMIN']),
})

// PATCH: 멤버 역할 변경
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await context.params

    // 요청자의 권한 확인 (ADMIN 이상)
    const session = await requireCommunityRoleAPI(id, [CommunityRole.ADMIN])
    if (session instanceof NextResponse) {
      return session
    }

    // 요청 본문 검증
    const body = await req.json()
    const validatedData = updateRoleSchema.parse(body)

    // 대상 멤버 확인
    const targetMember = await prisma.communityMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!targetMember || targetMember.communityId !== id) {
      return NextResponse.json(
        { error: '멤버를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // OWNER 역할은 변경할 수 없음
    if (targetMember.role === CommunityRole.OWNER) {
      return NextResponse.json(
        { error: '소유자의 역할은 변경할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 자기 자신의 역할도 변경할 수 없음
    if (targetMember.userId === session.session.user.id) {
      return NextResponse.json(
        { error: '자신의 역할은 변경할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 역할 업데이트
    const updatedMember = await prisma.communityMember.update({
      where: { id: memberId },
      data: { role: validatedData.role as CommunityRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // TODO: 알림 생성 - 역할이 변경되었음을 알림

    return NextResponse.json({
      id: updatedMember.id,
      userId: updatedMember.userId,
      role: updatedMember.role,
      status: updatedMember.status,
      joinedAt: updatedMember.joinedAt,
      user: {
        id: updatedMember.user.id,
        name: updatedMember.user.name || undefined,
        username: updatedMember.user.username || undefined,
        email: updatedMember.user.email,
        image: updatedMember.user.image || undefined,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    console.error('Failed to update member role:', error)
    return NextResponse.json(
      { error: '역할 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}
