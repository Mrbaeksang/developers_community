import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { MembershipStatus, CommunityRole } from '@prisma/client'
import { Session } from 'next-auth'

// 커스텀 에러 클래스
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

// 에러 응답 헬퍼
export function unauthorized(message: string = '로그인이 필요합니다.') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message: string = '권한이 없습니다.') {
  return NextResponse.json({ error: message }, { status: 403 })
}

// Stage 1 Auth Helpers

// 인증 확인 헬퍼
export function checkAuth(session: Session | null) {
  if (!session?.user?.id) {
    return unauthorized()
  }
  return null
}

// 커뮤니티 멤버십 확인 헬퍼
export async function checkMembership(userId: string, communityId: string) {
  const membership = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: { status: true }
  })

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    return forbidden('커뮤니티 멤버만 접근 가능합니다.')
  }

  return null
}

// 커뮤니티 관리 권한 확인 헬퍼
export async function canManageCommunity(userId: string, communityId: string) {
  const membership = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: { role: true, status: true }
  })

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    return false
  }

  return membership.role === CommunityRole.ADMIN || membership.role === CommunityRole.OWNER
}

// 커뮤니티 역할 확인 헬퍼
export async function checkCommunityRole(
  userId: string,
  communityId: string,
  requiredRole: CommunityRole
) {
  const membership = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: { role: true, status: true }
  })

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    return forbidden('커뮤니티 멤버가 아닙니다.')
  }

  const roleHierarchy = {
    [CommunityRole.MEMBER]: 0,
    [CommunityRole.MODERATOR]: 1,
    [CommunityRole.ADMIN]: 2,
    [CommunityRole.OWNER]: 3
  }

  if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
    return forbidden('권한이 없습니다.')
  }

  return null
}

// 커뮤니티 차단 상태 확인 헬퍼
export async function checkCommunityBan(userId: string, communityId: string) {
  const membership = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: { 
      status: true,
      bannedUntil: true,
      bannedReason: true
    }
  })

  if (membership?.status === MembershipStatus.BANNED) {
    if (!membership.bannedUntil || membership.bannedUntil > new Date()) {
      const reason = membership.bannedReason ? ` (사유: ${membership.bannedReason})` : ''
      return forbidden(`커뮤니티에서 차단되었습니다${reason}`)
    }
    
    // 차단 기간이 지났으면 자동 해제
    await prisma.communityMember.update({
      where: {
        userId_communityId: { userId, communityId }
      },
      data: {
        status: MembershipStatus.ACTIVE,
        bannedUntil: null,
        bannedReason: null
      }
    })
  }

  return null
}

// Ban 상태 체크 함수
export async function checkBanStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isBanned: true,
      banUntil: true,
      banReason: true,
    },
  })

  if (!user) {
    throw new AuthError('사용자를 찾을 수 없습니다.')
  }

  if (user.isBanned) {
    // banUntil이 없거나 아직 지나지 않았으면 여전히 차단 상태
    if (!user.banUntil || user.banUntil > new Date()) {
      const reason = user.banReason ? ` (사유: ${user.banReason})` : ''
      throw new ForbiddenError(`계정이 정지되었습니다${reason}`)
    }

    // banUntil이 지났으면 자동 해제
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banUntil: null,
        banReason: null,
      },
    })
  }

  return true
}

// 커뮤니티 멤버십 체크 함수
export async function checkCommunityMembership(
  userId: string,
  communityId: string,
  requiredStatus: MembershipStatus = 'ACTIVE'
) {
  const member = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: { userId, communityId },
    },
    select: {
      status: true,
      bannedUntil: true,
      bannedReason: true,
      role: true,
    },
  })

  if (!member) {
    throw new ForbiddenError('커뮤니티 멤버가 아닙니다.')
  }

  // BANNED 상태 체크
  if (member.status === 'BANNED') {
    // bannedUntil이 없거나 아직 지나지 않았으면 여전히 차단 상태
    if (!member.bannedUntil || member.bannedUntil > new Date()) {
      const reason = member.bannedReason
        ? ` (사유: ${member.bannedReason})`
        : ''
      throw new ForbiddenError(`커뮤니티에서 차단되었습니다${reason}`)
    }

    // bannedUntil이 지났으면 자동 해제
    await prisma.communityMember.update({
      where: {
        userId_communityId: { userId, communityId },
      },
      data: {
        status: 'ACTIVE',
        bannedUntil: null,
        bannedReason: null,
      },
    })

    // 해제 후 다시 체크
    member.status = 'ACTIVE'
  }

  // 요구된 상태가 아닌 경우
  if (member.status !== requiredStatus) {
    if (member.status === 'PENDING') {
      throw new ForbiddenError('가입 승인 대기 중입니다.')
    }
    if (member.status === 'LEFT') {
      throw new ForbiddenError('탈퇴한 커뮤니티입니다.')
    }
    throw new ForbiddenError('접근 권한이 없습니다.')
  }

  return member
}

// 커뮤니티 권한 체크 함수
export async function requireCommunityRole(
  userId: string,
  communityId: string,
  requiredRoles: string[] // ['MODERATOR', 'ADMIN', 'OWNER']
) {
  const member = await checkCommunityMembership(userId, communityId)

  if (!requiredRoles.includes(member.role)) {
    throw new ForbiddenError('필요한 권한이 없습니다.')
  }

  return member
}

// 글로벌 권한 체크 함수
export async function requireGlobalRole(
  userId: string,
  requiredRoles: string[] // ['MANAGER', 'ADMIN']
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true },
  })

  if (!user || !requiredRoles.includes(user.globalRole)) {
    throw new ForbiddenError('필요한 권한이 없습니다.')
  }

  return user
}
