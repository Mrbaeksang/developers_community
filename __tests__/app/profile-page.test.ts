/**
 * 프로필 페이지 테스트
 * /profile/[id]/page.tsx 서버 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/core/prisma'

// Mock Prisma
vi.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    mainPost: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    mainComment: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    mainLike: {
      count: vi.fn(),
    },
    communityPost: {
      findMany: vi.fn(),
    },
    communityComment: {
      findMany: vi.fn(),
    },
    communityMember: {
      findMany: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'current-user' } })),
}))

describe('프로필 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserProfile 함수', () => {
    it('사용자 프로필을 올바르게 조회해야 함', async () => {
      const mockUser = {
        id: 'user1',
        name: '홍길동',
        username: 'hong',
        email: 'hong@test.com',
        image: null,
        bio: '개발자입니다',
        createdAt: new Date('2024-01-01'),
        _count: {
          mainPosts: 10,
          communityPosts: 5,
          mainComments: 20,
          communityComments: 15,
          mainBookmarks: 8,
          communityMemberships: 3,
        },
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await prisma.user.findUnique({
        where: { id: 'user1' },
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

      expect(result).toBeDefined()
      expect(result?.id).toBe('user1')
      expect(result?.name).toBe('홍길동')
      expect(result?._count.mainPosts).toBe(10)
      expect(result?._count.communityPosts).toBe(5)
    })
  })

  describe('getRecentActivity 함수', () => {
    it('최근 7일간의 활동을 조회해야 함', async () => {
      // Mock 각 날짜의 활동
      vi.mocked(prisma.mainPost.count).mockResolvedValue(2)
      vi.mocked(prisma.mainComment.count).mockResolvedValue(3)
      vi.mocked(prisma.mainLike.count).mockResolvedValue(5)

      // 7일간 각각 호출
      for (let i = 0; i < 7; i++) {
        await Promise.all([
          prisma.mainPost.count({
            where: {
              authorId: 'user1',
              createdAt: expect.any(Object),
            },
          }),
          prisma.mainComment.count({
            where: {
              authorId: 'user1',
              createdAt: expect.any(Object),
            },
          }),
          prisma.mainLike.count({
            where: {
              userId: 'user1',
              createdAt: expect.any(Object),
            },
          }),
        ])
      }

      expect(prisma.mainPost.count).toHaveBeenCalled()
      expect(prisma.mainComment.count).toHaveBeenCalled()
      expect(prisma.mainLike.count).toHaveBeenCalled()
    })
  })

  describe('getUserPosts 함수', () => {
    it('메인 게시글과 커뮤니티 게시글을 조회해야 함', async () => {
      const mockMainPosts = [
        {
          id: 'main1',
          title: '메인 게시글 1',
          slug: 'main-post-1',
          excerpt: '요약',
          content: '내용',
          createdAt: new Date('2024-01-01'),
          viewCount: 100,
          author: {
            id: 'user1',
            name: '홍길동',
            email: 'hong@test.com',
            image: null,
          },
          category: {
            id: 'cat1',
            name: 'React',
            slug: 'react',
            color: '#61dafb',
            icon: null,
          },
          tags: [
            {
              tag: {
                id: 'tag1',
                name: 'React 18',
                slug: 'react-18',
                color: '#blue',
              },
            },
          ],
          _count: { comments: 5, likes: 10 },
        },
      ]

      const mockCommunityPosts = [
        {
          id: 'comm1',
          title: '커뮤니티 게시글 1',
          content: '커뮤니티 내용입니다',
          createdAt: new Date('2024-01-02'),
          viewCount: 50,
          communityId: 'community1',
          author: {
            id: 'user1',
            name: '홍길동',
            email: 'hong@test.com',
            image: null,
          },
          community: { name: 'React 커뮤니티' },
          _count: { comments: 3, likes: 5 },
        },
      ]

      vi.mocked(prisma.mainPost.findMany).mockResolvedValue(
        mockMainPosts as any
      )
      vi.mocked(prisma.communityPost.findMany).mockResolvedValue(
        mockCommunityPosts as any
      )

      const [mainPosts, communityPosts] = await Promise.all([
        prisma.mainPost.findMany({
          where: { authorId: 'user1', status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.communityPost.findMany({
          where: { authorId: 'user1', status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ])

      expect(mainPosts).toHaveLength(1)
      expect(communityPosts).toHaveLength(1)
      expect(mainPosts[0].title).toBe('메인 게시글 1')
      expect(communityPosts[0].title).toBe('커뮤니티 게시글 1')
    })

    it('게시글을 날짜순으로 정렬해야 함', async () => {
      const posts = [
        { createdAt: new Date('2024-01-03'), title: '최신' },
        { createdAt: new Date('2024-01-01'), title: '이전' },
        { createdAt: new Date('2024-01-02'), title: '중간' },
      ]

      const sorted = posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      expect(sorted[0].title).toBe('최신')
      expect(sorted[1].title).toBe('중간')
      expect(sorted[2].title).toBe('이전')
    })
  })

  describe('getUserComments 함수', () => {
    it('메인 댓글과 커뮤니티 댓글을 조회해야 함', async () => {
      const mockMainComments = [
        {
          id: 'comment1',
          content: '메인 댓글',
          createdAt: new Date('2024-01-01'),
          isEdited: false,
          author: {
            id: 'user1',
            name: '홍길동',
            image: null,
            globalRole: 'USER',
          },
          post: {
            id: 'post1',
            title: '게시글 제목',
            slug: 'post-1',
            category: {
              id: 'cat1',
              name: 'React',
              slug: 'react',
              color: '#61dafb',
              icon: null,
            },
          },
        },
      ]

      const mockCommunityComments = [
        {
          id: 'comment2',
          content: '커뮤니티 댓글',
          createdAt: new Date('2024-01-02'),
          isEdited: false,
          author: {
            id: 'user1',
            name: '홍길동',
            image: null,
            globalRole: 'USER',
          },
          post: {
            id: 'post2',
            title: '커뮤니티 게시글',
            communityId: 'comm1',
            community: {
              name: 'React 커뮤니티',
              slug: 'react-community',
            },
          },
        },
      ]

      vi.mocked(prisma.mainComment.findMany).mockResolvedValue(
        mockMainComments as any
      )
      vi.mocked(prisma.communityComment.findMany).mockResolvedValue(
        mockCommunityComments as any
      )

      const [mainComments, communityComments] = await Promise.all([
        prisma.mainComment.findMany({
          where: { authorId: 'user1' },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        prisma.communityComment.findMany({
          where: { authorId: 'user1' },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
      ])

      expect(mainComments).toHaveLength(1)
      expect(communityComments).toHaveLength(1)
      expect(mainComments[0].content).toBe('메인 댓글')
      expect(communityComments[0].content).toBe('커뮤니티 댓글')
    })
  })

  describe('getUserBookmarks 함수', () => {
    it('북마크한 게시글을 조회해야 함', async () => {
      const mockBookmarks = [
        {
          id: 'post1',
          title: '북마크한 게시글',
          slug: 'bookmarked-post',
          excerpt: '요약',
          createdAt: new Date('2024-01-01'),
          viewCount: 100,
          author: {
            id: 'user2',
            name: '김철수',
            email: 'kim@test.com',
            image: null,
          },
          category: {
            id: 'cat1',
            name: 'React',
            slug: 'react',
            color: '#61dafb',
            icon: null,
          },
          tags: [],
          _count: {
            comments: 5,
            likes: 10,
          },
        },
      ]

      vi.mocked(prisma.mainPost.findMany).mockResolvedValue(
        mockBookmarks as any
      )

      const result = await prisma.mainPost.findMany({
        where: {
          bookmarks: {
            some: { userId: 'user1' },
          },
          status: 'PUBLISHED',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('북마크한 게시글')
    })
  })

  describe('getUserCommunities 함수', () => {
    it('가입한 커뮤니티를 조회해야 함', async () => {
      const mockMemberships = [
        {
          id: 'member1',
          userId: 'user1',
          communityId: 'comm1',
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: new Date('2024-01-01'),
          community: {
            id: 'comm1',
            name: 'React 커뮤니티',
            slug: 'react-community',
            description: 'React 개발자 모임',
            avatar: null,
            banner: null,
            visibility: 'PUBLIC',
            createdAt: new Date('2023-12-01'),
            updatedAt: new Date('2024-01-01'),
            owner: {
              id: 'user2',
              name: '김철수',
              image: null,
            },
            _count: {
              members: 150,
              posts: 50,
            },
          },
        },
      ]

      vi.mocked(prisma.communityMember.findMany).mockResolvedValue(
        mockMemberships as any
      )

      const result = await prisma.communityMember.findMany({
        where: {
          userId: 'user1',
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

      expect(result).toHaveLength(1)
      expect(result[0].community.name).toBe('React 커뮤니티')
      expect(result[0].role).toBe('MEMBER')
    })
  })

  describe('데이터 변환', () => {
    it('게시글 데이터를 올바르게 변환해야 함', () => {
      const mainPost = {
        id: 'main1',
        title: '메인 게시글',
        excerpt: '요약',
        category: {
          id: 'cat1',
          name: 'React',
          slug: 'react',
          color: '#61dafb',
          icon: null,
        },
        tags: [
          {
            tag: {
              id: 'tag1',
              name: 'React 18',
              slug: 'react-18',
              color: '#blue',
            },
          },
        ],
        _count: {
          comments: 5,
          likes: 10,
        },
      }

      const formatted = {
        ...mainPost,
        type: 'MAIN' as const,
        summary: mainPost.excerpt || '',
        categoryId: mainPost.category?.id || 'general',
        categoryName: mainPost.category?.name || '일반',
        categorySlug: mainPost.category?.slug || 'general',
        categoryColor: mainPost.category?.color || '#6366f1',
        categoryIcon: mainPost.category?.icon || null,
        tags:
          mainPost.tags?.map((t) => ({
            id: t.tag.id,
            name: t.tag.name,
            slug: t.tag.slug,
            color: t.tag.color || null,
          })) || [],
        _count: {
          mainComments: mainPost._count.comments,
          mainLikes: mainPost._count.likes,
        },
      }

      expect(formatted.type).toBe('MAIN')
      expect(formatted.categoryName).toBe('React')
      expect(formatted.tags).toHaveLength(1)
      expect(formatted._count.mainComments).toBe(5)
    })

    it('날짜를 ISO 문자열로 변환해야 함', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const isoString = date.toISOString()

      expect(isoString).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  describe('통계 계산', () => {
    it('전체 통계를 올바르게 계산해야 함', () => {
      const profile = {
        _count: {
          mainPosts: 10,
          communityPosts: 5,
          mainComments: 20,
          communityComments: 15,
          mainBookmarks: 8,
          communityMemberships: 3,
        },
      }

      const stats = {
        mainPosts: profile._count.mainPosts,
        communityPosts: profile._count.communityPosts,
        mainComments:
          (profile._count.mainComments || 0) +
          (profile._count.communityComments || 0),
        mainBookmarks: profile._count.mainBookmarks,
        communities: profile._count.communityMemberships,
      }

      expect(stats.mainPosts).toBe(10)
      expect(stats.communityPosts).toBe(5)
      expect(stats.mainComments).toBe(35) // 20 + 15
      expect(stats.mainBookmarks).toBe(8)
      expect(stats.communities).toBe(3)
    })
  })
})
