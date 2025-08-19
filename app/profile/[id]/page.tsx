import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/core/prisma'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfileActivity } from '@/components/profile/ProfileActivity'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          mainPosts: {
            where: { status: 'PUBLISHED' },
          },
          communityPosts: {
            where: { status: 'PUBLISHED' },
          },
          mainComments: true,
          communityComments: true,
          mainBookmarks: true,
          communityMemberships: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
  })

  return user
}

async function getRecentActivity(userId: string) {
  const activities = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const [posts, comments, likes] = await Promise.all([
      prisma.mainPost.count({
        where: {
          authorId: userId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.mainComment.count({
        where: {
          authorId: userId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.mainLike.count({
        where: {
          userId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
    ])

    activities.push({
      date: date.toLocaleDateString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
      }),
      count: posts + comments + likes,
    })
  }

  return activities
}

async function getUserPosts(userId: string) {
  const [mainPosts, communityPosts] = await Promise.all([
    prisma.mainPost.findMany({
      where: { authorId: userId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        createdAt: true,
        viewCount: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.communityPost.findMany({
      where: { authorId: userId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        viewCount: true,
        communityId: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        community: {
          select: { name: true },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // 데이터 변환 로직
  const formattedPosts = [
    ...mainPosts.map((p) => {
      const formatted = {
        ...p,
        type: 'MAIN' as const,
        summary: p.excerpt || '',
        thumbnail: null,
        author: p.author,
        categoryId: p.category?.id || 'general',
        categoryName: p.category?.name || '일반',
        categorySlug: p.category?.slug || 'general',
        categoryColor: p.category?.color || '#6366f1',
        categoryIcon: p.category?.icon || null,
        tags:
          p.tags?.map((t) => ({
            id: t.tag.id,
            name: t.tag.name,
            slug: t.tag.slug,
            color: t.tag.color || null,
          })) || [],
        _count: {
          mainComments: p._count.comments,
          mainLikes: p._count.likes,
        },
      }
      return formatted
    }),
    ...communityPosts.map((p) => {
      const formatted = {
        ...p,
        type: 'COMMUNITY' as const,
        slug: p.id,
        thumbnail: null,
        summary: p.content.substring(0, 150),
        excerpt: null,
        author: p.author,
        communityName: p.community.name,
        categoryId: 'community',
        categoryName: p.community.name,
        categorySlug: 'community',
        categoryColor: '#6366f1', // 기본 색상 설정
        categoryIcon: null,
        tags: [], // 커뮤니티 포스트는 태그가 없음
        _count: {
          communityComments: p._count.comments,
          communityLikes: p._count.likes,
        },
      }
      return formatted
    }),
  ]

  return formattedPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

async function getUserComments(userId: string) {
  const [mainComments, communityComments] = await Promise.all([
    // 메인 댓글 조회
    prisma.mainComment.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isEdited: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            globalRole: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
                icon: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),

    // 커뮤니티 댓글 조회
    prisma.communityComment.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isEdited: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            globalRole: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            communityId: true,
            community: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ])

  // 데이터 통합 및 정규화
  const allComments = [
    // 메인 댓글 변환
    ...mainComments.map((c) => ({
      ...c,
      author: {
        id: c.author.id,
        name: c.author.name,
        image: c.author.image,
        badge: c.author.globalRole === 'ADMIN' ? 'ADMIN' : undefined,
      },
      post: {
        ...c.post,
        type: 'MAIN' as const,
        categoryId: c.post.category?.id,
        categoryName: c.post.category?.name || '일반',
        categorySlug: c.post.category?.slug || 'general',
        categoryColor: c.post.category?.color || '#6366f1',
        categoryIcon: c.post.category?.icon,
      },
      stats: {
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
      },
    })),

    // 커뮤니티 댓글 변환
    ...communityComments.map((c) => ({
      ...c,
      author: {
        id: c.author.id,
        name: c.author.name,
        image: c.author.image,
        badge: c.author.globalRole === 'ADMIN' ? 'ADMIN' : undefined,
      },
      post: {
        id: c.post.id,
        title: c.post.title,
        slug: c.post.id, // 커뮤니티 게시글은 slug 대신 id 사용
        type: 'COMMUNITY' as const,
        communityId: c.post.communityId,
        communityName: c.post.community.name,
      },
      stats: {
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
      },
    })),
  ]

  // 날짜 기준으로 정렬
  return allComments
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 30) // 최대 30개로 제한
}

async function getUserBookmarks(userId: string) {
  const bookmarks = await prisma.mainPost.findMany({
    where: {
      bookmarks: {
        some: { userId },
      },
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
      viewCount: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          icon: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return bookmarks.map((p) => ({
    ...p,
    type: 'MAIN' as const,
    summary: p.excerpt,
    thumbnail: null,
    author: p.author,
    categoryId: p.category?.id,
    categoryName: p.category?.name || '일반',
    categorySlug: p.category?.slug || 'general',
    categoryColor: p.category?.color,
    categoryIcon: p.category?.icon,
    tags:
      p.tags?.map((t) => ({
        id: t.tag.id,
        name: t.tag.name,
        slug: t.tag.slug,
        color: t.tag.color,
      })) || [],
    _count: {
      mainComments: p._count.comments,
      mainLikes: p._count.likes,
    },
  }))
}

async function getUserCommunities(userId: string) {
  const memberships = await prisma.communityMember.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      community: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => ({
    id: m.id,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    community: {
      id: m.community.id,
      name: m.community.name,
      slug: m.community.slug,
      description: m.community.description,
      avatar: m.community.avatar,
      banner: m.community.banner,
      visibility: m.community.visibility,
      memberCount: m.community._count.members,
      postCount: m.community._count.posts,
      createdAt: m.community.createdAt.toISOString(),
      updatedAt: m.community.updatedAt.toISOString(),
      owner: {
        name: m.community.owner.name,
        image: m.community.owner.image,
      },
      _count: m.community._count,
    },
  }))
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const [profile, recentActivity, posts, comments, bookmarks, communities] =
    await Promise.all([
      getUserProfile(id),
      getRecentActivity(id),
      getUserPosts(id),
      getUserComments(id),
      getUserBookmarks(id),
      getUserCommunities(id),
    ])

  if (!profile) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === profile.id

  const stats = {
    mainPosts: profile._count.mainPosts,
    communityPosts: profile._count.communityPosts,
    mainComments:
      (profile._count.mainComments || 0) +
      (profile._count.communityComments || 0),
    mainBookmarks: profile._count.mainBookmarks,
    communities: profile._count.communityMemberships,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-8">
        <ProfileHeader
          profile={{
            ...profile,
            createdAt: profile.createdAt.toISOString(),
            _count: {
              mainPosts: profile._count.mainPosts,
              communityPosts: profile._count.communityPosts,
              mainComments:
                (profile._count.mainComments || 0) +
                (profile._count.communityComments || 0),
              mainBookmarks: profile._count.mainBookmarks,
              communityMemberships: profile._count.communityMemberships,
            },
          }}
          isOwnProfile={isOwnProfile}
        />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <ProfileActivity activities={recentActivity} />
            <ProfileTabs
              userId={id}
              stats={stats}
              posts={posts}
              comments={comments}
              bookmarks={bookmarks}
              communities={communities}
              currentUserId={session?.user?.id}
            />
          </div>

          <div className="space-y-8">
            <ProfileSidebar
              userId={id}
              stats={stats}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
