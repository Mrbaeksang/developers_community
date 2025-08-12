import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { handleError } from '@/lib/api/errors'

// DELETE: 회원 탈퇴
export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return handleError(new Error('로그인이 필요합니다.'))
    }

    const userId = session.user.id

    // 트랜잭션으로 모든 관련 데이터 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 소유한 커뮤니티가 있는지 확인
      const ownedCommunities = await tx.community.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true },
      })

      if (ownedCommunities.length > 0) {
        // 소유한 커뮤니티가 있으면 탈퇴 불가
        throw new Error(
          `소유하고 있는 커뮤니티가 있습니다. 먼저 커뮤니티 소유권을 이전하거나 삭제해주세요. (${ownedCommunities.map((c) => c.name).join(', ')})`
        )
      }

      // 2. 커뮤니티 멤버십 삭제
      await tx.communityMember.deleteMany({
        where: { userId },
      })

      // 3. 채팅 메시지 삭제
      await tx.chatMessage.deleteMany({
        where: { authorId: userId },
      })

      // 4. 알림 삭제
      await tx.notification.deleteMany({
        where: { userId },
      })

      // 5. 커뮤니티 게시글 관련 삭제
      // 북마크 삭제
      await tx.communityBookmark.deleteMany({
        where: { userId },
      })

      // 좋아요 삭제
      await tx.communityLike.deleteMany({
        where: { userId },
      })

      // 댓글 삭제
      await tx.communityComment.deleteMany({
        where: { authorId: userId },
      })

      // 게시글 삭제
      await tx.communityPost.deleteMany({
        where: { authorId: userId },
      })

      // 6. 메인 게시글 관련 삭제
      // 북마크 삭제
      await tx.mainBookmark.deleteMany({
        where: { userId },
      })

      // 좋아요 삭제
      await tx.mainLike.deleteMany({
        where: { userId },
      })

      // 댓글 삭제
      await tx.mainComment.deleteMany({
        where: { authorId: userId },
      })

      // 게시글 삭제
      await tx.mainPost.deleteMany({
        where: { authorId: userId },
      })

      // 7. 파일 삭제
      await tx.file.deleteMany({
        where: { uploaderId: userId },
      })

      // 8. 세션 삭제
      await tx.session.deleteMany({
        where: { userId },
      })

      // 9. 계정 삭제
      await tx.account.deleteMany({
        where: { userId },
      })

      // 10. 사용자 삭제
      await tx.user.delete({
        where: { id: userId },
      })
    })

    return NextResponse.json(
      { success: true, message: '회원 탈퇴가 완료되었습니다.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('회원 탈퇴 오류:', error)

    return handleError(error)
  }
}
