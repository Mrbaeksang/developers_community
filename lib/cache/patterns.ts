/**
 * Prisma 선택적 필드 로딩 패턴
 * 리스트와 상세 조회에 최적화된 필드 선택
 */

// 메인 게시글 필드 선택 패턴
export const mainPostSelect = {
  // 리스트용 - 최소 필드만 선택
  list: {
    id: true,
    title: true,
    slug: true,
    content: true, // 검색 결과 표시용
    excerpt: true,
    createdAt: true,
    isPinned: true,
    viewCount: true,
    likeCount: true,
    commentCount: true,
    author: {
      select: {
        id: true,
        name: true,
        username: true, // 검색 결과 표시용
        image: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
      },
    },
    tags: {
      select: {
        tag: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    },
    _count: {
      select: {
        comments: true,
        likes: true,
        bookmarks: true,
      },
    },
  },

  // 상세 조회용 - 모든 필드
  detail: {
    id: true,
    title: true,
    slug: true,
    content: true,
    excerpt: true,
    status: true,
    isPinned: true,
    createdAt: true,
    updatedAt: true,
    viewCount: true,
    likeCount: true,
    commentCount: true,
    author: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
        description: true,
      },
    },
    tags: {
      select: {
        tag: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    },
    _count: {
      select: {
        comments: true,
        likes: true,
        bookmarks: true,
      },
    },
  },
}

// 커뮤니티 카테고리 필드 선택 패턴
export const communityCategorySelect = {
  // 리스트용
  list: {
    id: true,
    name: true,
    slug: true,
    description: true,
    color: true,
    icon: true,
    order: true,
    isActive: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },

  // 상세 조회용
  detail: {
    id: true,
    name: true,
    slug: true,
    description: true,
    color: true,
    icon: true,
    order: true,
    isActive: true,
    communityId: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },
}

// 커뮤니티 게시글 필드 선택 패턴
export const communityPostSelect = {
  // 리스트용
  list: {
    id: true,
    title: true,
    content: true, // 커뮤니티는 excerpt 없음
    createdAt: true,
    isPinned: true,
    viewCount: true,
    author: {
      select: {
        id: true,
        name: true,
        username: true, // 검색 결과 표시용
        image: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
      },
    },
    _count: {
      select: {
        comments: true,
        likes: true,
        bookmarks: true,
      },
    },
  },

  // 상세 조회용
  detail: {
    id: true,
    title: true,
    content: true,
    status: true,
    isPinned: true,
    createdAt: true,
    updatedAt: true,
    communityId: true,
    author: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
        description: true,
      },
    },
    attachments: {
      select: {
        id: true,
        url: true,
        filename: true,
        size: true,
        mimeType: true,
      },
    },
    _count: {
      select: {
        comments: true,
        likes: true,
        bookmarks: true,
      },
    },
  },
}

// 커뮤니티 필드 선택 패턴
export const communitySelect = {
  // 리스트용
  list: {
    id: true,
    name: true,
    slug: true,
    description: true,
    avatar: true,
    banner: true,
    visibility: true,
    createdAt: true,
    updatedAt: true,
    owner: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    _count: {
      select: {
        members: true,
        posts: true,
      },
    },
  },

  // 상세 조회용
  detail: {
    id: true,
    name: true,
    slug: true,
    description: true,
    avatar: true,
    banner: true,
    visibility: true,
    allowFileUpload: true,
    allowChat: true,
    maxFileSize: true,
    createdAt: true,
    updatedAt: true,
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    },
    _count: {
      select: {
        members: true,
        posts: true,
        categories: true,
        announcements: true,
      },
    },
  },
}

// 북마크 필드 선택 패턴
export const bookmarkSelect = {
  // 리스트용 - 연관된 게시글 정보 포함
  list: {
    id: true,
    createdAt: true,
    post: {
      select: mainPostSelect.list,
    },
  },
}

// 커뮤니티 댓글 필드 선택 패턴
export const communityCommentSelect = {
  // 리스트용 (계층 구조)
  list: {
    id: true,
    content: true,
    isEdited: true,
    createdAt: true,
    updatedAt: true,
    authorRole: true,
    author: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    replies: {
      select: {
        id: true,
        content: true,
        isEdited: true,
        createdAt: true,
        updatedAt: true,
        authorRole: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    },
  },
}

// 알림 필드 선택 패턴
export const notificationSelect = {
  // 리스트용
  list: {
    id: true,
    type: true,
    title: true,
    message: true,
    isRead: true,
    createdAt: true,
    resourceIds: true,
    sender: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
  },
}

// 사용자 필드 선택 패턴
export const userSelect = {
  // 기본 정보
  basic: {
    id: true,
    name: true,
    image: true,
  },

  // 프로필용
  profile: {
    id: true,
    name: true,
    username: true,
    email: true,
    image: true,
    globalRole: true,
    bio: true,
    showEmail: true,
    createdAt: true,
    isActive: true,
    isBanned: true,
    _count: {
      select: {
        mainPosts: true,
        mainComments: true,
        mainLikes: true,
        communityPosts: true,
        communityComments: true,
        communityLikes: true,
        ownedCommunities: true,
        communityMemberships: true,
      },
    },
  },
}

// 커뮤니티 멤버 필드 선택 패턴
export const communityMemberSelect = {
  // 리스트용
  list: {
    id: true,
    userId: true,
    role: true,
    status: true,
    joinedAt: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
      },
    },
  },
}

// Category patterns
export const categorySelect = {
  // 목록용 (가벼운 버전)
  list: {
    id: true,
    name: true,
    slug: true,
    description: true,
    color: true,
    icon: true,
    order: true,
    isActive: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },

  // 상세용 (모든 필드)
  detail: {
    id: true,
    name: true,
    slug: true,
    description: true,
    color: true,
    icon: true,
    order: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },
}

// Tag patterns
export const tagSelect = {
  // 목록용
  list: {
    id: true,
    name: true,
    slug: true,
    color: true,
    postCount: true,
  },

  // 상세용
  detail: {
    id: true,
    name: true,
    slug: true,
    color: true,
    description: true,
    postCount: true,
    createdAt: true,
    updatedAt: true,
  },
}

/**
 * Include 패턴을 Select 패턴으로 변환하는 헬퍼
 * 기존 코드와의 호환성 유지
 */
export function convertIncludeToSelect(
  includePattern: Record<string, unknown>
): Record<string, unknown> {
  // include: { author: true } → select: { author: { select: userSelect.basic } }
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(includePattern)) {
    if (value === true) {
      // 기본 선택 패턴 적용
      switch (key) {
        case 'author':
          result[key] = { select: userSelect.basic }
          break
        case 'category':
          result[key] = {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          }
          break
        case 'tags':
          result[key] = {
            select: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          }
          break
        default:
          result[key] = value
      }
    } else {
      result[key] = value
    }
  }

  return result
}
