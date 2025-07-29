import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || !['ADMIN', 'MANAGER'].includes(user.globalRole)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { postId, content } = await request.json()

    // 게시글 확인
    let targetPostId = postId

    if (!targetPostId) {
      // postId가 없으면 랜덤 게시글 선택
      const posts = await prisma.mainPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true },
      })

      if (posts.length === 0) {
        return NextResponse.json(
          { error: '댓글을 생성할 게시글이 없습니다.' },
          { status: 400 }
        )
      }

      targetPostId = faker.helpers.arrayElement(posts).id
    } else {
      // postId가 제공된 경우 유효성 확인
      const post = await prisma.mainPost.findUnique({
        where: { id: targetPostId },
      })

      if (!post) {
        return NextResponse.json(
          { error: '해당 게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.mainComment.create({
      data: {
        content: content || faker.lorem.paragraph(),
        authorId: session.user.id, // 현재 사용자가 작성자
        postId: targetPostId,
      },
      include: {
        author: { select: { name: true } },
        post: { select: { title: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: `댓글이 생성되었습니다.`,
      comment: {
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        author: comment.author.name,
        post: comment.post.title,
      },
    })
  } catch (error) {
    console.error('Failed to create test comments:', error)
    return NextResponse.json(
      { error: '테스트 댓글 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
