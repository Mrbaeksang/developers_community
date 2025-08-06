import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { getSession, canAccessPrivateCommunity } from '@/lib/auth/session'
import {
  CommunityVisibility,
  MembershipStatus,
  CommunityRole,
} from '@prisma/client'
import { paginatedResponse, successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/api/errors'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { parseHybridPagination, getCursorTake } from '@/lib/post/pagination'

// GET: 커뮤니티 멤버 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getSession()
    const searchParams = req.nextUrl.searchParams

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'ACTIVE'

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: { id: true, visibility: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 비공개 커뮤니티 접근 확인
    if (community.visibility === CommunityVisibility.PRIVATE) {
      const canAccess = await canAccessPrivateCommunity(session?.user?.id, id)
      if (!canAccess) {
        throwAuthorizationError('비공개 커뮤니티입니다')
      }
    }

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('community:members', {
      communityId: id,
      ...pagination,
      role: role || 'all',
      search: search || 'none',
      status,
      userId: session?.user?.id || 'anonymous',
    })

    // Redis 캐싱 적용 - 멤버 목록은 3분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 멤버 필터 조건
        const where: {
          communityId: string
          status: MembershipStatus
          role?: CommunityRole
          user?: {
            OR: Array<{
              name?: { contains: string; mode: 'insensitive' }
              username?: { contains: string; mode: 'insensitive' }
            }>
          }
        } = {
          communityId: id,
          status:
            status === 'PENDING'
              ? MembershipStatus.PENDING
              : MembershipStatus.ACTIVE,
        }

        if (
          role &&
          Object.values(CommunityRole).includes(role as CommunityRole)
        ) {
          where.role = role as CommunityRole
        }

        if (search) {
          where.user = {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          }
        }

        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          // joinedAt 필드용 커서 조건
          const cursorCondition = pagination.cursor
            ? {
                joinedAt: { lt: new Date(pagination.cursor) },
              }
            : {}

          const cursorWhere = {
            ...where,
            ...cursorCondition,
          }

          const members = await prisma.communityMember.findMany({
            where: cursorWhere,
            orderBy: [
              { role: 'asc' }, // OWNER -> ADMIN -> MODERATOR -> MEMBER 순
              { joinedAt: 'desc' },
            ],
            take: getCursorTake(pagination.limit),
            select: {
              id: true,
              userId: true,
              role: true,
              status: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                  image: true,
                  bio: true,
                  _count: {
                    select: {
                      communityPosts: {
                        where: {
                          communityId: id,
                        },
                      },
                      communityComments: {
                        where: {
                          post: {
                            communityId: id,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })

          const total = await prisma.communityMember.count({ where })

          // joinedAt 기준으로 커서 응답 생성
          const hasMore = members.length > pagination.limit
          const resultMembers = hasMore ? members.slice(0, -1) : members

          const cursorResponse = {
            items: resultMembers,
            nextCursor:
              hasMore && resultMembers.length > 0
                ? resultMembers[resultMembers.length - 1].joinedAt.toISOString()
                : null,
            hasMore,
          }

          // 멤버 정보 포맷팅 (커서 응답용)
          const formattedCursorMembers = cursorResponse.items.map((member) => ({
            id: member.id,
            userId: member.userId,
            role: member.role,
            status: member.status,
            joinedAt: member.joinedAt.toISOString(),
            user: {
              id: member.user.id,
              name: member.user.name || undefined,
              username: member.user.username || undefined,
              email: member.user.email,
              image: member.user.image || undefined,
              bio: member.user.bio || undefined,
              postCount: member.user._count.communityPosts,
              commentCount: member.user._count.communityComments,
            },
          }))

          return {
            items: formattedCursorMembers,
            total,
            nextCursor: cursorResponse.nextCursor,
            hasMore: cursorResponse.hasMore,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit

          const [members, total] = await Promise.all([
            prisma.communityMember.findMany({
              where,
              orderBy: [
                { role: 'asc' }, // OWNER -> ADMIN -> MODERATOR -> MEMBER 순
                { joinedAt: 'asc' },
              ],
              skip,
              take: pagination.limit,
              select: {
                id: true,
                userId: true,
                role: true,
                status: true,
                joinedAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    image: true,
                    bio: true,
                    _count: {
                      select: {
                        communityPosts: {
                          where: {
                            communityId: id,
                          },
                        },
                        communityComments: {
                          where: {
                            post: {
                              communityId: id,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),
            prisma.communityMember.count({ where }),
          ])

          // 멤버 정보 포맷팅 (오프셋 응답용)
          const formattedOffsetMembers = members.map((member) => ({
            id: member.id,
            userId: member.userId,
            role: member.role,
            status: member.status,
            joinedAt: member.joinedAt.toISOString(),
            user: {
              id: member.user.id,
              name: member.user.name || undefined,
              username: member.user.username || undefined,
              email: member.user.email,
              image: member.user.image || undefined,
              bio: member.user.bio || undefined,
              postCount: member.user._count.communityPosts,
              commentCount: member.user._count.communityComments,
            },
          }))

          return {
            items: formattedOffsetMembers,
            totalCount: total,
          }
        }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
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
