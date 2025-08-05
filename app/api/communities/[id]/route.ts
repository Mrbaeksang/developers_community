import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { CommunityVisibility, MembershipStatus } from '@prisma/client'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'

// GET: 커뮤니티 상세 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // Redis 캐시 키 생성 - 사용자별로 다른 캐시 사용 (비공개 커뮤니티 때문)
    const cacheKey = generateCacheKey('community:detail', {
      id,
      userId: session?.user?.id || 'anonymous',
    })

    // Redis 캐싱 적용 - 커뮤니티 상세는 10분 캐싱
    const cachedCommunity = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 커뮤니티 조회 - id로 먼저 찾고, 없으면 slug로 찾기
        let community = await prisma.community.findUnique({
          where: { id },
          include: {
            owner: {
              select: { id: true, name: true, email: true, image: true },
            },
            categories: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                color: true,
                icon: true,
              },
            },
            announcements: {
              orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
              take: 10,
              select: {
                id: true,
                title: true,
                content: true,
                isPinned: true,
                createdAt: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                  },
                },
              },
            },
            _count: {
              select: {
                members: {
                  where: {
                    status: MembershipStatus.ACTIVE,
                  },
                },
                posts: true,
              },
            },
            // 현재 사용자의 멤버십 상태 확인
            members: session?.user?.id
              ? {
                  where: { userId: session.user.id },
                  select: { role: true, status: true },
                }
              : false,
          },
        })

        if (!community) {
          // slug로 다시 시도
          community = await prisma.community.findUnique({
            where: { slug: id },
            include: {
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
              categories: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  color: true,
                  icon: true,
                },
              },
              announcements: {
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
                take: 10,
                select: {
                  id: true,
                  title: true,
                  content: true,
                  isPinned: true,
                  createdAt: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      image: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  members: {
                    where: {
                      status: MembershipStatus.ACTIVE,
                    },
                  },
                  posts: true,
                },
              },
              // 현재 사용자의 멤버십 상태 확인
              members: session?.user?.id
                ? {
                    where: { userId: session.user.id },
                    select: { role: true, status: true },
                  }
                : false,
            },
          })

          if (!community) {
            throwNotFoundError('커뮤니티를 찾을 수 없습니다')
          }
        }

        // 비공개 커뮤니티 접근 제한
        if (community.visibility === CommunityVisibility.PRIVATE) {
          if (session?.user?.id) {
            // 로그인한 경우, 멤버십 확인
            const membership = await prisma.communityMember.findUnique({
              where: {
                userId_communityId: {
                  userId: session.user.id,
                  communityId: community.id,
                },
              },
              select: { status: true },
            })
            // 멤버가 아니고 오너도 아닌 경우
            if (
              (!membership || membership.status !== 'ACTIVE') &&
              community.ownerId !== session.user.id
            ) {
              throwAuthorizationError('비공개 커뮤니티입니다')
            }
          } else {
            // 로그인하지 않은 경우
            throwAuthorizationError('비공개 커뮤니티입니다')
          }
        }

        // 현재 사용자의 멤버십 정보 추출
        const currentMembership =
          'members' in community && Array.isArray(community.members)
            ? community.members[0] || null
            : null

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { members, ...communityData } = community

        // 공지사항 가져오기 (고정된 것들만)
        const announcements = await prisma.communityAnnouncement.findMany({
          where: {
            communityId: community.id,
            isPinned: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        })

        return {
          ...communityData,
          currentMembership,
          announcements,
          isOwner: session?.user?.id === community.ownerId,
          isMember: currentMembership?.status === MembershipStatus.ACTIVE,
          canPost:
            currentMembership?.status === MembershipStatus.ACTIVE ||
            session?.user?.id === community.ownerId,
        }
      },
      REDIS_TTL.API_MEDIUM * 2 // 10분 캐싱
    )

    return successResponse(cachedCommunity)
  } catch (error) {
    return handleError(error)
  }
}

// PUT: 커뮤니티 수정 (소유자만)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 커뮤니티 소유자 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // OWNER만 수정 가능
    if (community.ownerId !== session.user.id) {
      throwAuthorizationError('커뮤니티 소유자만 설정을 변경할 수 있습니다')
    }

    const body = await req.json()
    const { name, description, rules, visibility, allowFileUpload, allowChat } =
      body

    // 커뮤니티 업데이트
    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: {
        name,
        description,
        rules,
        visibility,
        allowFileUpload,
        allowChat,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: { members: true, posts: true, announcements: true },
        },
      },
    })

    // Redis 캐시 무효화 - 해당 커뮤니티 상세 캐시 삭제
    await redisCache.delPattern(`api:cache:community:detail:*id*${id}*`)
    await redisCache.delPattern('api:cache:communities:active:*')

    return successResponse(updatedCommunity, '커뮤니티가 수정되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// DELETE: 커뮤니티 삭제 (소유자만)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 커뮤니티 및 사용자 정보 조회
    const [community, user] = await Promise.all([
      prisma.community.findUnique({
        where: { id },
        select: { ownerId: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { globalRole: true },
      }),
    ])

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 커뮤니티 소유자 또는 사이트 관리자만 삭제 가능
    const isOwner = community.ownerId === session.user.id
    const isGlobalAdmin = user?.globalRole === 'ADMIN'

    if (!isOwner && !isGlobalAdmin) {
      throwAuthorizationError('커뮤니티를 삭제할 권한이 없습니다')
    }

    // 커뮤니티 삭제
    await prisma.community.delete({
      where: { id },
    })

    // Redis 캐시 무효화 - 해당 커뮤니티 관련 모든 캐시 삭제
    await redisCache.delPattern(`api:cache:community:detail:*id*${id}*`)
    await redisCache.delPattern(`api:cache:community:posts:*communityId*${id}*`)
    await redisCache.delPattern('api:cache:communities:active:*')

    return successResponse({ deleted: true }, '커뮤니티가 삭제되었습니다')
  } catch (error) {
    return handleError(error)
  }
}
