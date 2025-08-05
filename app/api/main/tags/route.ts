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
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:tags:popular', {
      limit,
      cursor: cursor || 'none',
    })

    // Redis 캐싱 적용 - 인기 태그는 자주 변하지 않으므로 1시간 캐싱
    const cachedTags = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 커서 조건 설정
        const cursorCondition = cursor
          ? {
              postCount: { lt: parseInt(cursor) },
            }
          : {}

        // postCount로 정렬하여 인기 태그 조회
        const tags = await prisma.mainTag.findMany({
          where: {
            postCount: { gt: 0 }, // 게시글이 있는 태그만
            ...cursorCondition,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            postCount: true,
            color: true,
            description: true,
          },
          orderBy: [
            { postCount: 'desc' },
            { name: 'asc' }, // 동일 카운트일 경우 이름순
          ],
          take: limit + 1, // hasMore 체크용
        })

        // 페이지네이션 처리
        const hasMore = tags.length > limit
        const resultTags = hasMore ? tags.slice(0, -1) : tags

        // 다음 커서 생성
        const nextCursor =
          hasMore && resultTags.length > 0
            ? resultTags[resultTags.length - 1].postCount.toString()
            : null

        return {
          tags: resultTags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            count: tag.postCount,
            color: tag.color,
            description: tag.description || undefined,
          })),
          nextCursor,
          hasMore,
        }
      },
      REDIS_TTL.API_LONG // 1시간 캐싱
    )

    return successResponse({
      items: cachedTags.tags,
      pagination: {
        limit,
        nextCursor: cachedTags.nextCursor,
        hasMore: cachedTags.hasMore,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// 태그 생성 (관리자/모더레이터만 가능)
export async function POST(request: Request) {
  try {
    const session = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (session instanceof NextResponse) {
      return session
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name?.trim()) {
      return errorResponse('태그 이름은 필수입니다.', 400)
    }

    // 슬러그 생성 (한글 지원)
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^가-힣a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 중복 확인
    const existing = await prisma.mainTag.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
      },
    })

    if (existing) {
      return errorResponse('이미 존재하는 태그입니다.', 409)
    }

    const tag = await prisma.mainTag.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim(),
        color: color || '#64748b',
      },
    })

    // Redis 캐시 무효화 - 인기 태그 캐시 삭제
    await redisCache.delPattern('api:cache:main:tags:popular:*')

    return createdResponse({ tag })
  } catch (error) {
    return handleError(error)
  }
}
