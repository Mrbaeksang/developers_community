import { prisma } from '@/lib/core/prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message?: string
  senderId?: string
  resourceIds?: {
    postId?: string
    commentId?: string
    communityId?: string
    channelId?: string
  }
}

/**
 * 알림 생성 헬퍼 함수
 * 다른 API에서 이 함수를 호출하여 알림을 생성할 수 있습니다.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  senderId,
  resourceIds,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        senderId,
        resourceIds: resourceIds ? JSON.stringify(resourceIds) : null,
      },
    })

    // 실시간 알림 전송을 위한 이벤트 발생
    // SSE를 통해 클라이언트에 즉시 전송
    if (global.notificationEmitter) {
      global.notificationEmitter.emit('notification', {
        userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          senderId: notification.senderId,
          resourceIds: notification.resourceIds
            ? JSON.parse(notification.resourceIds)
            : null,
        },
      })
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * 게시글 좋아요 알림 생성
 */
export async function createPostLikeNotification(
  postId: string,
  postAuthorId: string,
  likerId: string,
  postTitle: string
) {
  // 본인 게시글에 좋아요한 경우 알림 생성하지 않음
  if (postAuthorId === likerId) return

  const liker = await prisma.user.findUnique({
    where: { id: likerId },
    select: { name: true, username: true },
  })

  await createNotification({
    userId: postAuthorId,
    type: 'POST_LIKE',
    title: '게시글 좋아요',
    message: `${liker?.name || liker?.username || '사용자'}님이 "${postTitle}" 게시글을 좋아합니다.`,
    senderId: likerId,
    resourceIds: { postId },
  })
}

/**
 * 게시글 댓글 알림 생성
 */
export async function createPostCommentNotification(
  postId: string,
  postAuthorId: string,
  commenterId: string,
  postTitle: string,
  commentContent: string
) {
  // 본인 게시글에 댓글 작성한 경우 알림 생성하지 않음
  if (postAuthorId === commenterId) return

  const commenter = await prisma.user.findUnique({
    where: { id: commenterId },
    select: { name: true, username: true },
  })

  await createNotification({
    userId: postAuthorId,
    type: 'POST_COMMENT',
    title: '새 댓글',
    message: `${commenter?.name || commenter?.username || '사용자'}님이 "${postTitle}" 게시글에 댓글을 달았습니다: "${
      commentContent.length > 50
        ? commentContent.substring(0, 50) + '...'
        : commentContent
    }"`,
    senderId: commenterId,
    resourceIds: { postId },
  })
}

/**
 * 댓글 답글 알림 생성
 */
export async function createCommentReplyNotification(
  postId: string,
  parentCommentAuthorId: string,
  replierId: string,
  replyContent: string,
  commentId: string
) {
  // 본인 댓글에 답글 작성한 경우 알림 생성하지 않음
  if (parentCommentAuthorId === replierId) return

  const replier = await prisma.user.findUnique({
    where: { id: replierId },
    select: { name: true, username: true },
  })

  await createNotification({
    userId: parentCommentAuthorId,
    type: 'COMMENT_REPLY',
    title: '댓글 답글',
    message: `${replier?.name || replier?.username || '사용자'}님이 회원님의 댓글에 답글을 달았습니다: "${
      replyContent.length > 50
        ? replyContent.substring(0, 50) + '...'
        : replyContent
    }"`,
    senderId: replierId,
    resourceIds: { postId, commentId },
  })
}

/**
 * 게시글 승인 알림 생성
 */
export async function createPostApprovedNotification(
  postId: string,
  postAuthorId: string,
  postTitle: string,
  approverId: string
) {
  await createNotification({
    userId: postAuthorId,
    type: 'POST_APPROVED',
    title: '게시글 승인됨',
    message: `"${postTitle}" 게시글이 승인되어 공개되었습니다.`,
    senderId: approverId,
    resourceIds: { postId },
  })
}

/**
 * 게시글 거부 알림 생성
 */
export async function createPostRejectedNotification(
  postId: string,
  postAuthorId: string,
  postTitle: string,
  rejectionReason: string,
  rejecterId: string
) {
  await createNotification({
    userId: postAuthorId,
    type: 'POST_REJECTED',
    title: '게시글 거부됨',
    message: `"${postTitle}" 게시글이 거부되었습니다. 사유: ${rejectionReason}`,
    senderId: rejecterId,
    resourceIds: { postId },
  })
}

/**
 * 커뮤니티 가입 알림 생성 (관리자에게)
 */
export async function createCommunityJoinNotification(
  communityId: string,
  communityOwnerId: string,
  joinerId: string,
  communityName: string
) {
  const joiner = await prisma.user.findUnique({
    where: { id: joinerId },
    select: { name: true, username: true },
  })

  await createNotification({
    userId: communityOwnerId,
    type: 'COMMUNITY_JOIN',
    title: '새 멤버 가입',
    message: `${joiner?.name || joiner?.username || '사용자'}님이 "${communityName}" 커뮤니티에 가입했습니다.`,
    senderId: joinerId,
    resourceIds: { communityId },
  })
}
