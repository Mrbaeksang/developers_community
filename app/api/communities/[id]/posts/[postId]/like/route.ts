import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth, checkMembership } from '@/lib/auth-helpers'

// POST: 커뮤니티 게시글 좋아요
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    // 커뮤니티 멤버십 확인
    const membershipError = await checkMembership(session!.user.id, id)
    if (membershipError) return membershipError

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, communityId: id },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 좋아요 했는지 확인
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        userId_postId: {
          userId: session!.user.id,
          postId: postId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json(
        { error: '이미 좋아요한 게시글입니다.' },
        { status: 400 }
      )
    }

    // 좋아요 생성
    await prisma.communityLike.create({
      data: {
        userId: session!.user.id,
        postId: postId,
      },
    })

    // 좋아요 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    })

    return NextResponse.json({ message: '좋아요를 눌렀습니다.' })
  } catch (error) {
    console.error('Failed to like post:', error)
    return NextResponse.json(
      { error: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 커뮤니티 게시글 좋아요 취소
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    // 커뮤니티 멤버십 확인
    const membershipError = await checkMembership(session!.user.id, id)
    if (membershipError) return membershipError

    // 좋아요 삭제
    const result = await prisma.communityLike.deleteMany({
      where: {
        userId: session!.user.id,
        postId: postId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: '좋아요하지 않은 게시글입니다.' },
        { status: 400 }
      )
    }

    // 좋아요 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { likeCount: { decrement: 1 } },
    })

    return NextResponse.json({ message: '좋아요가 취소되었습니다.' })
  } catch (error) {
    console.error('Failed to unlike post:', error)
    return NextResponse.json(
      { error: '좋아요 취소에 실패했습니다.' },
      { status: 500 }
    )
  }
}
