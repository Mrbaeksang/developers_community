import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { subMinutes } from 'date-fns'
import type { ActivityType } from '@/types/activity'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

// 내부 활동 타입 (Date 객체 사용)
interface InternalActivity {
  id: string
  type: ActivityType
  title: string
  description: string
  userName: string
  timestamp: Date
  metadata?: {
    postId?: string
    postTitle?: string
    communityName?: string
    viewCount?: number
  }
}

export async function GET() {
  try {
    const activities: InternalActivity[] = []
    const now = new Date()
    // 테스트를 위해 30분으로 변경 (실제로는 5분이 적절함)
    const fiveMinutesAgo = subMinutes(now, 30)

    // 1. 최근 메인 포스트 (PUBLISHED 상태만)
    const recentPosts = await prisma.mainPost.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      include: {
        author: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    recentPosts.forEach((post) => {
      activities.push({
        id: `post-${post.id}`,
        type: 'post',
        title: '새 글 작성',
        description: `${post.category.name}에 새 글이 작성되었습니다`,
        userName: post.author.name || '알 수 없음',
        timestamp: post.createdAt,
        metadata: {
          postId: post.id,
          postTitle: post.title,
        },
      })
    })

    // 2. 최근 댓글 활동
    const recentComments = await prisma.mainComment.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      include: {
        author: {
          select: { name: true },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        parent: {
          select: {
            author: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    recentComments.forEach((comment) => {
      if (comment.parentId && comment.parent) {
        activities.push({
          id: `reply-${comment.id}`,
          type: 'comment',
          title: '답글 작성',
          description: `${comment.parent.author.name}님의 댓글에 답글을 남겼습니다`,
          userName: comment.author.name || '알 수 없음',
          timestamp: comment.createdAt,
          metadata: {
            postId: comment.post.id,
            postTitle: comment.post.title,
          },
        })
      } else {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          title: '댓글 작성',
          description: `"${comment.post.title}" 글에 댓글을 남겼습니다`,
          userName: comment.author.name || '알 수 없음',
          timestamp: comment.createdAt,
          metadata: {
            postId: comment.post.id,
            postTitle: comment.post.title,
          },
        })
      }
    })

    // 3. 좋아요 활동 (그룹화)
    const likeGroups = await prisma.mainLike.groupBy({
      by: ['postId'],
      where: {
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      _count: {
        postId: true,
      },
      orderBy: {
        _count: {
          postId: 'desc',
        },
      },
      take: 5,
    })

    // 좋아요가 있는 게시글 정보 가져오기
    if (likeGroups.length > 0) {
      const postIds = likeGroups.map((group) => group.postId)
      const posts = await prisma.mainPost.findMany({
        where: {
          id: { in: postIds },
        },
        select: {
          id: true,
          title: true,
        },
      })

      const postMap = new Map(posts.map((p) => [p.id, p]))

      for (const group of likeGroups) {
        const post = postMap.get(group.postId)
        if (post && group._count.postId > 0) {
          // 해당 게시글의 최근 좋아요 중 하나의 사용자 이름 가져오기
          const recentLike = await prisma.mainLike.findFirst({
            where: {
              postId: group.postId,
              createdAt: {
                gte: fiveMinutesAgo,
              },
            },
            include: {
              user: {
                select: { name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })

          if (recentLike) {
            activities.push({
              id: `like-group-${group.postId}`,
              type: 'like',
              title: '좋아요',
              description:
                group._count.postId === 1
                  ? `"${post.title}" 글을 좋아합니다`
                  : `${recentLike.user.name}님 외 ${group._count.postId - 1}명이 "${post.title}" 글을 좋아합니다`,
              userName: recentLike.user.name || '알 수 없음',
              timestamp: recentLike.createdAt,
              metadata: {
                postId: post.id,
                postTitle: post.title,
              },
            })
          }
        }
      }
    }

    // 4. 커뮤니티 멤버 가입 (ACTIVE 상태만)
    const newMembers = await prisma.communityMember.findMany({
      where: {
        status: 'ACTIVE',
        joinedAt: {
          gte: fiveMinutesAgo,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
        community: {
          select: { name: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 5,
    })

    newMembers.forEach((member) => {
      activities.push({
        id: `member-${member.id}`,
        type: 'member_join',
        title: '커뮤니티 가입',
        description: `${member.community.name} 커뮤니티에 가입했습니다`,
        userName: member.user.name || '알 수 없음',
        timestamp: member.joinedAt,
        metadata: {
          communityName: member.community.name,
        },
      })
    })

    // 5. Redis에서 조회수 마일스톤 이벤트 가져오기
    try {
      const client = redis()
      if (!client) {
        console.warn('Redis client not available for view milestones')
        // Redis가 없으면 마일스톤 없이 계속 진행
      } else {
        const milestones = await client.lrange('view_milestones', 0, 4)

        for (const milestone of milestones) {
          const data = JSON.parse(milestone)

          // 5분 이내 이벤트만 포함
          if (new Date(data.timestamp) >= fiveMinutesAgo) {
            // 게시글 정보 가져오기
            const post = await prisma.mainPost.findUnique({
              where: { id: data.postId },
              select: {
                title: true,
                author: {
                  select: { name: true },
                },
              },
            })

            if (post) {
              activities.push({
                id: `milestone-${data.postId}-${data.viewCount}`,
                type: 'view_milestone',
                title: '조회수 마일스톤',
                description: `"${post.title}" 글이 ${data.viewCount}회 조회를 달성했습니다`,
                userName: post.author.name || '알 수 없음',
                timestamp: new Date(data.timestamp),
                metadata: {
                  postId: data.postId,
                  postTitle: post.title,
                  viewCount: data.viewCount,
                },
              })
            }
          }
        }
      }
    } catch (redisError) {
      console.error('Redis error:', redisError)
      // Redis 오류는 무시하고 계속 진행
    }

    // 모든 활동을 시간순으로 정렬 (최신 순)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // 최대 15개만 반환
    const limitedActivities = activities.slice(0, 15)

    return successResponse({
      activities: limitedActivities,
      count: limitedActivities.length,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}
