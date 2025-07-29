import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { checkBanStatus, unauthorized } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') as string | null
    const categoryId = searchParams.get('categoryId') as string | null
    const sort = searchParams.get('sort') || 'latest'

    // 필터 조건
    const where = {
      status: 'PUBLISHED' as const,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
    }

    // 정렬 조건
    const orderBy =
      sort === 'popular'
        ? { viewCount: 'desc' as const }
        : { createdAt: 'desc' as const }

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
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
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

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '게시글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
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
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 상태 검증
    if (!['DRAFT', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: '잘못된 상태값입니다.' },
        { status: 400 }
      )
    }

    // 카테고리 존재 여부 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: '존재하지 않는 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 태그 처리 - slug 기반으로 기존 태그 찾거나 새로 생성
    const tagConnections = []
    for (const tagSlug of tags) {
      let tag = await prisma.mainTag.findUnique({
        where: { slug: tagSlug },
      })

      if (!tag) {
        // 태그가 없으면 생성
        tag = await prisma.mainTag.create({
          data: {
            name: tagSlug.replace(/-/g, ' '), // slug를 name으로 변환
            slug: tagSlug,
            color: '#64748b', // 기본 색상
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
      select: { globalRole: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        slug,
        status,
        authorRole: user.globalRole, // 작성 시점의 역할 저장
        author: { connect: { id: session.user.id } },
        category: { connect: { id: categoryId } },
        tags: {
          create: tagConnections,
        },
      },
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

    // 태그 사용 횟수 업데이트
    if (tagConnections.length > 0) {
      await prisma.mainTag.updateMany({
        where: {
          slug: { in: tags },
        },
        data: {
          postCount: { increment: 1 },
        },
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('게시글 생성 실패:', error)
    return NextResponse.json(
      { error: '게시글 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
