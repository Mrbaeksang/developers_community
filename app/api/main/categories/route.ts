import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import {
  successResponse,
  errorResponse,
  createdResponse,
} from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:categories:list', {
      limit,
      cursor: cursor || 'none',
      includeInactive,
    })

    // Redis 캐싱 적용 - 카테고리는 자주 변경되지 않으므로 1시간 캐싱
    const cachedCategories = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 커서 조건 설정 (order 필드 기준)
        const cursorCondition = cursor
          ? {
              order: { gt: parseInt(cursor) },
            }
          : {}

        // 카테고리 조회 - select 패턴 사용
        const categories = await prisma.mainCategory.findMany({
          where: {
            ...(!includeInactive && { isActive: true }),
            ...cursorCondition,
          },
          select: {
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
                posts: {
                  where: !includeInactive ? { status: 'PUBLISHED' } : undefined,
                },
              },
            },
          },
          orderBy: [
            { order: 'asc' },
            { name: 'asc' }, // order가 같을 경우 이름순
          ],
          take: limit + 1, // hasMore 체크용
        })

        // 페이지네이션 처리
        const hasMore = categories.length > limit
        const resultCategories = hasMore ? categories.slice(0, -1) : categories

        // 다음 커서 생성
        const nextCursor =
          hasMore && resultCategories.length > 0
            ? resultCategories[resultCategories.length - 1].order.toString()
            : null

        return {
          categories: resultCategories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || undefined,
            color: category.color,
            icon: category.icon || undefined,
            order: category.order,
            isActive: category.isActive,
            postCount: category._count.posts,
          })),
          nextCursor,
          hasMore,
        }
      },
      REDIS_TTL.API_LONG // 1시간 캐싱
    )

    return successResponse({
      items: cachedCategories.categories,
      pagination: {
        limit,
        nextCursor: cachedCategories.nextCursor,
        hasMore: cachedCategories.hasMore,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// 카테고리 생성 (관리자만)
export async function POST(req: Request) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result

    const body = await req.json()
    const { name, slug, description, color, icon, order, isActive } = body

    // 필수 필드 검증
    if (!name || !slug) {
      return errorResponse('이름과 슬러그는 필수입니다.', 400)
    }

    // 중복 확인
    const existing = await prisma.mainCategory.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existing) {
      return errorResponse('이미 존재하는 카테고리입니다.', 400)
    }

    const category = await prisma.mainCategory.create({
      data: {
        name,
        slug,
        description,
        color: color || '#6366f1',
        icon,
        order: order || 0,
        isActive: isActive ?? true,
      },
    })

    // Redis 캐시 무효화 - 카테고리 목록 캐시 삭제
    await redisCache.delPattern('api:cache:main:categories:*')

    return createdResponse(category)
  } catch (error) {
    return handleError(error)
  }
}
