import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireCommunityMembershipAPI } from '@/lib/auth-utils'
import { CommunityVisibility } from '@prisma/client'
import { successResponse, paginatedResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
  throwValidationError,
} from '@/lib/error-handler'
import { withRateLimit } from '@/lib/rate-limiter'
import { withCSRFProtection } from '@/lib/csrf'
import {
  getBatchViewCounts,
  getPostOrderBy,
  getPaginationParams,
  getPaginationSkipTake,
} from '@/lib/db/query-helpers'

// GET: 커뮤니티 게시글 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const { page, limit } = getPaginationParams(searchParams)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'latest'

    const session = await auth()

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
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
              communityId: id,
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
      communityId: id,
    }

    if (category) {
      where.categoryId = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 정렬 옵션
    const orderBy = getPostOrderBy(sort)

    // 게시글 조회
    const { skip, take } = getPaginationSkipTake({ page, limit })
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          category: true,
          _count: {
            select: { comments: true, likes: true },
          },
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

    // Redis에서 조회수 일괄 조회
    const postIds = posts.map((p) => p.id)
    const viewCountsMap = await getBatchViewCounts(postIds, 'community:post')

    // 사용자별 좋아요/북마크 상태 처리 및 Redis 조회수 포함
    const formattedPosts = posts.map((post) => {
      const redisViews = viewCountsMap.get(post.id) || 0

      return {
        ...post,
        viewCount: post.viewCount + redisViews, // DB 조회수 + Redis 조회수
        isLiked: post.likes && post.likes.length > 0,
        isBookmarked: post.bookmarks && post.bookmarks.length > 0,
        likes: undefined,
        bookmarks: undefined,
      }
    })

    return paginatedResponse(formattedPosts, total, page, limit)
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
      throwValidationError(validation.error.issues[0].message)
    }

    const { title, content, categoryId, fileIds } = validation.data

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
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        category: true,
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

    return successResponse(post, '게시글이 작성되었습니다', 201)
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting과 CSRF 보호 적용 - 커뮤니티 게시글 작성
export const POST = withCSRFProtection(
  withRateLimit(createCommunityPost, 'post')
)
