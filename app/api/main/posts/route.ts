import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth-utils'
import { markdownToHtml } from '@/lib/markdown'
import { redis } from '@/lib/redis'
import {
  errorResponse,
  paginatedResponse,
  createdResponse,
} from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') as string | null
    const categoryId = searchParams.get('categoryId') as string | null
    const category = searchParams.get('category') as string | null // 카테고리 slug
    const sort = searchParams.get('sort') || 'latest'

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
    let orderBy: Record<string, 'asc' | 'desc'>
    switch (sort) {
      case 'popular':
        orderBy = { viewCount: 'desc' }
        break
      case 'likes':
        orderBy = { likeCount: 'desc' }
        break
      case 'bookmarks':
        orderBy = { bookmarkCount: 'desc' }
        break
      case 'commented':
        orderBy = { commentCount: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // 전체 개수 조회
    const total = await prisma.mainPost.count({ where })

    // 게시글 조회
    const posts = await prisma.mainPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    // 마크다운을 HTML로 변환하고 Redis 조회수 포함
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Redis에서 버퍼링된 조회수 가져오기
        const bufferKey = `post:${post.id}:views`
        const bufferedViews = await redis().get(bufferKey)
        const redisViews = parseInt(bufferedViews || '0')

        return {
          ...post,
          content: markdownToHtml(post.content),
          tags: post.tags.map((postTag) => postTag.tag),
          viewCount: post.viewCount + redisViews, // DB 조회수 + Redis 조회수
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          timeAgo: formatTimeAgo(post.createdAt),
        }
      })
    )

    return paginatedResponse(formattedPosts, page, limit, total)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      slug,
      categoryId,
      status = 'DRAFT',
      tags = [],
    } = body

    // 필수 필드 검증
    if (!title || !content || !categoryId || !slug) {
      return errorResponse('필수 정보가 누락되었습니다.', 400)
    }

    // 상태 검증
    if (!['DRAFT', 'PENDING'].includes(status)) {
      return errorResponse('잘못된 상태값입니다.', 400)
    }

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

    for (const tagSlug of tags) {
      let tag = await prisma.mainTag.findUnique({
        where: { slug: tagSlug },
      })

      if (!tag) {
        // 태그가 없으면 생성 - 랜덤 색상 적용
        const randomColor =
          tagColors[Math.floor(Math.random() * tagColors.length)]
        tag = await prisma.mainTag.create({
          data: {
            name: tagSlug.replace(/-/g, ' '), // slug를 name으로 변환
            slug: tagSlug,
            color: randomColor,
          },
        })
      }

      tagConnections.push({
        tag: { connect: { id: tag.id } },
      })
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

    return createdResponse(post, '게시글이 생성되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}
