import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { errorResponse, successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('인증이 필요합니다', 401)
    }

    const { id: communityId } = await params

    // 커뮤니티 존재 여부 및 권한 확인
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
      },
    })

    if (!community) {
      return errorResponse('커뮤니티를 찾을 수 없습니다', 404)
    }

    // OWNER만 데이터 내보내기 가능
    const membership = community.members[0]
    if (!membership || membership.role !== 'OWNER') {
      return errorResponse('커뮤니티 소유자만 데이터를 내보낼 수 있습니다', 403)
    }

    // 모든 관련 데이터 조회
    const fullData = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        // 기본 정보
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },

        // 멤버 정보
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },

        // 카테고리
        categories: {
          include: {
            _count: {
              select: { posts: true },
            },
          },
        },

        // 태그
        tags: {
          include: {
            _count: {
              select: { posts: true },
            },
          },
        },

        // 게시글
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            category: true,
            tags: {
              include: {
                tag: true,
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
            likes: {
              select: {
                userId: true,
                createdAt: true,
              },
            },
            bookmarks: {
              select: {
                userId: true,
                createdAt: true,
              },
            },
            files: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                url: true,
              },
            },
          },
        },

        // 공지사항
        announcements: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },

        // 채팅 채널
        chatChannels: {
          include: {
            messages: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
              take: 1000, // 최근 1000개 메시지만
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // 내보낼 데이터 정리
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      community: {
        id: fullData?.id,
        name: fullData?.name,
        slug: fullData?.slug,
        description: fullData?.description,
        visibility: fullData?.visibility,
        joinPolicy: fullData?.joinPolicy,
        icon: fullData?.icon,
        banner: fullData?.banner,
        createdAt: fullData?.createdAt,
        settings: fullData?.settings,
      },
      owner: fullData?.owner,
      members: fullData?.members.map((m) => ({
        userId: m.userId,
        user: m.user,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
      categories: fullData?.categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        icon: c.icon,
        order: c.order,
        isActive: c.isActive,
        postCount: c._count.posts,
      })),
      tags: fullData?.tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        postCount: t._count.posts,
      })),
      posts: fullData?.posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        excerpt: p.excerpt,
        slug: p.slug,
        status: p.status,
        isPinned: p.isPinned,
        author: p.author,
        category: p.category,
        tags: p.tags.map((t) => t.tag),
        comments: p.comments,
        likes: p.likes,
        bookmarks: p.bookmarks,
        files: p.files,
        viewCount: p.viewCount,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      announcements: fullData?.announcements,
      chatChannels: fullData?.chatChannels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        type: ch.type,
        messages: ch.messages,
        members: ch.members,
      })),
      statistics: {
        totalMembers: fullData?.members.length || 0,
        totalPosts: fullData?.posts.length || 0,
        totalComments:
          fullData?.posts.reduce((acc, p) => acc + p.comments.length, 0) || 0,
        totalCategories: fullData?.categories.length || 0,
        totalTags: fullData?.tags.length || 0,
      },
    }

    // JSON 파일로 반환
    const jsonString = JSON.stringify(exportData, null, 2)
    const fileName = `community-${fullData?.slug}-export-${Date.now()}.json`

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
