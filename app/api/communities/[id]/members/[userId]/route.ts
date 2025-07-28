import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth, checkCommunityRole } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notifications'
import { CommunityRole, MembershipStatus } from '@prisma/client'

// PUT: 멤버 역할 변경
export async function PUT(
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
    const { role } = await req.json()

    // 역할 유효성 확인
    if (!Object.values(CommunityRole).includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    // 자기 자신의 역할은 변경할 수 없음
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: '자신의 역할은 변경할 수 없습니다.' },
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

    if (
      !targetMembership ||
      targetMembership.status !== MembershipStatus.ACTIVE
    ) {
      return NextResponse.json(
        { error: '활성 멤버가 아닙니다.' },
        { status: 404 }
      )
    }

    // 현재 사용자의 권한 확인
    const roleError = await checkCommunityRole(
      currentUserId,
      id,
      CommunityRole.ADMIN
    )
    if (roleError) {
      return NextResponse.json(
        { error: '멤버 역할을 변경할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // OWNER 역할로 변경하려는 경우
    if (role === CommunityRole.OWNER) {
      // 현재 OWNER만 OWNER 역할을 양도할 수 있음
      if (targetMembership.community.ownerId !== currentUserId) {
        return NextResponse.json(
          { error: 'OWNER만 소유권을 이전할 수 있습니다.' },
          { status: 403 }
        )
      }

      // 소유권 이전 트랜잭션
      await prisma.$transaction(async (tx) => {
        // 현재 OWNER를 ADMIN으로 변경
        await tx.communityMember.update({
          where: {
            userId_communityId: {
              userId: currentUserId,
              communityId: id,
            },
          },
          data: { role: CommunityRole.ADMIN },
        })

        // 대상을 OWNER로 변경
        await tx.communityMember.update({
          where: {
            userId_communityId: {
              userId: targetUserId,
              communityId: id,
            },
          },
          data: { role: CommunityRole.OWNER },
        })

        // 커뮤니티 소유자 변경
        await tx.community.update({
          where: { id },
          data: { ownerId: targetUserId },
        })
      })

      // 알림 전송
      await createNotification({
        userId: targetUserId,
        type: 'COMMUNITY_ROLE',
        senderId: currentUserId,
        title: '커뮤니티 소유권 이전',
        message: `${targetMembership.community.name} 커뮤니티의 소유자가 되었습니다.`,
        resourceIds: { communityId: id },
      })

      return NextResponse.json({
        message: '소유권이 성공적으로 이전되었습니다.',
        membership: {
          role: CommunityRole.OWNER,
          userId: targetUserId,
        },
      })
    }

    // 일반 역할 변경
    // 현재 역할과 변경하려는 역할 확인
    if (targetMembership.role === CommunityRole.OWNER) {
      return NextResponse.json(
        { error: 'OWNER의 역할은 변경할 수 없습니다.' },
        { status: 403 }
      )
    }

    // GlobalRole.ADMIN은 커뮤니티에서도 ADMIN 역할을 유지해야 함
    if (
      targetMembership.user.globalRole === 'ADMIN' &&
      role !== CommunityRole.ADMIN
    ) {
      return NextResponse.json(
        {
          error: '사이트 관리자는 커뮤니티에서도 ADMIN 역할을 유지해야 합니다.',
        },
        { status: 403 }
      )
    }

    // 역할 변경
    const updatedMembership = await prisma.communityMember.update({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id,
        },
      },
      data: { role },
      select: {
        role: true,
        userId: true,
      },
    })

    // 알림 전송
    const roleMessages = {
      [CommunityRole.MEMBER]: '일반 멤버로',
      [CommunityRole.MODERATOR]: '모더레이터로',
      [CommunityRole.ADMIN]: '관리자로',
    }

    await createNotification({
      userId: targetUserId,
      type: 'COMMUNITY_ROLE',
      senderId: currentUserId,
      title: '커뮤니티 역할 변경',
      message: `${targetMembership.community.name} 커뮤니티에서 ${roleMessages[role as keyof typeof roleMessages]} 변경되었습니다.`,
      resourceIds: { communityId: id },
    })

    return NextResponse.json({
      message: '역할이 성공적으로 변경되었습니다.',
      membership: updatedMembership,
    })
  } catch (error) {
    console.error('Failed to update member role:', error)
    return NextResponse.json(
      { error: '멤버 역할 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 멤버 추방 (강제 탈퇴)
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

    // 자기 자신을 추방할 수 없음
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: '자신을 추방할 수 없습니다.' },
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

    if (
      !targetMembership ||
      targetMembership.status !== MembershipStatus.ACTIVE
    ) {
      return NextResponse.json(
        { error: '활성 멤버가 아닙니다.' },
        { status: 404 }
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
        { error: '멤버를 추방할 권한이 없습니다.' },
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

    // 자신보다 높거나 같은 권한의 멤버는 추방할 수 없음
    if (
      roleHierarchy[targetMembership.role] >=
      roleHierarchy[currentMembership.role]
    ) {
      return NextResponse.json(
        { error: '자신보다 높거나 같은 권한의 멤버는 추방할 수 없습니다.' },
        { status: 403 }
      )
    }

    // GlobalRole.ADMIN은 추방할 수 없음
    if (targetMembership.user.globalRole === 'ADMIN') {
      return NextResponse.json(
        { error: '사이트 관리자는 추방할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 멤버십 삭제 (하드 삭제)
    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id,
        },
      },
    })

    // 멤버 수 감소
    await prisma.community.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    })

    // 알림 전송
    await createNotification({
      userId: targetUserId,
      type: 'COMMUNITY_BAN',
      senderId: currentUserId,
      title: '커뮤니티 추방',
      message: `${targetMembership.community.name} 커뮤니티에서 추방되었습니다.`,
      resourceIds: { communityId: id },
    })

    return NextResponse.json({
      message: '멤버가 성공적으로 추방되었습니다.',
    })
  } catch (error) {
    console.error('Failed to kick member:', error)
    return NextResponse.json(
      { error: '멤버 추방에 실패했습니다.' },
      { status: 500 }
    )
  }
}
