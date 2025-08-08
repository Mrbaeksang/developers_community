/**
 * Action Classification System
 * 작업 유형별로 rate limiting 정책을 다르게 적용하기 위한 분류 시스템
 */

export enum ActionType {
  // READ operations - 읽기 전용 작업
  READ = 'READ',

  // WRITE operations - 데이터 생성/수정 작업
  WRITE = 'WRITE',

  // SENSITIVE operations - 민감한 작업 (좋아요, 북마크 등)
  SENSITIVE = 'SENSITIVE',

  // CRITICAL operations - 중요 작업 (인증, 결제 등)
  CRITICAL = 'CRITICAL',

  // ADMIN operations - 관리자 작업
  ADMIN = 'ADMIN',
}

export enum ActionCategory {
  // Authentication
  AUTH_LOGIN = 'auth.login',
  AUTH_REGISTER = 'auth.register',
  AUTH_RESET_PASSWORD = 'auth.reset_password',
  AUTH_VERIFY_EMAIL = 'auth.verify_email',

  // Posts
  POST_READ = 'post.read',
  POST_LIST = 'post.list',
  POST_CREATE = 'post.create',
  POST_UPDATE = 'post.update',
  POST_DELETE = 'post.delete',
  POST_LIKE = 'post.like',
  POST_UNLIKE = 'post.unlike',
  POST_BOOKMARK = 'post.bookmark',
  POST_UNBOOKMARK = 'post.unbookmark',
  POST_VIEW = 'post.view',

  // Comments
  COMMENT_READ = 'comment.read',
  COMMENT_LIST = 'comment.list',
  COMMENT_CREATE = 'comment.create',
  COMMENT_UPDATE = 'comment.update',
  COMMENT_DELETE = 'comment.delete',
  COMMENT_LIKE = 'comment.like',

  // Communities
  COMMUNITY_JOIN = 'community.join',
  COMMUNITY_LEAVE = 'community.leave',
  COMMUNITY_CREATE = 'community.create',
  COMMUNITY_UPDATE = 'community.update',
  COMMUNITY_DELETE = 'community.delete',

  // Files
  FILE_UPLOAD = 'file.upload',
  FILE_DOWNLOAD = 'file.download',
  FILE_DELETE = 'file.delete',

  // Admin
  ADMIN_USER_BAN = 'admin.user.ban',
  ADMIN_USER_UNBAN = 'admin.user.unban',
  ADMIN_POST_APPROVE = 'admin.post.approve',
  ADMIN_POST_REJECT = 'admin.post.reject',

  // Search
  SEARCH_POSTS = 'search.posts',
  SEARCH_USERS = 'search.users',
  SEARCH_COMMUNITIES = 'search.communities',
}

// Action 메타데이터
export interface ActionMetadata {
  type: ActionType
  category: ActionCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  cost: number // 작업의 리소스 비용 (1-10)
  requiresAuth: boolean
  requiresVerification?: boolean // 이메일 인증 필요 여부
  adminOnly?: boolean
}

// Action 설정 맵
export const ACTION_CONFIG: Record<ActionCategory, ActionMetadata> = {
  // Authentication - CRITICAL
  [ActionCategory.AUTH_LOGIN]: {
    type: ActionType.CRITICAL,
    category: ActionCategory.AUTH_LOGIN,
    severity: 'critical',
    cost: 5,
    requiresAuth: false,
  },
  [ActionCategory.AUTH_REGISTER]: {
    type: ActionType.CRITICAL,
    category: ActionCategory.AUTH_REGISTER,
    severity: 'critical',
    cost: 8,
    requiresAuth: false,
  },
  [ActionCategory.AUTH_RESET_PASSWORD]: {
    type: ActionType.CRITICAL,
    category: ActionCategory.AUTH_RESET_PASSWORD,
    severity: 'critical',
    cost: 5,
    requiresAuth: false,
  },
  [ActionCategory.AUTH_VERIFY_EMAIL]: {
    type: ActionType.CRITICAL,
    category: ActionCategory.AUTH_VERIFY_EMAIL,
    severity: 'medium',
    cost: 2,
    requiresAuth: false,
  },

  // Posts - READ
  [ActionCategory.POST_READ]: {
    type: ActionType.READ,
    category: ActionCategory.POST_READ,
    severity: 'low',
    cost: 1,
    requiresAuth: false,
  },
  [ActionCategory.POST_LIST]: {
    type: ActionType.READ,
    category: ActionCategory.POST_LIST,
    severity: 'low',
    cost: 2,
    requiresAuth: false,
  },
  [ActionCategory.POST_VIEW]: {
    type: ActionType.READ,
    category: ActionCategory.POST_VIEW,
    severity: 'low',
    cost: 1,
    requiresAuth: false,
  },

  // Posts - WRITE
  [ActionCategory.POST_CREATE]: {
    type: ActionType.WRITE,
    category: ActionCategory.POST_CREATE,
    severity: 'medium',
    cost: 4, // 8 → 4로 완화
    requiresAuth: true,
    requiresVerification: true,
  },
  [ActionCategory.POST_UPDATE]: {
    type: ActionType.WRITE,
    category: ActionCategory.POST_UPDATE,
    severity: 'medium',
    cost: 5,
    requiresAuth: true,
  },
  [ActionCategory.POST_DELETE]: {
    type: ActionType.WRITE,
    category: ActionCategory.POST_DELETE,
    severity: 'high',
    cost: 3,
    requiresAuth: true,
  },

  // Posts - SENSITIVE (interaction)
  [ActionCategory.POST_LIKE]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.POST_LIKE,
    severity: 'medium',
    cost: 3,
    requiresAuth: true,
  },
  [ActionCategory.POST_UNLIKE]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.POST_UNLIKE,
    severity: 'medium',
    cost: 3,
    requiresAuth: true,
  },
  [ActionCategory.POST_BOOKMARK]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.POST_BOOKMARK,
    severity: 'low',
    cost: 2,
    requiresAuth: true,
  },
  [ActionCategory.POST_UNBOOKMARK]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.POST_UNBOOKMARK,
    severity: 'low',
    cost: 2,
    requiresAuth: true,
  },

  // Comments
  [ActionCategory.COMMENT_READ]: {
    type: ActionType.READ,
    category: ActionCategory.COMMENT_READ,
    severity: 'low',
    cost: 1,
    requiresAuth: false,
  },
  [ActionCategory.COMMENT_LIST]: {
    type: ActionType.READ,
    category: ActionCategory.COMMENT_LIST,
    severity: 'low',
    cost: 2,
    requiresAuth: false,
  },
  [ActionCategory.COMMENT_CREATE]: {
    type: ActionType.WRITE,
    category: ActionCategory.COMMENT_CREATE,
    severity: 'medium',
    cost: 5,
    requiresAuth: true,
  },
  [ActionCategory.COMMENT_UPDATE]: {
    type: ActionType.WRITE,
    category: ActionCategory.COMMENT_UPDATE,
    severity: 'medium',
    cost: 3,
    requiresAuth: true,
  },
  [ActionCategory.COMMENT_DELETE]: {
    type: ActionType.WRITE,
    category: ActionCategory.COMMENT_DELETE,
    severity: 'medium',
    cost: 2,
    requiresAuth: true,
  },
  [ActionCategory.COMMENT_LIKE]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.COMMENT_LIKE,
    severity: 'low',
    cost: 2,
    requiresAuth: true,
  },

  // Communities
  [ActionCategory.COMMUNITY_JOIN]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.COMMUNITY_JOIN,
    severity: 'medium',
    cost: 4,
    requiresAuth: true,
  },
  [ActionCategory.COMMUNITY_LEAVE]: {
    type: ActionType.SENSITIVE,
    category: ActionCategory.COMMUNITY_LEAVE,
    severity: 'low',
    cost: 2,
    requiresAuth: true,
  },
  [ActionCategory.COMMUNITY_CREATE]: {
    type: ActionType.CRITICAL,
    category: ActionCategory.COMMUNITY_CREATE,
    severity: 'high',
    cost: 10,
    requiresAuth: true,
    requiresVerification: true,
  },
  [ActionCategory.COMMUNITY_UPDATE]: {
    type: ActionType.WRITE,
    category: ActionCategory.COMMUNITY_UPDATE,
    severity: 'medium',
    cost: 5,
    requiresAuth: true,
  },
  [ActionCategory.COMMUNITY_DELETE]: {
    type: ActionType.CRITICAL,
    category: ActionCategory.COMMUNITY_DELETE,
    severity: 'critical',
    cost: 5,
    requiresAuth: true,
  },

  // Files
  [ActionCategory.FILE_UPLOAD]: {
    type: ActionType.WRITE,
    category: ActionCategory.FILE_UPLOAD,
    severity: 'medium',
    cost: 5, // 10 → 5로 완화
    requiresAuth: true,
    requiresVerification: true,
  },
  [ActionCategory.FILE_DOWNLOAD]: {
    type: ActionType.READ,
    category: ActionCategory.FILE_DOWNLOAD,
    severity: 'low',
    cost: 3,
    requiresAuth: false,
  },
  [ActionCategory.FILE_DELETE]: {
    type: ActionType.WRITE,
    category: ActionCategory.FILE_DELETE,
    severity: 'medium',
    cost: 2,
    requiresAuth: true,
  },

  // Admin
  [ActionCategory.ADMIN_USER_BAN]: {
    type: ActionType.ADMIN,
    category: ActionCategory.ADMIN_USER_BAN,
    severity: 'critical',
    cost: 5,
    requiresAuth: true,
    adminOnly: true,
  },
  [ActionCategory.ADMIN_USER_UNBAN]: {
    type: ActionType.ADMIN,
    category: ActionCategory.ADMIN_USER_UNBAN,
    severity: 'high',
    cost: 3,
    requiresAuth: true,
    adminOnly: true,
  },
  [ActionCategory.ADMIN_POST_APPROVE]: {
    type: ActionType.ADMIN,
    category: ActionCategory.ADMIN_POST_APPROVE,
    severity: 'medium',
    cost: 2,
    requiresAuth: true,
    adminOnly: true,
  },
  [ActionCategory.ADMIN_POST_REJECT]: {
    type: ActionType.ADMIN,
    category: ActionCategory.ADMIN_POST_REJECT,
    severity: 'medium',
    cost: 2,
    requiresAuth: true,
    adminOnly: true,
  },

  // Search
  [ActionCategory.SEARCH_POSTS]: {
    type: ActionType.READ,
    category: ActionCategory.SEARCH_POSTS,
    severity: 'low',
    cost: 3,
    requiresAuth: false,
  },
  [ActionCategory.SEARCH_USERS]: {
    type: ActionType.READ,
    category: ActionCategory.SEARCH_USERS,
    severity: 'low',
    cost: 3,
    requiresAuth: false,
  },
  [ActionCategory.SEARCH_COMMUNITIES]: {
    type: ActionType.READ,
    category: ActionCategory.SEARCH_COMMUNITIES,
    severity: 'low',
    cost: 3,
    requiresAuth: false,
  },
}

// Helper functions
export function getActionMetadata(category: ActionCategory): ActionMetadata {
  return ACTION_CONFIG[category]
}

export function getActionsByType(type: ActionType): ActionCategory[] {
  return Object.entries(ACTION_CONFIG)
    .filter(([, metadata]) => metadata.type === type)
    .map(([category]) => category as ActionCategory)
}

export function calculateActionCost(
  category: ActionCategory,
  trustScore: number = 0
): number {
  const metadata = ACTION_CONFIG[category]
  if (!metadata) return 10 // 알 수 없는 action은 최대 비용

  // 신뢰도에 따라 비용 조정 (0-1 범위)
  // 신뢰도가 높을수록 비용 감소
  const trustMultiplier = 1 - trustScore * 0.5 // 최대 50% 감소

  return Math.ceil(metadata.cost * trustMultiplier)
}

// URL to Action mapping helper
export function getActionFromPath(
  method: string,
  path: string
): ActionCategory | null {
  // URL 패턴과 메서드를 기반으로 액션 분류
  const patterns: Array<[RegExp, string, ActionCategory]> = [
    // Auth
    [/^\/api\/auth\/login/, 'POST', ActionCategory.AUTH_LOGIN],
    [/^\/api\/auth\/register/, 'POST', ActionCategory.AUTH_REGISTER],
    [
      /^\/api\/auth\/reset-password/,
      'POST',
      ActionCategory.AUTH_RESET_PASSWORD,
    ],

    // Main Posts
    [/^\/api\/main\/posts$/, 'GET', ActionCategory.POST_LIST],
    [/^\/api\/main\/posts$/, 'POST', ActionCategory.POST_CREATE],
    [/^\/api\/main\/posts\/[^\/]+$/, 'GET', ActionCategory.POST_READ],
    [/^\/api\/main\/posts\/[^\/]+$/, 'PUT', ActionCategory.POST_UPDATE],
    [/^\/api\/main\/posts\/[^\/]+$/, 'DELETE', ActionCategory.POST_DELETE],
    [/^\/api\/main\/posts\/[^\/]+\/like/, 'POST', ActionCategory.POST_LIKE],
    [/^\/api\/main\/posts\/[^\/]+\/like/, 'DELETE', ActionCategory.POST_UNLIKE],
    [
      /^\/api\/main\/posts\/[^\/]+\/bookmark/,
      'POST',
      ActionCategory.POST_BOOKMARK,
    ],
    [
      /^\/api\/main\/posts\/[^\/]+\/bookmark/,
      'DELETE',
      ActionCategory.POST_UNBOOKMARK,
    ],
    [/^\/api\/main\/posts\/[^\/]+\/view/, 'POST', ActionCategory.POST_VIEW],

    // Community Posts
    [/^\/api\/communities\/[^\/]+\/posts$/, 'GET', ActionCategory.POST_LIST],
    [/^\/api\/communities\/[^\/]+\/posts$/, 'POST', ActionCategory.POST_CREATE],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+$/,
      'GET',
      ActionCategory.POST_READ,
    ],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+$/,
      'PUT',
      ActionCategory.POST_UPDATE,
    ],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+$/,
      'DELETE',
      ActionCategory.POST_DELETE,
    ],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+\/like/,
      'POST',
      ActionCategory.POST_LIKE,
    ],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+\/like/,
      'DELETE',
      ActionCategory.POST_UNLIKE,
    ],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+\/bookmark/,
      'POST',
      ActionCategory.POST_BOOKMARK,
    ],
    [
      /^\/api\/communities\/[^\/]+\/posts\/[^\/]+\/bookmark/,
      'DELETE',
      ActionCategory.POST_UNBOOKMARK,
    ],

    // Comments
    [/^\/api\/.*\/comments$/, 'GET', ActionCategory.COMMENT_LIST],
    [/^\/api\/.*\/comments$/, 'POST', ActionCategory.COMMENT_CREATE],
    [/^\/api\/.*\/comments\/[^\/]+$/, 'PUT', ActionCategory.COMMENT_UPDATE],
    [/^\/api\/.*\/comments\/[^\/]+$/, 'DELETE', ActionCategory.COMMENT_DELETE],

    // Communities
    [/^\/api\/communities$/, 'POST', ActionCategory.COMMUNITY_CREATE],
    [/^\/api\/communities\/[^\/]+$/, 'PUT', ActionCategory.COMMUNITY_UPDATE],
    [/^\/api\/communities\/[^\/]+$/, 'DELETE', ActionCategory.COMMUNITY_DELETE],
    [
      /^\/api\/communities\/[^\/]+\/join/,
      'POST',
      ActionCategory.COMMUNITY_JOIN,
    ],
    [
      /^\/api\/communities\/[^\/]+\/leave/,
      'POST',
      ActionCategory.COMMUNITY_LEAVE,
    ],

    // Search
    [/^\/api\/search\/posts/, 'GET', ActionCategory.SEARCH_POSTS],
    [/^\/api\/search\/users/, 'GET', ActionCategory.SEARCH_USERS],
    [/^\/api\/search\/communities/, 'GET', ActionCategory.SEARCH_COMMUNITIES],

    // Files
    [/^\/api\/upload/, 'POST', ActionCategory.FILE_UPLOAD],
    [/^\/api\/download/, 'GET', ActionCategory.FILE_DOWNLOAD],
  ]

  for (const [pattern, expectedMethod, category] of patterns) {
    if (pattern.test(path) && method === expectedMethod) {
      return category
    }
  }

  // 기본값: 메서드에 따라 분류
  if (method === 'GET') return ActionCategory.POST_READ
  if (method === 'POST' || method === 'PUT') return ActionCategory.POST_CREATE
  if (method === 'DELETE') return ActionCategory.POST_DELETE

  return null
}
