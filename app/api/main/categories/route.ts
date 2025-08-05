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

export async function GET() {
  try {
    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:categories:active', {})

    // Redis 캐싱 적용 - 카테고리는 자주 변경되지 않으므로 1시간 캐싱
    const cachedCategories = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const categories = await prisma.mainCategory.findMany({
          where: {
            isActive: true, // 활성화된 카테고리만 조회
          },
          orderBy: {
            order: 'asc', // order 필드로 정렬
          },
          include: {
            _count: {
              select: {
                posts: true,
              },
            },
          },
        })

        return categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color, // DB의 color 필드 추가
          icon: category.icon, // DB의 icon 필드 추가
          postCount: category._count.posts,
        }))
      },
      REDIS_TTL.API_LONG // 1시간 캐싱
    )

    return successResponse(cachedCategories)
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
