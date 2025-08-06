import { GlobalRole, CommunityRole } from '@prisma/client'

// 전역 역할 계층 (높은 순서대로)
export const GLOBAL_ROLE_HIERARCHY: GlobalRole[] = ['ADMIN', 'MANAGER', 'USER']

// 커뮤니티 역할 계층 (높은 순서대로)
export const COMMUNITY_ROLE_HIERARCHY: CommunityRole[] = [
  'OWNER',
  'ADMIN',
  'MODERATOR',
  'MEMBER',
]

/**
 * 현재 사용자가 대상 사용자보다 높은 전역 역할을 가지고 있는지 확인
 */
export function hasHigherGlobalRole(
  currentRole: GlobalRole,
  targetRole: GlobalRole
): boolean {
  const currentIndex = GLOBAL_ROLE_HIERARCHY.indexOf(currentRole)
  const targetIndex = GLOBAL_ROLE_HIERARCHY.indexOf(targetRole)

  // 인덱스가 작을수록 높은 권한
  return currentIndex !== -1 && targetIndex !== -1 && currentIndex < targetIndex
}

/**
 * 현재 사용자가 대상 사용자와 같거나 높은 전역 역할을 가지고 있는지 확인
 */
export function hasEqualOrHigherGlobalRole(
  currentRole: GlobalRole,
  targetRole: GlobalRole
): boolean {
  const currentIndex = GLOBAL_ROLE_HIERARCHY.indexOf(currentRole)
  const targetIndex = GLOBAL_ROLE_HIERARCHY.indexOf(targetRole)

  // 인덱스가 작거나 같을수록 높은 권한
  return (
    currentIndex !== -1 && targetIndex !== -1 && currentIndex <= targetIndex
  )
}

/**
 * 현재 사용자가 대상 사용자보다 높은 커뮤니티 역할을 가지고 있는지 확인
 */
export function hasHigherCommunityRole(
  currentRole: CommunityRole,
  targetRole: CommunityRole
): boolean {
  const currentIndex = COMMUNITY_ROLE_HIERARCHY.indexOf(currentRole)
  const targetIndex = COMMUNITY_ROLE_HIERARCHY.indexOf(targetRole)

  // 인덱스가 작을수록 높은 권한
  return currentIndex !== -1 && targetIndex !== -1 && currentIndex < targetIndex
}

/**
 * 현재 사용자가 대상 사용자와 같거나 높은 커뮤니티 역할을 가지고 있는지 확인
 */
export function hasEqualOrHigherCommunityRole(
  currentRole: CommunityRole,
  targetRole: CommunityRole
): boolean {
  const currentIndex = COMMUNITY_ROLE_HIERARCHY.indexOf(currentRole)
  const targetIndex = COMMUNITY_ROLE_HIERARCHY.indexOf(targetRole)

  // 인덱스가 작거나 같을수록 높은 권한
  return (
    currentIndex !== -1 && targetIndex !== -1 && currentIndex <= targetIndex
  )
}

/**
 * 메인 사이트 콘텐츠 수정/삭제 권한 확인
 * @param userRole 현재 사용자의 전역 역할
 * @param isAuthor 현재 사용자가 작성자인지 여부
 * @param contentAuthorRole 콘텐츠 작성자의 작성 시점 역할
 * @returns 수정/삭제 가능 여부
 */
export function canModifyMainContent(
  userRole: GlobalRole,
  isAuthor: boolean,
  contentAuthorRole: GlobalRole
): boolean {
  // 작성자 본인인 경우 항상 수정/삭제 가능
  if (isAuthor) {
    return true
  }

  // ADMIN은 모든 콘텐츠 수정/삭제 가능
  if (userRole === 'ADMIN') {
    return true
  }

  // 작성자보다 높은 권한을 가진 경우만 수정/삭제 가능
  return hasHigherGlobalRole(userRole, contentAuthorRole)
}

/**
 * 커뮤니티 콘텐츠 수정/삭제 권한 확인
 * @param userRole 현재 사용자의 커뮤니티 역할
 * @param isAuthor 현재 사용자가 작성자인지 여부
 * @param contentAuthorRole 콘텐츠 작성자의 작성 시점 역할
 * @returns 수정/삭제 가능 여부
 */
export function canModifyCommunityContent(
  userRole: CommunityRole,
  isAuthor: boolean,
  contentAuthorRole: CommunityRole
): boolean {
  // 작성자 본인인 경우 항상 수정/삭제 가능
  if (isAuthor) {
    return true
  }

  // OWNER는 모든 콘텐츠 수정/삭제 가능
  if (userRole === 'OWNER') {
    return true
  }

  // 작성자보다 높은 권한을 가진 경우만 수정/삭제 가능
  return hasHigherCommunityRole(userRole, contentAuthorRole)
}
