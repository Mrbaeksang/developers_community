import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, canAccessPrivateCommunity } from '@/lib/auth-utils'
import {
  CommunityVisibility,
  MembershipStatus,
  CommunityRole,
} from '@prisma/client'
import { paginatedResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'

// GET: 커뮤니티 멤버 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getSession()
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
      page,
      limit,
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

        // 멤버 조회
        const [members, total] = await Promise.all([
          prisma.communityMember.findMany({
            where,
            orderBy: [
              { role: 'asc' }, // OWNER -> ADMIN -> MODERATOR -> MEMBER 순
              { joinedAt: 'asc' },
            ],
            skip: (page - 1) * limit,
            take: limit,
            include: {
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

        // 멤버 정보 포맷팅
        const formattedMembers = members.map((member) => ({
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
          items: formattedMembers,
          totalCount: total,
        }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    return paginatedResponse(
      cachedData.items,
      page,
      limit,
      cachedData.totalCount
    )
  } catch (error) {
    return handleError(error)
  }
}
