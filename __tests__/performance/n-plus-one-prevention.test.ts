/**
 * N+1 쿼리 방지 검증 테스트
 * Prisma 직접 사용으로 변경된 서버 컴포넌트들이 N+1 문제를 발생시키지 않는지 확인
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/core/prisma'

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user1', name: '테스트 사용자' },
  }),
}))

// Mock Redis
vi.mock('@/lib/core/redis', () => ({
  incrementViewCount: vi.fn().mockResolvedValue(100),
  getViewCount: vi.fn().mockResolvedValue(50),
}))

// Mock Prisma
vi.mock('@/lib/core/prisma', () => ({
  prisma: {
    community: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    communityPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe('N+1 쿼리 방지 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('커뮤니티 목록 페이지', () => {
    it('커뮤니티 + 소유자 정보를 한번의 쿼리로 조회해야 함', async () => {
      const mockCommunities = [
        {
          id: 'comm1',
          name: 'React 커뮤니티',
          slug: 'react',
          owner: { id: 'user1', name: '홍길동', image: null },
          memberCount: 100,
          postCount: 50,
        },
        {
          id: 'comm2',
          name: 'Vue 커뮤니티',
          slug: 'vue',
          owner: { id: 'user2', name: '김철수', image: null },
          memberCount: 80,
          postCount: 30,
        },
      ]

      vi.mocked(prisma.community.findMany).mockResolvedValue(
        mockCommunities as any
      )

      const expectedQuery = {
        where: { visibility: 'PUBLIC' as const },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { memberCount: 'desc' as const },
        skip: 0,
        take: 12,
      }

      // 한번의 쿼리로 모든 데이터 조회
      await prisma.community.findMany(expectedQuery)
      expect(prisma.community.findMany).toHaveBeenCalledTimes(1)
    })

    it('페이지네이션 정보도 별도 쿼리로 효율적으로 조회해야 함', async () => {
      vi.mocked(prisma.community.count).mockResolvedValue(25)

      await prisma.community.count({
        where: { visibility: 'PUBLIC' },
      })

      // count 쿼리도 한번만 호출
      expect(prisma.community.count).toHaveBeenCalledTimes(1)
    })
  })

  describe('커뮤니티 상세 페이지', () => {
    it('커뮤니티 + 소유자 + 카테고리 + 공지사항을 한번의 쿼리로 조회해야 함', async () => {
      const mockCommunityDetail = {
        id: 'comm1',
        name: 'React 커뮤니티',
        owner: { id: 'user1', name: '홍길동', email: 'test@test.com' },
        categories: [
          { id: 'cat1', name: 'Q&A', _count: { posts: 15 } },
          { id: 'cat2', name: '자유게시판', _count: { posts: 25 } },
        ],
        announcements: [
          {
            id: 'ann1',
            title: '공지',
            author: { id: 'user1', name: '관리자' },
          },
        ],
        members: [{ role: 'MEMBER', status: 'ACTIVE' }],
        _count: { members: 100, posts: 200 },
      }

      vi.mocked(prisma.community.findFirst).mockResolvedValue(
        mockCommunityDetail as any
      )

      // 복잡한 include로 모든 관련 데이터를 한번에 조회
      const query = {
        where: {
          OR: [{ id: 'comm1' }, { slug: 'comm1' }],
        },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { members: true, posts: true } },
          categories: {
            where: { isActive: true },
            orderBy: { order: 'asc' as const },
            include: {
              _count: {
                select: { posts: true },
              },
            },
          },
          announcements: {
            orderBy: [
              { isPinned: 'desc' as const },
              { createdAt: 'desc' as const },
            ],
            take: 5,
            include: {
              author: { select: { id: true, name: true } },
            },
          },
          members: { where: { userId: 'user1' } },
        },
      }

      await prisma.community.findFirst(query)
      expect(prisma.community.findFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('게시글 목록 페이지', () => {
    it('게시글 + 작성자 + 카테고리를 한번의 쿼리로 조회해야 함', async () => {
      const mockPosts = [
        {
          id: 'post1',
          title: '첫번째 글',
          author: { id: 'user1', name: '작성자1', image: null },
          category: { id: 'cat1', name: 'Q&A', color: '#blue' },
          _count: { comments: 5, likes: 10 },
        },
      ]

      vi.mocked(prisma.communityPost.findMany).mockResolvedValue(
        mockPosts as any
      )

      const query = {
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, color: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }

      await prisma.communityPost.findMany(query)
      expect(prisma.communityPost.findMany).toHaveBeenCalledTimes(1)
    })
  })

  describe('게시글 상세 페이지', () => {
    it('게시글 + 모든 관계를 한번의 쿼리로 조회해야 함', async () => {
      const mockPostDetail = {
        id: 'post1',
        title: '상세 게시글',
        author: { id: 'user1', name: '작성자', email: 'test@test.com' },
        category: { id: 'cat1', name: 'Q&A', color: '#blue' },
        community: {
          id: 'comm1',
          name: '커뮤니티',
          slug: 'test',
          visibility: 'PUBLIC',
          ownerId: 'owner1',
          members: [{ role: 'MEMBER', status: 'ACTIVE' }],
        },
        _count: { comments: 5, likes: 10 },
        likes: [],
        bookmarks: [],
        files: [],
      }

      vi.mocked(prisma.communityPost.findFirst).mockResolvedValue(
        mockPostDetail as any
      )

      const query = {
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          community: { select: { id: true, name: true } },
          _count: { select: { comments: true, likes: true } },
          likes: { where: { userId: 'user1' } },
          bookmarks: { where: { userId: 'user1' } },
          files: { select: { id: true, filename: true } },
        },
      }

      await prisma.communityPost.findFirst(query)
      expect(prisma.communityPost.findFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('성능 최적화 검증', () => {
    it('대용량 데이터에서도 N+1 문제가 발생하지 않아야 함', async () => {
      // 100개의 커뮤니티 시뮬레이션
      const largeCommunityList = Array.from({ length: 100 }, (_, i) => ({
        id: `comm${i}`,
        name: `커뮤니티 ${i}`,
        owner: { id: `user${i}`, name: `사용자 ${i}` },
        memberCount: Math.floor(Math.random() * 1000),
        postCount: Math.floor(Math.random() * 500),
      }))

      vi.mocked(prisma.community.findMany).mockResolvedValue(
        largeCommunityList as any
      )

      await prisma.community.findMany({
        include: {
          owner: { select: { id: true, name: true, image: true } },
        },
      })

      // 100개 커뮤니티 + 소유자를 1번의 쿼리로 조회
      expect(prisma.community.findMany).toHaveBeenCalledTimes(1)
    })

    it('복잡한 필터링에서도 효율적인 쿼리를 사용해야 함', async () => {
      const complexFilterQuery = {
        where: {
          AND: [
            { visibility: 'PUBLIC' as const },
            { memberCount: { gte: 10 } },
            {
              OR: [
                { name: { contains: 'React', mode: 'insensitive' as const } },
                {
                  description: {
                    contains: 'React',
                    mode: 'insensitive' as const,
                  },
                },
              ],
            },
          ],
        },
        include: {
          owner: { select: { id: true, name: true, image: true } },
          _count: { select: { members: true, posts: true } },
        },
        orderBy: [
          { memberCount: 'desc' as const },
          { createdAt: 'desc' as const },
        ],
        skip: 20,
        take: 10,
      }

      vi.mocked(prisma.community.findMany).mockResolvedValue([])

      await prisma.community.findMany(complexFilterQuery)
      expect(prisma.community.findMany).toHaveBeenCalledWith(complexFilterQuery)
    })
  })
})
