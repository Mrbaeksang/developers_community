import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GlobalRole, CommunityRole, MembershipStatus } from '@prisma/client'

// Enhanced Auth Types
export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: GlobalRole
  }
}

export interface CommunityMember {
  role: CommunityRole
  status: MembershipStatus
  userId: string
  communityId: string
  bannedUntil?: Date | null
  bannedReason?: string | null
}

// Custom Error Classes
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

// ============================================================================
// CORE SESSION UTILITIES
// ============================================================================

/**
 * Get current session with proper null handling
 * Safe to use in both server components and API routes
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        image: session.user.image || undefined,
        role: (session.user.role as GlobalRole) || 'USER',
      },
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Simple authentication check returning boolean
 * Use for conditional rendering and non-critical checks
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session?.user?.id
}

// ============================================================================
// AUTHENTICATION REQUIREMENTS
// ============================================================================

/**
 * Require authentication for server components
 * Automatically redirects to sign-in if not authenticated
 * @param redirectTo - Page to redirect back to after sign-in
 */
export async function requireAuth(redirectTo?: string): Promise<AuthSession> {
  const session = await getSession()

  if (!session?.user?.id) {
    const redirectPath = redirectTo
      ? `?callbackUrl=${encodeURIComponent(redirectTo)}`
      : ''
    redirect(`/auth/signin${redirectPath}`)
  }

  return session
}

/**
 * Require authentication for API routes
 * Returns 401 response if not authenticated
 */
export async function requireAuthAPI(): Promise<AuthSession | NextResponse> {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  return session
}

// ============================================================================
// GLOBAL ROLE PERMISSIONS
// ============================================================================

/**
 * Check if user has required global role
 * Returns boolean for conditional logic
 */
export async function hasPermission(
  userId: string,
  requiredRoles: GlobalRole[]
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        globalRole: true,
        isBanned: true,
        banUntil: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return false
    }

    // Check ban status
    if (user.isBanned) {
      if (!user.banUntil || user.banUntil > new Date()) {
        return false
      }
      // Auto-unban if ban period expired
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          banUntil: null,
          banReason: null,
        },
      })
    }

    return requiredRoles.includes(user.globalRole)
  } catch (error) {
    console.error('Error checking permissions:', error)
    return false
  }
}

/**
 * Require specific global role for server components
 * Redirects to unauthorized page if insufficient permissions
 */
export async function requireRole(
  requiredRoles: GlobalRole[],
  redirectTo: string = '/unauthorized'
): Promise<AuthSession> {
  const session = await requireAuth()

  const hasRequiredRole = await hasPermission(session.user.id, requiredRoles)
  if (!hasRequiredRole) {
    redirect(redirectTo)
  }

  return session
}

/**
 * Require specific global role for API routes
 * Returns 403 response if insufficient permissions
 */
export async function requireRoleAPI(
  requiredRoles: GlobalRole[]
): Promise<AuthSession | NextResponse> {
  const session = await requireAuthAPI()
  if (session instanceof NextResponse) {
    return session // Return the error response
  }

  const hasRequiredRole = await hasPermission(session.user.id, requiredRoles)
  if (!hasRequiredRole) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  return session
}

// ============================================================================
// COMMUNITY ROLE PERMISSIONS
// ============================================================================

/**
 * Check if user is a member of a community (for API routes)
 * Returns session if member, NextResponse if not
 */
export async function requireCommunityMembershipAPI(
  communityId: string
): Promise<AuthSession | NextResponse> {
  const session = await requireAuthAPI()
  if (session instanceof NextResponse) return session

  const membership = await getCommunityMembership(session.user.id, communityId)

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: '커뮤니티 멤버가 아닙니다.' },
      { status: 403 }
    )
  }

  return session
}

/**
 * Check if user is banned from community
 * Returns error response if banned, null if not
 */
export async function checkCommunityBan(
  userId: string,
  communityId: string
): Promise<NextResponse | null> {
  const membership = await getCommunityMembership(userId, communityId)

  if (membership?.status === 'BANNED') {
    // Auto-unban if ban period expired
    if (membership.bannedUntil && membership.bannedUntil <= new Date()) {
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
      return null
    }

    return NextResponse.json(
      { error: '이 커뮤니티에서 차단되었습니다.' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Get user's community membership with role
 */
export async function getCommunityMembership(
  userId: string,
  communityId: string
): Promise<CommunityMember | null> {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: {
        role: true,
        status: true,
        bannedUntil: true,
        bannedReason: true,
      },
    })

    if (!membership) {
      return null
    }

    // Check if ban has expired
    if (
      membership.status === 'BANNED' &&
      membership.bannedUntil &&
      membership.bannedUntil <= new Date()
    ) {
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
      membership.status = 'ACTIVE'
    }

    return {
      role: membership.role,
      status: membership.status,
      userId,
      communityId,
    }
  } catch (error) {
    console.error('Error getting community membership:', error)
    return null
  }
}

/**
 * Check if user has required community role
 */
export async function hasCommunityPermission(
  userId: string,
  communityId: string,
  requiredRoles: CommunityRole[]
): Promise<boolean> {
  const membership = await getCommunityMembership(userId, communityId)

  if (!membership || membership.status !== 'ACTIVE') {
    return false
  }

  return requiredRoles.includes(membership.role)
}

/**
 * Require specific community role for server components
 */
export async function requireCommunityRole(
  communityId: string,
  requiredRoles: CommunityRole[],
  redirectTo: string = '/unauthorized'
): Promise<{ session: AuthSession; membership: CommunityMember }> {
  const session = await requireAuth()

  const membership = await getCommunityMembership(session.user.id, communityId)
  if (
    !membership ||
    membership.status !== 'ACTIVE' ||
    !requiredRoles.includes(membership.role)
  ) {
    redirect(redirectTo)
  }

  return { session, membership }
}

/**
 * Require specific community role for API routes
 */
export async function requireCommunityRoleAPI(
  communityId: string,
  requiredRoles: CommunityRole[]
): Promise<
  { session: AuthSession; membership: CommunityMember } | NextResponse
> {
  const session = await requireAuthAPI()
  if (session instanceof NextResponse) {
    return session
  }

  const membership = await getCommunityMembership(session.user.id, communityId)
  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: '커뮤니티 멤버가 아닙니다.' },
      { status: 403 }
    )
  }

  if (!requiredRoles.includes(membership.role)) {
    return NextResponse.json(
      { error: '커뮤니티 권한이 없습니다.' },
      { status: 403 }
    )
  }

  return { session, membership }
}

// ============================================================================
// POST AND CONTENT MANAGEMENT
// ============================================================================

/**
 * Check if user can manage a main post (edit/delete)
 */
export async function canManagePost(
  userId: string,
  postAuthorId: string,
  postAuthorRole?: GlobalRole
): Promise<boolean> {
  // User can always manage their own posts
  if (userId === postAuthorId) {
    return true
  }

  // Check if current user has higher global role
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true, isActive: true, isBanned: true },
  })

  if (!currentUser || !currentUser.isActive || currentUser.isBanned) {
    return false
  }

  // Role hierarchy: ADMIN > MANAGER > USER
  const roleHierarchy = {
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
  }

  const currentRoleLevel = roleHierarchy[currentUser.globalRole]
  const authorRoleLevel = roleHierarchy[postAuthorRole || 'USER']

  return currentRoleLevel > authorRoleLevel
}

/**
 * Check if user can manage a community post
 */
export async function canManageCommunityPost(
  userId: string,
  postAuthorId: string,
  communityId: string,
  postAuthorCommunityRole?: CommunityRole
): Promise<boolean> {
  // User can always manage their own posts
  if (userId === postAuthorId) {
    return true
  }

  const membership = await getCommunityMembership(userId, communityId)
  if (!membership || membership.status !== 'ACTIVE') {
    return false
  }

  // Community role hierarchy: OWNER > ADMIN > MODERATOR > MEMBER
  const roleHierarchy = {
    MEMBER: 1,
    MODERATOR: 2,
    ADMIN: 3,
    OWNER: 4,
  }

  const currentRoleLevel = roleHierarchy[membership.role]
  const authorRoleLevel = roleHierarchy[postAuthorCommunityRole || 'MEMBER']

  return currentRoleLevel > authorRoleLevel
}

/**
 * Check if user can manage community (settings, roles, bans)
 */
export async function canManageCommunity(
  userId: string,
  communityId: string
): Promise<boolean> {
  // Check if user is community owner
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true },
  })

  if (community?.ownerId === userId) {
    return true
  }

  // Check if user has ADMIN role in community
  const membership = await getCommunityMembership(userId, communityId)
  return membership?.role === 'ADMIN' && membership.status === 'ACTIVE'
}

// ============================================================================
// BAN AND STATUS CHECKS
// ============================================================================

/**
 * Check and handle user ban status
 * Throws error if user is banned
 */
export async function checkBanStatus(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isBanned: true,
      banUntil: true,
      banReason: true,
      isActive: true,
    },
  })

  if (!user) {
    throw new AuthError('사용자를 찾을 수 없습니다.', 404)
  }

  if (!user.isActive) {
    throw new ForbiddenError('비활성화된 계정입니다.')
  }

  if (user.isBanned) {
    // Check if ban has expired
    if (!user.banUntil || user.banUntil > new Date()) {
      const reason = user.banReason ? ` (사유: ${user.banReason})` : ''
      throw new ForbiddenError(`계정이 정지되었습니다${reason}`)
    }

    // Auto-unban if ban period expired
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banUntil: null,
        banReason: null,
      },
    })
  }
}

/**
 * Check community ban status
 * Returns error response for API routes
 */
export async function checkCommunityBanStatus(
  userId: string,
  communityId: string
): Promise<NextResponse | null> {
  const membership = await getCommunityMembership(userId, communityId)

  if (!membership) {
    return NextResponse.json(
      { error: '커뮤니티 멤버가 아닙니다.' },
      { status: 403 }
    )
  }

  if (membership.status === 'BANNED') {
    return NextResponse.json(
      { error: '커뮤니티에서 차단되었습니다.' },
      { status: 403 }
    )
  }

  if (membership.status === 'PENDING') {
    return NextResponse.json(
      { error: '가입 승인 대기 중입니다.' },
      { status: 403 }
    )
  }

  if (membership.status === 'LEFT') {
    return NextResponse.json(
      { error: '탈퇴한 커뮤니티입니다.' },
      { status: 403 }
    )
  }

  return null
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user by ID with safety checks
 */
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      globalRole: true,
      isActive: true,
      isBanned: true,
      banUntil: true,
      banReason: true,
    },
  })
}

/**
 * Check if user can access private community
 */
export async function canAccessPrivateCommunity(
  userId: string | undefined,
  communityId: string
): Promise<boolean> {
  if (!userId) {
    return false
  }

  // Check if user is owner
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true },
  })

  if (community?.ownerId === userId) {
    return true
  }

  // Check if user is active member
  const membership = await getCommunityMembership(userId, communityId)
  return membership?.status === 'ACTIVE'
}

/**
 * Response helpers for consistent error handling
 */
export const authResponses = {
  unauthorized: (message: string = '로그인이 필요합니다.') =>
    NextResponse.json({ error: message }, { status: 401 }),

  forbidden: (message: string = '권한이 없습니다.') =>
    NextResponse.json({ error: message }, { status: 403 }),

  notFound: (message: string = '리소스를 찾을 수 없습니다.') =>
    NextResponse.json({ error: message }, { status: 404 }),
}
