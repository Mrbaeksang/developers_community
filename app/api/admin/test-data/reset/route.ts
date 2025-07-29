import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkGlobalRole } from '@/lib/auth-helpers'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const roleError = await checkGlobalRole(session.user.id, ['ADMIN'])
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 })
    }

    // 트랜잭션으로 모든 테스트 데이터 삭제
    const result = await prisma.$transaction(async (tx) => {
      // 상호작용 데이터 삭제 (외래 키 제약 때문에 먼저 삭제)
      const [
        deletedMainLikes,
        deletedMainBookmarks,
        deletedCommunityLikes,
        deletedCommunityBookmarks,
      ] = await Promise.all([
        tx.mainLike.deleteMany({}),
        tx.mainBookmark.deleteMany({}),
        tx.communityLike.deleteMany({}),
        tx.communityBookmark.deleteMany({}),
      ])

      // 댓글 삭제
      const [deletedMainComments, deletedCommunityComments] = await Promise.all(
        [tx.mainComment.deleteMany({}), tx.communityComment.deleteMany({})]
      )

      // 게시글-태그 관계 삭제
      const deletedPostTags = await tx.mainPostTag.deleteMany({})

      // 게시글 삭제
      const [deletedMainPosts, deletedCommunityPosts] = await Promise.all([
        tx.mainPost.deleteMany({}),
        tx.communityPost.deleteMany({}),
      ])

      // 채팅 메시지와 채널 삭제
      const deletedMessages = await tx.chatMessage.deleteMany({})
      const deletedChannels = await tx.chatChannel.deleteMany({})

      // 커뮤니티 멤버 삭제
      const deletedMembers = await tx.communityMember.deleteMany({})

      // 커뮤니티 카테고리 삭제
      const deletedCommunityCategories = await tx.communityCategory.deleteMany(
        {}
      )

      // 커뮤니티 삭제
      const deletedCommunities = await tx.community.deleteMany({})

      // 메인 카테고리와 태그 삭제
      const [deletedMainCategories, deletedMainTags] = await Promise.all([
        tx.mainCategory.deleteMany({}),
        tx.mainTag.deleteMany({}),
      ])

      // 사용자 삭제 (테스트 사용자만 - 현재 세션 사용자 제외)
      const deletedUsers = await tx.user.deleteMany({
        where: {
          AND: [
            { id: { not: session.user.id } },
            {
              OR: [
                { email: { contains: '@test.com' } },
                { username: { startsWith: 'test_' } },
              ],
            },
          ],
        },
      })

      return {
        users: deletedUsers.count,
        mainPosts: deletedMainPosts.count,
        mainComments: deletedMainComments.count,
        mainLikes: deletedMainLikes.count,
        mainBookmarks: deletedMainBookmarks.count,
        mainCategories: deletedMainCategories.count,
        mainTags: deletedMainTags.count,
        postTags: deletedPostTags.count,
        communities: deletedCommunities.count,
        communityCategories: deletedCommunityCategories.count,
        communityPosts: deletedCommunityPosts.count,
        communityComments: deletedCommunityComments.count,
        communityLikes: deletedCommunityLikes.count,
        communityBookmarks: deletedCommunityBookmarks.count,
        communityMembers: deletedMembers.count,
        communityChannels: deletedChannels.count,
        communityMessages: deletedMessages.count,
      }
    })

    return NextResponse.json({
      success: true,
      message: '모든 테스트 데이터가 삭제되었습니다.',
      deleted: result,
    })
  } catch (error) {
    console.error('Failed to reset test data:', error)
    return NextResponse.json(
      { error: '테스트 데이터 초기화에 실패했습니다.' },
      { status: 500 }
    )
  }
}
