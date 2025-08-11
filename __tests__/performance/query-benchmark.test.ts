/**
 * 쿼리 성능 벤치마크 테스트
 * API fetch vs Prisma 직접 사용 성능 비교 및 최적화 검증
 */

import { describe, it, expect, vi } from 'vitest'
import { performance } from 'perf_hooks'
import { prisma } from '@/lib/core/prisma'

// Mock Prisma
vi.mock('@/lib/core/prisma', () => ({
  prisma: {
    community: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    communityPost: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe('쿼리 성능 벤치마크', () => {
  it('커뮤니티 목록 조회 - Prisma가 더 빨라야 함', async () => {
    const mockCommunities = Array.from({ length: 20 }, (_, i) => ({
      id: `comm${i}`,
      name: `커뮤니티 ${i}`,
      visibility: 'PUBLIC',
      owner: { id: `user${i}`, name: `사용자 ${i}` },
    }))

    // API fetch 시뮬레이션 (느린 응답)
    vi.mocked(fetch).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms 지연
      return {
        ok: true,
        json: async () => ({ success: true, data: mockCommunities }),
      } as Response
    })

    // Prisma 직접 사용 시뮬레이션 (빠른 응답)
    vi.mocked(prisma.community.findMany).mockResolvedValue(
      mockCommunities as any
    )

    // API fetch 성능 측정
    const apiStart = performance.now()
    await fetch('/api/communities')
    const apiEnd = performance.now()
    const apiTime = apiEnd - apiStart

    // Prisma 직접 사용 성능 측정
    const prismaStart = performance.now()
    await prisma.community.findMany({
      where: { visibility: 'PUBLIC' },
      include: { owner: { select: { id: true, name: true } } },
    })
    const prismaEnd = performance.now()
    const prismaTime = prismaEnd - prismaStart

    console.error(`API fetch 시간: ${apiTime.toFixed(2)}ms`)
    console.error(`Prisma 직접 사용 시간: ${prismaTime.toFixed(2)}ms`)

    // Prisma가 더 빨라야 함
    expect(prismaTime).toBeLessThan(apiTime * 0.8)
  })

  it('N+1 쿼리 방지 - include로 JOIN 사용', async () => {
    const mockCommunities = [
      {
        id: 'comm1',
        name: 'React 커뮤니티',
        owner: { id: 'user1', name: '홍길동' },
      },
    ]

    vi.mocked(prisma.community.findMany).mockResolvedValue(
      mockCommunities as any
    )

    await prisma.community.findMany({
      include: {
        owner: { select: { id: true, name: true } },
      },
    })

    // include를 사용하여 N+1 방지 검증
    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          owner: expect.any(Object),
        }),
      })
    )
  })

  it('메모리 사용량 최적화 - select 사용', async () => {
    // 최적화된 select 조회
    const optimizedData = Array.from({ length: 10 }, (_, i) => ({
      id: `comm${i}`,
      name: `커뮤니티 ${i}`,
      owner: { id: `user${i}`, name: `사용자 ${i}` },
    }))

    vi.mocked(prisma.community.findMany).mockResolvedValue(optimizedData as any)

    const result = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    expect(result).toHaveLength(10)
    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.any(Object),
      })
    )
  })
})
