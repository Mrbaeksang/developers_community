import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET: 커뮤니티 게시글 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'latest'

    const session = await auth()

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        members: session?.user?.id
          ? {
              where: { userId: session.user.id, status: 'ACTIVE' },
            }
          : false,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 비공개 커뮤니티의 경우 멤버만 접근 가능
    if (community.visibility === 'PRIVATE') {
      const isMember = community.members && community.members.length > 0
      if (!isMember && community.ownerId !== session?.user?.id) {
        return NextResponse.json(
          { error: '비공개 커뮤니티입니다.' },
          { status: 403 }
        )
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
    const orderBy: {
      createdAt?: 'desc' | 'asc'
      viewCount?: 'desc' | 'asc'
      comments?: { _count: 'desc' | 'asc' }
    } = {}
    switch (sort) {
      case 'popular':
        orderBy.viewCount = 'desc'
        break
      case 'commented':
        orderBy.comments = { _count: 'desc' }
        break
      default:
        orderBy.createdAt = 'desc'
    }

    // 게시글 조회
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
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.communityPost.count({ where }),
    ])

    // 사용자별 좋아요/북마크 상태 처리
    const formattedPosts = posts.map((post) => ({
      ...post,
      isLiked: post.likes && post.likes.length > 0,
      isBookmarked: post.bookmarks && post.bookmarks.length > 0,
      likes: undefined,
      bookmarks: undefined,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch community posts:', error)
    return NextResponse.json(
      { error: '게시글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 커뮤니티 게시글 작성
const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  content: z.string().min(1, '내용을 입력해주세요'),
  categoryId: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 멤버십 확인
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

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '커뮤니티 멤버만 게시글을 작성할 수 있습니다.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, content, categoryId, fileIds } = validation.data

    // 파일 업로드 권한 확인
    if (
      fileIds &&
      fileIds.length > 0 &&
      !membership.community.allowFileUpload
    ) {
      return NextResponse.json(
        { error: '이 커뮤니티는 파일 업로드를 허용하지 않습니다.' },
        { status: 403 }
      )
    }

    // 카테고리 확인
    if (categoryId) {
      const category = await prisma.communityCategory.findUnique({
        where: { id: categoryId, communityId: id },
      })

      if (!category) {
        return NextResponse.json(
          { error: '유효하지 않은 카테고리입니다.' },
          { status: 400 }
        )
      }
    }

    // 게시글 생성
    const post = await prisma.communityPost.create({
      data: {
        title,
        content,
        authorId: session.user.id,
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Failed to create community post:', error)
    return NextResponse.json(
      { error: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
