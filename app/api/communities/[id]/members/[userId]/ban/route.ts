import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth, checkCommunityRole } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notifications'
import { CommunityRole, MembershipStatus } from '@prisma/client'

// POST: 멤버 밴
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId: targetUserId } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    const currentUserId = session!.user.id
    const { reason, until } = await req.json()

    // 자기 자신을 밴할 수 없음
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: '자신을 차단할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 대상 멤버십 확인
    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id,
        },
      },
      include: {
        user: {
          select: { name: true, globalRole: true },
        },
        community: {
          select: { name: true, ownerId: true },
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { error: '커뮤니티 멤버가 아닙니다.' },
        { status: 404 }
      )
    }

    // 이미 밴된 상태인지 확인
    if (targetMembership.status === MembershipStatus.BANNED) {
      return NextResponse.json(
        { error: '이미 차단된 멤버입니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자의 권한 확인
    const roleError = await checkCommunityRole(
      currentUserId,
      id,
      CommunityRole.MODERATOR
    )
    if (roleError) {
      return NextResponse.json(
        { error: '멤버를 차단할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 권한 계층 확인
    const currentMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: currentUserId,
          communityId: id,
        },
      },
    })

    if (!currentMembership) {
      return NextResponse.json(
        { error: '커뮤니티 멤버가 아닙니다.' },
        { status: 403 }
      )
    }

    // 역할 계층 확인
    const roleHierarchy = {
      [CommunityRole.MEMBER]: 0,
      [CommunityRole.MODERATOR]: 1,
      [CommunityRole.ADMIN]: 2,
      [CommunityRole.OWNER]: 3,
    }

    // 자신보다 높거나 같은 권한의 멤버는 밴할 수 없음
    if (
      roleHierarchy[targetMembership.role] >=
      roleHierarchy[currentMembership.role]
    ) {
      return NextResponse.json(
        { error: '자신보다 높거나 같은 권한의 멤버는 차단할 수 없습니다.' },
        { status: 403 }
      )
    }

    // GlobalRole.ADMIN은 밴할 수 없음
    if (targetMembership.user.globalRole === 'ADMIN') {
      return NextResponse.json(
        { error: '사이트 관리자는 차단할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 밴 기간 설정
    const bannedUntil = until ? new Date(until) : null
    if (bannedUntil && bannedUntil <= new Date()) {
      return NextResponse.json(
        { error: '차단 종료 시간은 현재 시간 이후여야 합니다.' },
        { status: 400 }
      )
    }

    // 멤버십 상태를 BANNED로 변경
    const updatedMembership = await prisma.communityMember.update({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id,
        },
      },
      data: {
        status: MembershipStatus.BANNED,
        bannedAt: new Date(),
        bannedReason: reason || '커뮤니티 규칙 위반',
        bannedUntil,
      },
      select: {
        status: true,
        bannedAt: true,
        bannedReason: true,
        bannedUntil: true,
      },
    })

    // ACTIVE 상태였다면 멤버 수 감소
    if (targetMembership.status === MembershipStatus.ACTIVE) {
      await prisma.community.update({
        where: { id },
        data: { memberCount: { decrement: 1 } },
      })
    }

    // 알림 전송
    const banMessage = bannedUntil
      ? `${targetMembership.community.name} 커뮤니티에서 ${bannedUntil.toLocaleDateString()}까지 차단되었습니다.`
      : `${targetMembership.community.name} 커뮤니티에서 영구 차단되었습니다.`

    await createNotification({
      userId: targetUserId,
      type: 'COMMUNITY_BAN',
      senderId: currentUserId,
      title: '커뮤니티 차단',
      message: `${banMessage} 사유: ${reason || '커뮤니티 규칙 위반'}`,
      resourceIds: { communityId: id },
    })

    return NextResponse.json({
      message: '멤버가 성공적으로 차단되었습니다.',
      ban: updatedMembership,
    })
  } catch (error) {
    console.error('Failed to ban member:', error)
    return NextResponse.json(
      { error: '멤버 차단에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 밴 해제
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId: targetUserId } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    const currentUserId = session!.user.id

    // 대상 멤버십 확인
    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
        community: {
          select: { name: true },
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { error: '커뮤니티 멤버가 아닙니다.' },
        { status: 404 }
      )
    }

    // 밴된 상태가 아니면 해제할 수 없음
    if (targetMembership.status !== MembershipStatus.BANNED) {
      return NextResponse.json(
        { error: '차단된 멤버가 아닙니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자의 권한 확인
    const roleError = await checkCommunityRole(
      currentUserId,
      id,
      CommunityRole.MODERATOR
    )
    if (roleError) {
      return NextResponse.json(
        { error: '차단을 해제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 밴 해제
    const updatedMembership = await prisma.communityMember.update({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id,
        },
      },
      data: {
        status: MembershipStatus.LEFT, // 밴 해제 시 LEFT 상태로 변경
        bannedAt: null,
        bannedReason: null,
        bannedUntil: null,
      },
      select: {
        status: true,
      },
    })

    // 알림 전송
    await createNotification({
      userId: targetUserId,
      type: 'COMMUNITY_ROLE',
      senderId: currentUserId,
      title: '커뮤니티 차단 해제',
      message: `${targetMembership.community.name} 커뮤니티의 차단이 해제되었습니다. 다시 가입할 수 있습니다.`,
      resourceIds: { communityId: id },
    })

    return NextResponse.json({
      message: '차단이 성공적으로 해제되었습니다.',
      membership: updatedMembership,
    })
  } catch (error) {
    console.error('Failed to unban member:', error)
    return NextResponse.json(
      { error: '차단 해제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
