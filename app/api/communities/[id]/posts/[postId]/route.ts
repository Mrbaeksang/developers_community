import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkAuth, checkMembership } from '@/lib/auth-helpers'
import { CommunityVisibility, CommunityRole } from '@prisma/client'

// GET: 커뮤니티 게시글 상세 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    // 먼저 커뮤니티 찾기 (ID 또는 slug로)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 커뮤니티 및 게시글 확인
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: community.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        category: true,
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            visibility: true,
            ownerId: true,
            members: session?.user?.id
              ? {
                  where: { userId: session.user.id, status: 'ACTIVE' },
                }
              : false,
          },
        },
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
        files: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 비공개 커뮤니티의 경우 멤버만 접근 가능
    if (post.community.visibility === CommunityVisibility.PRIVATE) {
      if (session?.user?.id) {
        const membershipError = await checkMembership(session.user.id, id)
        if (membershipError && post.community.ownerId !== session.user.id) {
          return NextResponse.json(
            { error: '비공개 커뮤니티의 게시글입니다.' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: '비공개 커뮤니티의 게시글입니다.' },
          { status: 403 }
        )
      }
    }

    // 조회수 증가 (작성자 본인이 아닌 경우)
    if (session?.user?.id !== post.authorId) {
      await prisma.communityPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      })
    }

    // 사용자별 좋아요/북마크 상태 처리
    const formattedPost = {
      ...post,
      isLiked: post.likes && post.likes.length > 0,
      isBookmarked: post.bookmarks && post.bookmarks.length > 0,
      likes: undefined,
      bookmarks: undefined,
      viewCount: post.viewCount + (session?.user?.id !== post.authorId ? 1 : 0),
    }

    return NextResponse.json(formattedPost)
  } catch {
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH: 커뮤니티 게시글 수정
const updatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100).optional(),
  content: z.string().min(1, '내용을 입력해주세요').optional(),
  categoryId: z.string().nullable().optional(),
  fileIds: z.array(z.string()).optional(),
})

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    // 인증 확인
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 먼저 커뮤니티 찾기 (ID 또는 slug로)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 게시글 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, communityId: community.id },
      include: {
        community: {
          select: { allowFileUpload: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (작성자 본인만 수정 가능)
    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = updatePostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, content, categoryId, fileIds } = validation.data

    // 파일 업로드 권한 확인
    if (fileIds && fileIds.length > 0 && !post.community.allowFileUpload) {
      return NextResponse.json(
        { error: '이 커뮤니티는 파일 업로드를 허용하지 않습니다.' },
        { status: 403 }
      )
    }

    // 카테고리 확인
    if (categoryId !== undefined) {
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
    }

    // 게시글 업데이트
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(categoryId !== undefined && { categoryId }),
        ...(fileIds && {
          files: {
            set: fileIds.map((id) => ({ id })),
          },
        }),
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

    return NextResponse.json(updatedPost)
  } catch {
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 커뮤니티 게시글 삭제
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    // 인증 확인
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 먼저 커뮤니티 찾기 (ID 또는 slug로)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 게시글 및 멤버십 확인
    const [post, membership] = await Promise.all([
      prisma.communityPost.findUnique({
        where: { id: postId, communityId: community.id },
        select: { authorId: true },
      }),
      prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: community.id,
          },
        },
        select: { role: true },
      }),
    ])

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (작성자 본인 또는 ADMIN/OWNER만 삭제 가능)
    const canDelete =
      post.authorId === session.user.id ||
      membership?.role === CommunityRole.ADMIN ||
      membership?.role === CommunityRole.OWNER

    if (!canDelete) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시글 하드 삭제
    await prisma.communityPost.delete({
      where: { id: postId },
    })

    // 커뮤니티 게시글 수 감소
    await prisma.community.update({
      where: { id },
      data: { postCount: { decrement: 1 } },
    })

    return NextResponse.json({ message: '게시글이 삭제되었습니다.' })
  } catch {
    return NextResponse.json(
      { error: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
