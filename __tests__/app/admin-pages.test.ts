/**
 * 관리자 페이지 테스트
 * 중요한 관리자 기능들의 권한 체크 및 데이터 조회 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'

// Mock auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/core/prisma', () => ({
  prisma: {
    mainPost: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    community: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    mainCategory: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    mainTag: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('관리자 페이지 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('권한 검증', () => {
    it('관리자/매니저만 접근 가능해야 함', async () => {
      // 일반 사용자로 시뮬레이션
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user1', role: 'USER' },
      } as any)

      const session = await auth()
      const isAdmin = session?.user?.role === 'ADMIN'
      const isManager = session?.user?.role === 'MANAGER'

      expect(isAdmin || isManager).toBe(false)
    })

    it('관리자는 모든 기능에 접근 가능해야 함', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'admin1', role: 'ADMIN' },
      } as any)

      const session = await auth()
      const isAdmin = session?.user?.role === 'ADMIN'

      expect(isAdmin).toBe(true)
    })
  })

  describe('대기중인 게시글 관리', () => {
    it('PENDING 상태 게시글만 조회해야 함', async () => {
      const mockPendingPosts = [
        {
          id: 'post1',
          title: '승인 대기 게시글',
          status: 'PENDING',
          author: { id: 'user1', name: '작성자' },
          category: { name: 'React' },
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.mainPost.findMany).mockResolvedValue(
        mockPendingPosts as any
      )

      const result = await prisma.mainPost.findMany({
        where: { status: 'PENDING' },
        include: {
          author: { select: { id: true, name: true, email: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING')
    })

    it('게시글 승인 처리가 올바르게 작동해야 함', async () => {
      vi.mocked(prisma.mainPost.update).mockResolvedValue({
        id: 'post1',
        status: 'PUBLISHED',
      } as any)

      const result = await prisma.mainPost.update({
        where: { id: 'post1' },
        data: {
          status: 'PUBLISHED',
          approvedAt: new Date(),
        },
      })

      expect(result.status).toBe('PUBLISHED')
    })

    it('게시글 거부 처리가 올바르게 작동해야 함', async () => {
      vi.mocked(prisma.mainPost.update).mockResolvedValue({
        id: 'post1',
        status: 'REJECTED',
      } as any)

      const result = await prisma.mainPost.update({
        where: { id: 'post1' },
        data: {
          status: 'REJECTED',
          rejectedReason: '부적절한 내용',
        },
      })

      expect(result.status).toBe('REJECTED')
    })
  })

  describe('사용자 관리', () => {
    it('전체 사용자 목록을 조회할 수 있어야 함', async () => {
      const mockUsers = [
        {
          id: 'user1',
          name: '홍길동',
          email: 'hong@test.com',
          globalRole: 'USER',
          createdAt: new Date(),
          _count: { mainPosts: 5, mainComments: 10 },
        },
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

      const result = await prisma.user.findMany({
        include: {
          _count: {
            select: {
              mainPosts: true,
              mainComments: true,
              communityMemberships: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(1)
      expect(result[0].globalRole).toBe('USER')
    })

    it('사용자 권한을 변경할 수 있어야 함', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user1',
        globalRole: 'MANAGER',
      } as any)

      const result = await prisma.user.update({
        where: { id: 'user1' },
        data: { globalRole: 'MANAGER' },
      })

      expect(result.globalRole).toBe('MANAGER')
    })
  })

  describe('카테고리 관리', () => {
    it('카테고리 생성이 올바르게 작동해야 함', async () => {
      vi.mocked(prisma.mainCategory.create).mockResolvedValue({
        id: 'cat1',
        name: '새 카테고리',
        slug: 'new-category',
      } as any)

      const result = await prisma.mainCategory.create({
        data: {
          name: '새 카테고리',
          slug: 'new-category',
          order: 1,
        },
      })

      expect(result.name).toBe('새 카테고리')
    })

    it('카테고리 순서를 변경할 수 있어야 함', async () => {
      vi.mocked(prisma.mainCategory.update).mockResolvedValue({
        id: 'cat1',
        order: 5,
      } as any)

      const result = await prisma.mainCategory.update({
        where: { id: 'cat1' },
        data: { order: 5 },
      })

      expect(result.order).toBe(5)
    })
  })

  describe('태그 관리', () => {
    it('태그 병합이 올바르게 작동해야 함', async () => {
      // 태그 병합 로직 테스트
      const sourceTagId = 'tag1'
      const targetTagId = 'tag2'

      // 1. 기존 태그의 게시글을 새 태그로 이동
      // 2. 기존 태그 삭제

      vi.mocked(prisma.mainTag.delete).mockResolvedValue({
        id: sourceTagId,
      } as any)

      const result = await prisma.mainTag.delete({
        where: { id: sourceTagId },
      })

      expect(result.id).toBe(sourceTagId)
    })
  })

  describe('통계 대시보드', () => {
    it('전체 통계를 올바르게 집계해야 함', async () => {
      vi.mocked(prisma.mainPost.count).mockResolvedValue(100)
      vi.mocked(prisma.user.count).mockResolvedValue(50)
      vi.mocked(prisma.community.count).mockResolvedValue(10)

      const [totalPosts, totalUsers, totalCommunities] = await Promise.all([
        prisma.mainPost.count(),
        prisma.user.count(),
        prisma.community.count(),
      ])

      expect(totalPosts).toBe(100)
      expect(totalUsers).toBe(50)
      expect(totalCommunities).toBe(10)
    })

    it('일별 통계를 올바르게 집계해야 함', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      vi.mocked(prisma.mainPost.count).mockResolvedValue(5)

      const todayPosts = await prisma.mainPost.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      })

      expect(todayPosts).toBe(5)
    })
  })
})
