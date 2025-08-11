import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI } from '@/lib/auth/session'
import {
  CommunityVisibility,
  CommunityRole,
  MembershipStatus,
} from '@prisma/client'
import {
  paginatedResponse,
  errorResponse,
  createdResponse,
  successResponse,
} from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { withSecurity } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'
import { getAvatarFromName } from '@/lib/community/utils'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import {
  parseHybridPagination,
  getCursorCondition,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/post/pagination'
import { communitySelect } from '@/lib/cache/patterns'
import { createCommunitySchema } from '@/lib/validations/community'
import { handleZodError } from '@/lib/api/validation-error'

// GET: 커뮤니티 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)
    const search = searchParams.get('search') || ''
    const visibility = searchParams.get('visibility') as
      | 'PUBLIC'
      | 'PRIVATE'
      | null

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('communities:list', {
      ...pagination,
      search: search || 'all',
      visibility: visibility || 'all',
    })

    // Redis 캐싱 적용 - 커뮤니티 목록은 5분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 검색 조건 구성
        const where: {
          OR?: Array<{
            name?: { contains: string; mode: 'insensitive' }
            description?: { contains: string; mode: 'insensitive' }
          }>
          visibility?: CommunityVisibility
        } = {}

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }

        if (
          visibility &&
          Object.values(CommunityVisibility).includes(
            visibility as CommunityVisibility
          )
        ) {
          where.visibility = visibility as CommunityVisibility
        }

        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          const cursorWhere = {
            ...where,
            ...getCursorCondition(pagination.cursor),
          }

          const communities = await prisma.community.findMany({
            where: cursorWhere,
            select: communitySelect.list,
            orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
            take: getCursorTake(pagination.limit),
          })

          const total = await prisma.community.count({ where })
          const cursorResponse = formatCursorResponse(
            communities,
            pagination.limit
          )

          return {
            items: cursorResponse.items,
            total,
            nextCursor: cursorResponse.nextCursor,
            hasMore: cursorResponse.hasMore,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit

          // 커뮤니티 목록 조회
          const [communities, total] = await Promise.all([
            prisma.community.findMany({
              where,
              skip,
              take: pagination.limit,
              orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
              select: communitySelect.list,
            }),
            prisma.community.count({ where }),
          ])

          return {
            items: communities,
            totalCount: total,
          }
        }
      },
      REDIS_TTL.API_MEDIUM // 5분 캐싱
    )

    // 응답 생성
    if (pagination.type === 'cursor') {
      return successResponse({
        items: cachedData.items,
        pagination: {
          limit: pagination.limit,
          nextCursor: cachedData.nextCursor,
          hasMore: cachedData.hasMore,
          total: cachedData.total,
        },
      })
    } else {
      return paginatedResponse(
        cachedData.items,
        pagination.page,
        pagination.limit,
        cachedData.totalCount || 0
      )
    }
  } catch (error) {
    return handleError(error)
  }
}

// POST: 커뮤니티 생성
async function createCommunity(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Promise<Record<string, string | string[]>> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    console.error('요청 받은 데이터:', body)

    const validation = createCommunitySchema.safeParse(body)

    if (!validation.success) {
      console.error('유효성 검사 실패:', validation.error.issues)
      return handleZodError(validation.error)
    }

    const {
      name,
      slug,
      description,
      rules,
      avatar,
      banner,
      visibility,
      allowFileUpload,
      allowChat,
      maxFileSize,
    } = validation.data

    // 중복 체크
    const existingCommunity = await prisma.community.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existingCommunity) {
      return errorResponse('이미 존재하는 커뮤니티 이름 또는 URL입니다.', 400)
    }

    // session.user.id는 checkAuth에서 이미 확인됨
    const userId = session.user.id

    // avatar가 없으면 자동 생성
    const defaultAvatar = !avatar ? getAvatarFromName(name) : null
    const finalAvatar =
      avatar || (defaultAvatar ? `default:${defaultAvatar.name}` : '')

    // 커뮤니티 생성
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description,
        rules,
        avatar: finalAvatar,
        banner,
        visibility,
        allowFileUpload,
        allowChat,
        maxFileSize,
        ownerId: userId,
        // 생성자를 자동으로 OWNER 멤버로 추가
        members: {
          create: {
            userId: userId,
            role: CommunityRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        },
        // 기본 카테고리 생성
        categories: {
          create: [
            {
              name: '일반',
              slug: 'general',
              order: 0,
              isActive: true,
            },
            {
              name: '공지사항',
              slug: 'announcements',
              order: 1,
              isActive: true,
            },
          ],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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
    })

    // memberCount 업데이트
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: 1 },
    })

    // Redis 캐시 무효화 - 커뮤니티 목록 캐시 삭제
    await redisCache.delPattern('api:cache:communities:*')
    await redisCache.delPattern('api:cache:community:active:*')

    return createdResponse(community, '커뮤니티가 생성되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// 통합 보안 미들웨어 적용 - 커뮤니티 생성은 분당 3회로 제한
export const POST = withSecurity(createCommunity, {
  action: ActionCategory.COMMUNITY_CREATE,
  requireCSRF: true,
})
