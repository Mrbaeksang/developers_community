import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MembershipStatus } from '@prisma/client'
import { paginatedResponse } from '@/lib/api-response'
import { handleError, throwNotFoundError } from '@/lib/error-handler'

// GET: 사용자가 가입한 커뮤니티 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as MembershipStatus | null

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      throwNotFoundError('사용자를 찾을 수 없습니다')
    }

    // 쿼리 조건 설정
    const where: {
      userId: string
      status?: MembershipStatus
    } = {
      userId: id,
    }

    // 상태 필터 (기본값: ACTIVE)
    if (status && Object.values(MembershipStatus).includes(status)) {
      where.status = status
    } else {
      where.status = MembershipStatus.ACTIVE
    }

    // 커뮤니티 멤버십 조회
    const [memberships, total] = await Promise.all([
      prisma.communityMember.findMany({
        where,
        include: {
          community: {
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
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.communityMember.count({ where }),
    ])

    // 응답 형식 변환
    const communities = memberships.map((membership) => ({
      ...membership.community,
      membershipRole: membership.role,
      membershipStatus: membership.status,
      joinedAt: membership.joinedAt,
    }))

    return paginatedResponse(communities, total, page, limit)
  } catch (error) {
    return handleError(error)
  }
}
