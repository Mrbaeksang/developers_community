import { CommunityRole, GlobalRole } from '@prisma/client'
import { COMMUNITY_ROLE_HIERARCHY, GLOBAL_ROLE_HIERARCHY } from './roles'

// 역할 레벨 가져오기 (roles에서 정의된 배열 기반으로 변환)
const COMMUNITY_ROLE_LEVELS = {
  [CommunityRole.MEMBER]: 0,
  [CommunityRole.MODERATOR]: 1,
  [CommunityRole.ADMIN]: 2,
  [CommunityRole.OWNER]: 3,
}

const GLOBAL_ROLE_LEVELS = {
  [GlobalRole.USER]: 0,
  [GlobalRole.MANAGER]: 1,
  [GlobalRole.ADMIN]: 2,
}

/**
 * 커뮤니티 콘텐츠 수정/삭제 권한 확인
 * @param userRole 현재 사용자의 역할
 * @param authorId 콘텐츠 작성자 ID
 * @param authorRole 콘텐츠 작성 당시 작성자의 역할
 * @param userId 현재 사용자 ID
 */
export function canModifyCommunityContent(
  userRole: CommunityRole,
  authorId: string,
  authorRole: CommunityRole,
  userId: string
): boolean {
  // 1. 본인이 작성한 것은 항상 수정 가능
  if (userId === authorId) {
    return true
  }

  // 2. 작성자보다 높은 권한이어야 수정 가능
  return COMMUNITY_ROLE_LEVELS[userRole] > COMMUNITY_ROLE_LEVELS[authorRole]
}

/**
 * 전역 콘텐츠 수정/삭제 권한 확인
 * @param userRole 현재 사용자의 전역 역할
 * @param authorId 콘텐츠 작성자 ID
 * @param authorRole 콘텐츠 작성 당시 작성자의 전역 역할
 * @param userId 현재 사용자 ID
 */
export function canModifyGlobalContent(
  userRole: GlobalRole,
  authorId: string,
  authorRole: GlobalRole,
  userId: string
): boolean {
  // 1. 본인이 작성한 것은 항상 수정 가능
  if (userId === authorId) {
    return true
  }

  // 2. ADMIN은 모든 콘텐츠 수정 가능
  if (userRole === GlobalRole.ADMIN) {
    return true
  }

  // 3. 그 외에는 수정 불가 (MANAGER는 USER의 콘텐츠만 수정 가능하지만, 일반적으로 허용하지 않음)
  return false
}

/**
 * 커뮤니티 멤버 Ban 권한 확인
 * @param userRole Ban을 실행하려는 사용자의 역할
 * @param targetRole Ban 대상의 역할
 */
export function canBanCommunityMember(
  userRole: CommunityRole,
  targetRole: CommunityRole
): boolean {
  // 자기보다 낮은 권한만 Ban 가능
  return COMMUNITY_ROLE_LEVELS[userRole] > COMMUNITY_ROLE_LEVELS[targetRole]
}

/**
 * 커뮤니티 역할 변경 권한 확인
 * @param userRole 역할을 변경하려는 사용자의 역할
 * @param targetCurrentRole 대상의 현재 역할
 * @param targetNewRole 대상의 새 역할
 */
export function canChangeRole(
  userRole: CommunityRole,
  targetCurrentRole: CommunityRole,
  targetNewRole: CommunityRole
): boolean {
  // OWNER만 모든 역할 변경 가능
  if (userRole === CommunityRole.OWNER) {
    return true
  }

  // ADMIN은 MEMBER를 MODERATOR로만 승격 가능
  if (userRole === CommunityRole.ADMIN) {
    return (
      targetCurrentRole === CommunityRole.MEMBER &&
      targetNewRole === CommunityRole.MODERATOR
    )
  }

  // 그 외에는 역할 변경 불가
  return false
}

/**
 * 공지사항 작성 권한 확인
 */
export function canCreateAnnouncement(role: CommunityRole): boolean {
  return (
    role === CommunityRole.OWNER ||
    role === CommunityRole.ADMIN ||
    role === CommunityRole.MODERATOR
  )
}

/**
 * 카테고리 관리 권한 확인
 */
export function canManageCategories(role: CommunityRole): boolean {
  return role === CommunityRole.OWNER || role === CommunityRole.ADMIN
}
