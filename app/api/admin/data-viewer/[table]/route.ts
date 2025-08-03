import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import { handleError, throwValidationError } from '@/lib/error-handler'

// Prisma 모델명 매핑 (camelCase)
const TABLE_MAP: Record<string, string> = {
  User: 'user',
  Account: 'account',
  Session: 'session',
  MainCategory: 'mainCategory',
  MainPost: 'mainPost',
  MainComment: 'mainComment',
  MainTag: 'mainTag',
  MainPostTag: 'mainPostTag',
  MainLike: 'mainLike',
  MainBookmark: 'mainBookmark',
  Community: 'community',
  CommunityCategory: 'communityCategory',
  CommunityMember: 'communityMember',
  CommunityPost: 'communityPost',
  CommunityComment: 'communityComment',
  CommunityLike: 'communityLike',
  CommunityBookmark: 'communityBookmark',
  CommunityAnnouncement: 'communityAnnouncement',
  Notification: 'notification',
  File: 'file',
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (result instanceof Response) return result

    const { table } = await context.params
    const modelName = TABLE_MAP[table]

    if (!modelName) {
      throwValidationError('Invalid table')
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const limit = 50

    // 검색 조건 구성 (id나 name 필드가 있는 경우)
    let where = {}
    if (search) {
      // 간단한 검색 구현 (id, name, email, title 등 일반적인 필드)
      const searchFields = []

      // 각 모델별 검색 가능한 필드 정의
      if (['user'].includes(modelName)) {
        searchFields.push({ email: { contains: search, mode: 'insensitive' } })
        searchFields.push({ name: { contains: search, mode: 'insensitive' } })
      } else if (['mainPost', 'communityPost'].includes(modelName)) {
        searchFields.push({ title: { contains: search, mode: 'insensitive' } })
      } else if (
        ['mainCategory', 'communityCategory', 'mainTag'].includes(modelName)
      ) {
        searchFields.push({ name: { contains: search, mode: 'insensitive' } })
      } else if (['community'].includes(modelName)) {
        searchFields.push({ name: { contains: search, mode: 'insensitive' } })
      } else if (['mainComment', 'communityComment'].includes(modelName)) {
        searchFields.push({
          content: { contains: search, mode: 'insensitive' },
        })
      }

      if (searchFields.length > 0) {
        where = { OR: searchFields }
      } else {
        // ID로 검색 시도
        if (search.length === 24 || search.length === 36) {
          // MongoDB ObjectId or UUID
          where = { id: search }
        }
      }
    }

    // 전체 개수 조회
    // @ts-expect-error Prisma dynamic model access
    const total = await prisma[modelName].count({ where })

    // 정렬 필드 결정
    let orderBy: Record<string, 'desc' | 'asc'> = {}

    // createdAt이 없는 테이블들
    if (['session'].includes(modelName)) {
      orderBy = { expires: 'desc' }
    } else if (['account'].includes(modelName)) {
      orderBy = { userId: 'desc' }
    } else if (['mainPostTag'].includes(modelName)) {
      orderBy = { postId: 'desc' }
    } else if (['mainCategory', 'communityCategory'].includes(modelName)) {
      // 카테고리는 order 필드로 정렬
      orderBy = { order: 'asc' }
    } else if (modelName === 'mainTag') {
      // MainTag는 postCount로 정렬 (인기순)
      orderBy = { postCount: 'desc' }
    } else if (['communityMember'].includes(modelName)) {
      // 커뮤니티 멤버는 joinedAt으로 정렬
      orderBy = { joinedAt: 'desc' }
    } else {
      // 대부분의 테이블은 createdAt 필드가 있음
      orderBy = { createdAt: 'desc' }
    }

    // 데이터 조회 - 관계 데이터 포함
    let includeRelations = {}

    // MainPost인 경우 카테고리 정보 포함
    if (modelName === 'mainPost') {
      includeRelations = {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      }
    }
    // CommunityPost인 경우 커뮤니티와 카테고리 정보 포함
    else if (modelName === 'communityPost') {
      includeRelations = {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      }
    }
    // MainComment인 경우 작성자와 게시글 정보 포함
    else if (modelName === 'mainComment') {
      includeRelations = {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
          },
        },
      }
    }
    // CommunityComment인 경우 작성자와 게시글 정보 포함
    else if (modelName === 'communityComment') {
      includeRelations = {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
          },
        },
      }
    }
    // MainTag인 경우 게시글 수 정보만 포함
    else if (modelName === 'mainTag') {
      includeRelations = {
        _count: {
          select: {
            posts: true,
          },
        },
      }
    }
    // MainPostTag인 경우 게시글과 태그 정보 포함
    else if (modelName === 'mainPostTag') {
      includeRelations = {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      }
    }
    // MainLike인 경우 사용자와 게시글 정보 포함
    else if (modelName === 'mainLike') {
      includeRelations = {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      }
    }
    // MainBookmark인 경우 사용자와 게시글 정보 포함
    else if (modelName === 'mainBookmark') {
      includeRelations = {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      }
    }
    // CommunityCategory인 경우 커뮤니티 정보 포함
    else if (modelName === 'communityCategory') {
      includeRelations = {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      }
    }

    // @ts-expect-error Prisma dynamic model access
    const data = await prisma[modelName].findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy,
      ...(Object.keys(includeRelations).length > 0 && {
        include: includeRelations,
      }),
    })

    // 컬럼 추출 및 재정렬
    let columns = data.length > 0 ? Object.keys(data[0]) : []

    // 컬럼 순서 재정렬
    const columnOrder = [
      'id',
      'title',
      'name',
      'email',
      'content',
      'excerpt',
      'slug',
      'status',
      'author',
      'authorId',
      'post',
      'postId',
      'parent',
      'parentId',
      'category',
      'categoryId',
      'community',
      'communityId',
      'isPinned',
      'viewCount',
      'likeCount',
      'commentCount',
      'authorRole',
      'globalRole',
      'role',
      'metaTitle',
      'metaDescription',
      'approvedAt',
      'approvedById',
      'rejectedReason',
      'isEdited',
      // 날짜 필드는 맨 뒤로
      'createdAt',
      'updatedAt',
      'joinedAt',
      'leftAt',
      'bannedAt',
      'bannedUntil',
      'emailVerified',
      'expires',
    ]

    // 정렬된 컬럼 배열 생성
    const sortedColumns = []

    // 먼저 정렬 순서에 있는 컬럼들 추가
    for (const col of columnOrder) {
      if (columns.includes(col)) {
        sortedColumns.push(col)
      }
    }

    // 정렬 순서에 없는 나머지 컬럼들 추가
    for (const col of columns) {
      if (!sortedColumns.includes(col)) {
        sortedColumns.push(col)
      }
    }

    columns = sortedColumns

    return successResponse({
      data,
      columns,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    return handleError(error)
  }
}
