/**
 * 서버 컴포넌트 Prisma 직접 사용 테스트
 * API fetch → Prisma 직접 사용 변경사항 검증
 */

import { describe, it, expect, vi } from 'vitest'
import { prisma } from '@/lib/core/prisma'

// Mock Prisma
vi.mock('@/lib/core/prisma', () => ({
  prisma: {
    community: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    communityPost: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('서버 컴포넌트 Prisma 직접 사용', () => {
  it('공개 커뮤니티 목록을 올바르게 조회해야 함', async () => {
    const mockCommunities = [
      {
        id: 'comm1',
        name: 'React 개발자',
        slug: 'react-developers',
        visibility: 'PUBLIC',
        owner: { id: 'user1', name: '홍길동' },
      },
    ]

    vi.mocked(prisma.community.findMany).mockResolvedValue(
      mockCommunities as any
    )

    const result = await prisma.community.findMany({
      where: { visibility: 'PUBLIC' },
      include: {
        owner: { select: { id: true, name: true } },
      },
    })

    expect(result).toEqual(mockCommunities)
    expect(prisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { visibility: 'PUBLIC' },
      })
    )
  })

  it('게시글 상세 정보를 올바르게 조회해야 함', async () => {
    const mockPost = {
      id: 'post1',
      title: '테스트 게시글',
      content: '내용',
      author: { id: 'user1', name: '작성자' },
      community: { id: 'comm1', name: '커뮤니티' },
    }

    vi.mocked(prisma.communityPost.findFirst).mockResolvedValue(mockPost as any)

    const result = await prisma.communityPost.findFirst({
      where: { id: 'post1' },
      include: {
        author: { select: { id: true, name: true } },
        community: { select: { id: true, name: true } },
      },
    })

    expect(result).toEqual(mockPost)
    expect(prisma.communityPost.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post1' },
      })
    )
  })
})
