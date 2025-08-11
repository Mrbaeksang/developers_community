import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth/session'
import {
  errorResponse,
  paginatedResponse,
  createdResponse,
} from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { formatMainPostForResponse } from '@/lib/post/display'
import { withSecurity } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'
// Removed deprecated query-helpers import - using direct pagination
import {
  applyViewCountsAndSort,
  applyViewCountsToPosts,
} from '@/lib/post/viewcount'
import { invalidateCache, CACHE_TAGS } from '@/lib/cache/query'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import {
  parseHybridPagination,
  getCursorCondition,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/post/pagination'
import { mainPostSelect } from '@/lib/cache/patterns'
import { createPostSchema, postQuerySchema } from '@/lib/validations/post'
import { handleZodError } from '@/lib/api/validation-error'
import { createAIComment } from '@/lib/ai/qa-bot'
import { parseSearchParams } from '@/lib/api/params'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터 안전하게 파싱
    const params = parseSearchParams(searchParams, [
      'page',
      'limit',
      'category',
      'status',
      'search',
      'orderBy',
      'sort',
    ])

    // Zod 검증
    const queryResult = postQuerySchema.safeParse({
      ...params,
      orderBy: params.orderBy || params.sort, // orderBy 우선, 없으면 sort 사용
    })

    if (!queryResult.success) {
      return handleZodError(queryResult.error)
    }

    const validatedQuery = queryResult.data

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)
    const type = searchParams.get('type') as string | null
    const categoryId = searchParams.get('categoryId') as string | null
    const category = validatedQuery.category // 카테고리 slug
    const sort = validatedQuery.orderBy

    // 카테고리 필터 처리 (다중 카테고리 지원)
    let categoryFilter = {}
    if (category) {
      const categories = category.split(',').map((c) => c.trim())
      if (categories.length === 1) {
        categoryFilter = { category: { slug: categories[0] } }
      } else {
        categoryFilter = {
          category: {
            slug: { in: categories },
          },
        }
      }
    } else if (categoryId) {
      categoryFilter = { categoryId }
    }

    // 필터 조건
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: 'PUBLISHED',
      ...(type && { type }),
      ...categoryFilter,
    }

    // 정렬 조건
    const orderBy = (() => {
      switch (sort) {
        case 'popular':
          return { viewCount: 'desc' as const }
        case 'likes':
          return { likeCount: 'desc' as const }
        case 'bookmarks':
          return { bookmarkCount: 'desc' as const }
        case 'commented':
          return { commentCount: 'desc' as const }
        case 'oldest':
          return { createdAt: 'asc' as const }
        default:
          return { createdAt: 'desc' as const }
      }
    })()

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:posts', {
      ...pagination,
      type,
      category,
      categoryId,
      sort,
    })

    // Redis 캐싱 적용
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          const cursorWhere = {
            ...where,
            ...getCursorCondition(pagination.cursor),
          }

          const posts = await prisma.mainPost.findMany({
            where: cursorWhere,
            orderBy,
            take: getCursorTake(pagination.limit),
            select: mainPostSelect.list,
          })

          const total = await prisma.mainPost.count({ where })
          const cursorResponse = formatCursorResponse(posts, pagination.limit)

          // Redis 조회수 적용 및 정렬
          // latest인 경우 정렬 안함, 나머지는 해당 필드로 정렬
          let postsWithUpdatedViews
          if (sort === 'latest' || sort === 'oldest') {
            // 시간순 정렬은 DB에서 이미 처리됨, Redis 조회수만 적용
            postsWithUpdatedViews = await applyViewCountsToPosts(
              cursorResponse.items,
              {
                debug: false,
                useMaxValue: true,
              }
            )
          } else {
            // 수치 기반 정렬은 Redis 적용 후 재정렬 필요
            const sortField =
              sort === 'popular'
                ? 'viewCount'
                : sort === 'likes'
                  ? 'likeCount'
                  : sort === 'bookmarks'
                    ? 'bookmarkCount'
                    : sort === 'commented'
                      ? 'commentCount'
                      : 'viewCount'

            postsWithUpdatedViews = await applyViewCountsAndSort(
              cursorResponse.items,
              sortField as keyof (typeof cursorResponse.items)[0],
              {
                debug: false,
                useMaxValue: true,
              }
            )
          }

          // 포맷팅 - 통합 포맷터 사용
          const formattedPosts = postsWithUpdatedViews.map((post) => {
            return formatMainPostForResponse({
              ...post,
              timeAgo: formatTimeAgo(post.createdAt),
            })
          })

          return {
            posts: formattedPosts,
            total,
            nextCursor: cursorResponse.nextCursor,
            hasMore: cursorResponse.hasMore,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit
          const take = pagination.limit

          const [posts, total] = await Promise.all([
            prisma.mainPost.findMany({
              where,
              orderBy,
              skip,
              take,
              select: mainPostSelect.list,
            }),
            prisma.mainPost.count({ where }),
          ])

          // Redis 조회수 적용 및 정렬
          // latest인 경우 정렬 안함, 나머지는 해당 필드로 정렬
          let postsWithUpdatedViews
          if (sort === 'latest' || sort === 'oldest') {
            // 시간순 정렬은 DB에서 이미 처리됨, Redis 조회수만 적용
            postsWithUpdatedViews = await applyViewCountsToPosts(posts, {
              debug: false,
              useMaxValue: true,
            })
          } else {
            // 수치 기반 정렬은 Redis 적용 후 재정렬 필요
            const sortField =
              sort === 'popular'
                ? 'viewCount'
                : sort === 'likes'
                  ? 'likeCount'
                  : sort === 'bookmarks'
                    ? 'bookmarkCount'
                    : sort === 'commented'
                      ? 'commentCount'
                      : 'viewCount'

            postsWithUpdatedViews = await applyViewCountsAndSort(
              posts,
              sortField as keyof (typeof posts)[0],
              {
                debug: false,
                useMaxValue: true,
              }
            )
          }

          // 포맷팅 - 통합 포맷터 사용
          const formattedPosts = postsWithUpdatedViews.map((post) => {
            return formatMainPostForResponse({
              ...post,
              timeAgo: formatTimeAgo(post.createdAt),
            })
          })

          return { posts: formattedPosts, total }
        }
      },
      REDIS_TTL.API_SHORT // 30초 캐싱 (목록은 자주 변경)
    )

    // 응답 생성
    if (pagination.type === 'cursor') {
      return NextResponse.json({
        success: true,
        data: cachedData.posts,
        pagination: {
          limit: pagination.limit,
          nextCursor: cachedData.nextCursor,
          hasMore: cachedData.hasMore,
          total: cachedData.total,
        },
      })
    } else {
      return paginatedResponse(
        cachedData.posts,
        pagination.page,
        pagination.limit,
        cachedData.total
      )
    }
  } catch (error) {
    return handleError(error)
  }
}

async function createPost(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Promise<Record<string, string | string[]>> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const body = await request.json()

    // Zod로 요청 데이터 검증
    const parseResult = createPostSchema.safeParse(body)

    if (!parseResult.success) {
      return handleZodError(parseResult.error)
    }

    const { title, content, excerpt, categoryId, status, tags } =
      parseResult.data

    // slug 생성 (title 기반)
    const slug =
      body.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

    // 카테고리 존재 여부 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return errorResponse('존재하지 않는 카테고리입니다.', 400)
    }

    // 태그 처리 - slug 기반으로 기존 태그 찾거나 새로 생성
    const tagConnections = []

    // 노션 스타일 태그 색상 팔레트 (10개)
    const tagColors = [
      '#ef4444', // red
      '#f97316', // orange
      '#f59e0b', // amber
      '#eab308', // yellow
      '#84cc16', // lime
      '#22c55e', // green
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
    ]

    if (tags.length > 0) {
      // N+1 쿼리 방지: 모든 태그를 한 번에 조회
      const existingTags = await prisma.mainTag.findMany({
        where: { slug: { in: tags } },
      })

      const existingTagMap = new Map(existingTags.map((tag) => [tag.slug, tag]))

      // 새로 생성해야 할 태그들 식별
      const newTagSlugs = tags.filter(
        (slug: string) => !existingTagMap.has(slug)
      )

      if (newTagSlugs.length > 0) {
        // 새 태그들 일괄 생성
        const newTagsData = newTagSlugs.map((slug: string) => ({
          name: slug.replace(/-/g, ' '), // slug를 name으로 변환
          slug: slug,
          color: tagColors[Math.floor(Math.random() * tagColors.length)],
        }))

        await prisma.mainTag.createMany({
          data: newTagsData,
          skipDuplicates: true, // 중복 방지
        })

        // 새로 생성된 태그들 다시 조회
        const newlyCreatedTags = await prisma.mainTag.findMany({
          where: { slug: { in: newTagSlugs } },
        })

        // 맵에 추가
        newlyCreatedTags.forEach((tag) => {
          existingTagMap.set(tag.slug, tag)
        })
      }

      // 태그 연결 데이터 생성
      for (const tagSlug of tags) {
        const tag = existingTagMap.get(tagSlug)
        if (tag) {
          tagConnections.push({
            tag: { connect: { id: tag.id } },
          })
        }
      }
    }

    // 현재 사용자의 전역 역할 확인 (authorRole 저장을 위해)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user) {
      return errorResponse('사용자를 찾을 수 없습니다.', 404)
    }

    // 디버깅 로그 (필요시 활성화)
    // console.log('게시글 생성 요청:', {
    //   userId: session.user.id,
    //   userRole: user.globalRole,
    //   requestedStatus: status,
    //   isAdmin: user.globalRole === 'ADMIN',
    // })

    // 게시글 생성 (ADMIN은 자동으로 PUBLISHED, requiresApproval이 false인 카테고리도 PUBLISHED)
    const finalStatus =
      user.globalRole === 'ADMIN' || !category.requiresApproval
        ? 'PUBLISHED'
        : status
    const postData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      slug,
      status: finalStatus,
      authorRole: user.globalRole, // 작성 시점의 역할 저장
      author: { connect: { id: session.user.id } },
      category: { connect: { id: categoryId } },
      tags: {
        create: tagConnections,
      },
      // ADMIN이 작성하거나 승인 불필요 카테고리인 경우 승인 정보 자동 설정
      ...((user.globalRole === 'ADMIN' || !category.requiresApproval) && {
        approvedAt: new Date(),
        approvedById: session.user.id,
      }),
    }

    // console.log('게시글 생성 데이터:', {
    //   status: postData.status,
    //   approvedAt: postData.approvedAt,
    //   approvedById: postData.approvedById,
    // })

    const post = await prisma.mainPost.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // 태그 사용 횟수 업데이트 (PUBLISHED 게시글만)
    if (tagConnections.length > 0 && finalStatus === 'PUBLISHED') {
      await prisma.mainTag.updateMany({
        where: {
          slug: { in: tags },
        },
        data: {
          postCount: { increment: 1 },
        },
      })
    }

    // 캐시 무효화
    await invalidateCache([CACHE_TAGS.mainPosts, CACHE_TAGS.posts])

    // Redis 캐시 무효화 - 관련된 모든 메인 포스트 목록 캐시 삭제
    await redisCache.delPattern('api:cache:main:posts:*')

    // Q&A 카테고리이고 PUBLISHED 상태인 경우 AI 댓글 생성
    console.error('[AI Bot Debug] 게시글 생성됨:', {
      postId: post.id,
      title: post.title,
      status: finalStatus,
      categorySlug: category?.slug,
      categoryName: category?.name,
    })

    // Q&A 카테고리 확인
    let isQACategory = false
    if (finalStatus === 'PUBLISHED' && category) {
      isQACategory = ['qa', 'qna', 'question', 'help', '질문', '문의'].some(
        (qa) =>
          category.slug.toLowerCase().includes(qa) ||
          category.name.toLowerCase().includes(qa)
      )

      console.error('[AI Bot Debug] Q&A 카테고리 체크:', {
        isQACategory,
        categorySlug: category.slug,
        categoryName: category.name,
      })

      if (isQACategory) {
        console.error('[AI Bot Debug] AI 댓글 생성 시작 (비동기):', post.id)
        // 비동기로 AI 댓글 생성 (응답 대기하지 않음)
        createAIComment(post.id).catch((error) => {
          console.error('[AI Bot Debug] AI 댓글 생성 실패:', error)
        })
      }
    }

    // Q&A 카테고리 정보를 응답에 포함
    const response = {
      ...post,
      isQACategory,
    }

    return createdResponse(response, '게시글이 생성되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// 통합 보안 미들웨어 적용 (Rate Limiting + CSRF)
export const POST = withSecurity(createPost, {
  action: ActionCategory.POST_CREATE,
  requireCSRF: true,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})
