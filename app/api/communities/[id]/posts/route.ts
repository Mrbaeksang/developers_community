import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { requireCommunityMembershipAPI } from '@/lib/auth/session'
import { CommunityVisibility } from '@prisma/client'
import {
  successResponse,
  paginatedResponse,
  validationErrorResponse,
} from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
  throwValidationError,
} from '@/lib/api/errors'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'
import { withSecurity } from '@/lib/security/compatibility'
// Removed deprecated query-helpers import - using direct pagination
import {
  applyViewCountsAndSort,
  applyViewCountsToPosts,
} from '@/lib/post/viewcount'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import {
  parseHybridPagination,
  getCursorCondition,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/post/pagination'
import { communityPostSelect } from '@/lib/cache/patterns'
import { formatCommunityPostForResponse } from '@/lib/post/display'

// GET: 커뮤니티 게시글 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'latest'

    const session = await auth()

    // 커뮤니티 확인 (ID 또는 slug로 조회)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, visibility: true, ownerId: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 비공개 커뮤니티의 경우 멤버만 접근 가능
    if (community.visibility === CommunityVisibility.PRIVATE) {
      if (session?.user?.id) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: session.user.id,
              communityId: community.id,
            },
          },
          select: { status: true },
        })

        if (!membership || membership.status !== 'ACTIVE') {
          if (community.ownerId !== session.user.id) {
            throwAuthorizationError('비공개 커뮤니티입니다')
          }
        }
      } else {
        throwAuthorizationError('비공개 커뮤니티입니다')
      }
    }

    // 검색 조건 설정
    const where: {
      communityId: string
      categoryId?: string
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        content?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      communityId: community.id,
    }

    if (category) {
      // category가 UUID 형식인지 확인 (ID인 경우)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          category
        )

      if (isUUID) {
        where.categoryId = category
      } else {
        // slug인 경우 해당 카테고리 찾기
        const categoryData = await prisma.communityCategory.findFirst({
          where: {
            communityId: community.id,
            slug: category,
          },
          select: { id: true },
        })

        if (categoryData) {
          where.categoryId = categoryData.id
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 정렬 옵션
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

    // Redis 캐시 키 생성 - 로그인 상태에 따라 다른 캐시 사용
    const cacheKey = generateCacheKey('community:posts', {
      communityId: community.id,
      ...pagination,
      category,
      search,
      sort,
      userId: session?.user?.id || 'anonymous',
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

          const posts = await prisma.communityPost.findMany({
            where: cursorWhere,
            orderBy,
            take: getCursorTake(pagination.limit),
            select: {
              ...communityPostSelect.list,
              likes: session?.user?.id
                ? {
                    where: { userId: session.user.id },
                  }
                : false,
              bookmarks: session?.user?.id
                ? {
                    where: { userId: session.user.id },
                  }
                : false,
            },
          })

          const total = await prisma.communityPost.count({ where })
          const cursorResponse = formatCursorResponse(posts, pagination.limit)

          // Redis 조회수 적용 및 정렬
          // latest/oldest인 경우 정렬 안함, 나머지는 해당 필드로 정렬
          let postsWithViews
          if (sort === 'latest' || sort === 'oldest') {
            // 시간순 정렬은 DB에서 이미 처리됨, Redis 조회수만 적용
            postsWithViews = await applyViewCountsToPosts(
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

            postsWithViews = await applyViewCountsAndSort(
              cursorResponse.items,
              sortField as keyof (typeof cursorResponse.items)[0],
              {
                debug: false,
                useMaxValue: true,
              }
            )
          }

          // 사용자별 좋아요/북마크 상태 처리 및 통합 포맷 적용
          const formattedPosts = postsWithViews.map((post) => {
            const postWithState = {
              ...post,
              isLiked: post.likes && post.likes.length > 0,
              isBookmarked: post.bookmarks && post.bookmarks.length > 0,
            }
            return formatCommunityPostForResponse(postWithState)
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
            prisma.communityPost.findMany({
              where,
              select: {
                ...communityPostSelect.list,
                likes: session?.user?.id
                  ? {
                      where: { userId: session.user.id },
                    }
                  : false,
                bookmarks: session?.user?.id
                  ? {
                      where: { userId: session.user.id },
                    }
                  : false,
              },
              orderBy,
              take,
              skip,
            }),
            prisma.communityPost.count({ where }),
          ])

          // Redis 조회수 적용 및 정렬
          // latest/oldest인 경우 정렬 안함, 나머지는 해당 필드로 정렬
          let postsWithViews
          if (sort === 'latest' || sort === 'oldest') {
            // 시간순 정렬은 DB에서 이미 처리됨, Redis 조회수만 적용
            postsWithViews = await applyViewCountsToPosts(posts, {
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

            postsWithViews = await applyViewCountsAndSort(
              posts,
              sortField as keyof (typeof posts)[0],
              {
                debug: false,
                useMaxValue: true,
              }
            )
          }

          // 사용자별 좋아요/북마크 상태 처리 및 통합 포맷 적용
          const formattedPosts = postsWithViews.map((post) => {
            const postWithState = {
              ...post,
              isLiked: post.likes && post.likes.length > 0,
              isBookmarked: post.bookmarks && post.bookmarks.length > 0,
            }
            return formatCommunityPostForResponse(postWithState)
          })

          return { posts: formattedPosts, total }
        }
      },
      REDIS_TTL.API_SHORT // 30초 캐싱 (커뮤니티는 더 자주 업데이트)
    )

    // 응답 생성
    if (pagination.type === 'cursor') {
      return successResponse({
        items: cachedData.posts,
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
        cachedData.total,
        pagination.page,
        pagination.limit
      )
    }
  } catch (error) {
    return handleError(error)
  }
}

// POST: 커뮤니티 게시글 작성
const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  content: z.string().min(1, '내용을 입력해주세요'),
  categoryId: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(), // 태그 slug 배열
})

async function createCommunityPost(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await requireCommunityMembershipAPI(id)
    if (session instanceof Response) {
      return session
    }

    // 멤버십 상세 정보 조회 (파일 업로드 권한 확인용)
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: id,
        },
      },
      include: {
        community: {
          select: { allowFileUpload: true },
        },
      },
    })

    // checkCommunityMembership에서 이미 확인했으므로 membership는 존재함

    const body = await req.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      const errors: Record<string, string[]> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }

    const { title, content, categoryId, fileIds, tags } = validation.data

    // 파일 업로드 권한 확인
    if (
      fileIds &&
      fileIds.length > 0 &&
      membership &&
      !membership.community.allowFileUpload
    ) {
      throwAuthorizationError('이 커뮤니티는 파일 업로드를 허용하지 않습니다')
    }

    // 카테고리 확인
    if (categoryId) {
      const category = await prisma.communityCategory.findUnique({
        where: { id: categoryId, communityId: id },
      })

      if (!category) {
        throwValidationError('유효하지 않은 카테고리입니다')
      }
    }

    // 현재 사용자의 커뮤니티 역할 확인 (authorRole 저장을 위해)
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId: session.user.id, communityId: id },
      },
      select: { role: true },
    })

    if (!userMembership) {
      throwAuthorizationError('커뮤니티 멤버가 아닙니다')
    }

    // 태그 처리 - 각 태그를 생성하거나 찾기
    const tagConnections = []
    if (tags && tags.length > 0) {
      for (const tagSlug of tags) {
        // 태그 이름 생성 (slug에서)
        const tagName = tagSlug.replace(/-/g, ' ')

        // 태그 생성 또는 찾기
        const tag = await prisma.communityTag.upsert({
          where: {
            communityId_slug: {
              communityId: id,
              slug: tagSlug,
            },
          },
          update: {
            postCount: { increment: 1 },
          },
          create: {
            name: tagName,
            slug: tagSlug,
            communityId: id,
            postCount: 1,
          },
        })

        tagConnections.push({ tagId: tag.id })
      }
    }

    // 게시글 생성
    const post = await prisma.communityPost.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        authorRole: userMembership.role, // 작성 시점의 역할 저장
        communityId: id,
        categoryId,
        files: fileIds
          ? {
              connect: fileIds.map((id) => ({ id })),
            }
          : undefined,
        tags:
          tagConnections.length > 0
            ? {
                create: tagConnections,
              }
            : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    })

    // 커뮤니티 게시글 수 증가
    await prisma.community.update({
      where: { id },
      data: { postCount: { increment: 1 } },
    })

    // Redis 캐시 무효화 - 해당 커뮤니티의 모든 게시글 목록 캐시 삭제
    await redisCache.delPattern(`api:cache:community:posts:*communityId*${id}*`)

    return successResponse(post, '게시글이 작성되었습니다', 201)
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting과 CSRF 보호 적용 - 새로운 Rate Limiting 시스템 사용
export const POST = withSecurity(
  withRateLimiting(createCommunityPost, {
    action: ActionCategory.POST_CREATE,
    enablePatternDetection: true,
    enableAbuseTracking: true,
  }),
  { requireCSRF: true }
)
