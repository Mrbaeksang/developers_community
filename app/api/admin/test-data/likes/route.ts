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

    const { postId } = await request.json()

    // 게시글 확인 (메인 사이트 게시글만 지원)
    let targetPostId = postId

    if (!targetPostId) {
      // postId가 없으면 랜덤 게시글 선택
      const posts = await prisma.mainPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true },
      })

      if (posts.length === 0) {
        return NextResponse.json(
          { error: '좋아요를 추가할 게시글이 없습니다.' },
          { status: 400 }
        )
      }

      const selectedPost = faker.helpers.arrayElement(posts)
      targetPostId = selectedPost.id
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

    // 이미 좋아요가 있는지 확인
    const existing = await prisma.mainLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: targetPostId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 좋아요를 누른 게시글입니다.' },
        { status: 400 }
      )
    }

    // 좋아요 추가
    const like = await prisma.mainLike.create({
      data: {
        userId: session.user.id,
        postId: targetPostId,
      },
      include: {
        post: { select: { title: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: `좋아요가 추가되었습니다.`,
      like: {
        postId: like.postId,
        postTitle: like.post.title,
      },
    })
  } catch (error) {
    console.error('Failed to create likes:', error)
    return NextResponse.json(
      { error: '좋아요 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
