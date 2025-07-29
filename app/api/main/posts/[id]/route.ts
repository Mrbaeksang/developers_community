import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'
import { checkAuth } from '@/lib/auth-helpers'
import { PostStatus } from '@prisma/client'
import { canModifyMainContent } from '@/lib/role-hierarchy'

// GET /api/main/posts/[id] - 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await prisma.mainPost.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 조회수 증가
    await prisma.mainPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // 태그 형식 변환
    const formattedPost = {
      ...post,
      tags: post.tags.map((postTag) => postTag.tag),
    }

    return NextResponse.json(formattedPost)
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PUT /api/main/posts/[id] - 게시글 수정
const updatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  content: z.string().min(1, '내용을 입력해주세요'),
  categoryId: z.string(),
  tagIds: z.array(z.string()).max(5, '태그는 최대 5개까지 가능합니다'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    // 게시글 조회 (작성자 확인)
    const post = await prisma.mainPost.findUnique({
      where: { id },
      select: {
        authorId: true,
        authorRole: true,
        status: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 사용자의 전역 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { globalRole: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (역할 계층 기반)
    const isAuthor = post.authorId === session!.user.id
    const canModify = canModifyMainContent(user.globalRole, isAuthor, post.authorRole)

    if (!canModify) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updatePostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, content, categoryId, tagIds } = validation.data

    // 카테고리 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 태그 확인
    if (tagIds.length > 0) {
      const tags = await prisma.mainTag.findMany({
        where: { id: { in: tagIds } },
      })

      if (tags.length !== tagIds.length) {
        return NextResponse.json(
          { error: '유효하지 않은 태그가 포함되어 있습니다.' },
          { status: 400 }
        )
      }
    }

    // 게시글 수정 (트랜잭션 사용)
    const updatedPost = await prisma.$transaction(async (tx) => {
      // 기존 태그 연결 삭제
      await tx.mainPostTag.deleteMany({
        where: { postId: id },
      })

      // 게시글 수정
      const updated = await tx.mainPost.update({
        where: { id },
        data: {
          title,
          content,
          categoryId,
          // 수정 시 다시 PENDING 상태로 변경 (ADMIN 이상만 상태 유지)
          status:
            user.globalRole === 'ADMIN' || user.globalRole === 'SUPER_ADMIN' 
              ? post.status 
              : PostStatus.PENDING,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
      })

      // 새 태그 연결
      if (tagIds.length > 0) {
        await tx.mainPostTag.createMany({
          data: tagIds.map((tagId) => ({
            postId: id,
            tagId,
          })),
        })
      }

      // 태그 정보 가져오기
      const postTags = await tx.mainPostTag.findMany({
        where: { postId: id },
        include: { tag: true },
      })

      return {
        ...updated,
        tags: postTags.map((pt) => pt.tag),
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/main/posts/[id] - 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    // 게시글 조회 (작성자 확인)
    const post = await prisma.mainPost.findUnique({
      where: { id },
      select: { 
        authorId: true,
        authorRole: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 사용자의 전역 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { globalRole: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (역할 계층 기반)
    const isAuthor = post.authorId === session!.user.id
    const canDelete = canModifyMainContent(user.globalRole, isAuthor, post.authorRole)

    if (!canDelete) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시글 삭제 (관련 데이터는 CASCADE로 자동 삭제)
    await prisma.mainPost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { error: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
