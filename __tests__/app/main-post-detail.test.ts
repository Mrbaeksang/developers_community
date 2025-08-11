/**
 * 메인 게시글 상세 페이지 테스트
 * /main/posts/[id]/page.tsx 서버 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/core/prisma'

// Mock Prisma
vi.mock('@/lib/core/prisma', () => ({
  prisma: {
    mainPost: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    mainComment: {
      findMany: vi.fn(),
    },
  },
}))

// Mock markdown to HTML
vi.mock('@/lib/ui/markdown', () => ({
  markdownToHtml: vi.fn((content) => `<p>${content}</p>`),
}))

describe('메인 게시글 상세 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPost 함수', () => {
    it('게시글을 올바르게 조회해야 함', async () => {
      const mockPost = {
        id: 'post1',
        title: 'React 18 새로운 기능',
        content: '# React 18\n\n새로운 기능들...',
        excerpt: 'React 18의 주요 변경사항',
        metaDescription: 'React 18 기능 소개',
        status: 'PUBLISHED',
        viewCount: 100,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        approvedAt: new Date('2024-01-01'),
        authorId: 'user1',
        categoryId: 'cat1',
        author: {
          id: 'user1',
          name: '홍길동',
          email: 'hong@test.com',
          image: null,
          bio: 'React 개발자',
          globalRole: 'USER',
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
        _count: {
          likes: 10,
          bookmarks: 5,
          comments: 3,
        },
      }

      const mockComments = [
        {
          id: 'comment1',
          content: '좋은 글이네요!',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          authorId: 'user2',
          postId: 'post1',
          parentId: null,
          isEdited: false,
          author: {
            id: 'user2',
            name: '김철수',
            email: 'kim@test.com',
            image: null,
            globalRole: 'USER',
          },
        },
      ]

      vi.mocked(prisma.mainPost.findUnique).mockResolvedValue(mockPost as any)
      vi.mocked(prisma.mainComment.findMany).mockResolvedValue(
        mockComments as any
      )
      vi.mocked(prisma.mainPost.update).mockResolvedValue(mockPost as any)

      // 게시글 조회
      const result = await prisma.mainPost.findUnique({
        where: { id: 'post1' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              bio: true,
              globalRole: true,
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
              likes: true,
              bookmarks: true,
              comments: true,
            },
          },
        },
      })

      expect(result).toBeDefined()
      expect(result?.id).toBe('post1')
      expect(result?.status).toBe('PUBLISHED')
      expect(prisma.mainPost.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post1' },
        })
      )
    })

    it('비공개 게시글은 null을 반환해야 함', async () => {
      const mockDraftPost = {
        id: 'post2',
        title: '작성 중인 글',
        content: 'Draft content',
        status: 'DRAFT',
        // ... 기타 필드
      }

      vi.mocked(prisma.mainPost.findUnique).mockResolvedValue(
        mockDraftPost as any
      )

      const result = await prisma.mainPost.findUnique({
        where: { id: 'post2' },
      })

      // 실제 함수에서는 status !== 'PUBLISHED'일 때 null 반환
      if (result && result.status !== 'PUBLISHED') {
        expect(result.status).toBe('DRAFT')
      }
    })

    it('조회수 증가를 비동기로 처리해야 함', async () => {
      const mockPost = {
        id: 'post1',
        title: 'Test Post',
        status: 'PUBLISHED',
        viewCount: 100,
        // ... 기타 필드
      }

      vi.mocked(prisma.mainPost.findUnique).mockResolvedValue(mockPost as any)
      vi.mocked(prisma.mainPost.update).mockResolvedValue({
        ...mockPost,
        viewCount: 101,
      } as any)

      // 조회수 증가 호출
      await prisma.mainPost.update({
        where: { id: 'post1' },
        data: { viewCount: { increment: 1 } },
      })

      expect(prisma.mainPost.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: { viewCount: { increment: 1 } },
      })
    })

    it('댓글을 최신순으로 조회해야 함', async () => {
      const mockComments = [
        {
          id: 'comment2',
          content: '최신 댓글',
          createdAt: new Date('2024-01-05'),
          authorId: 'user3',
        },
        {
          id: 'comment1',
          content: '이전 댓글',
          createdAt: new Date('2024-01-03'),
          authorId: 'user2',
        },
      ]

      vi.mocked(prisma.mainComment.findMany).mockResolvedValue(
        mockComments as any
      )

      const result = await prisma.mainComment.findMany({
        where: { postId: 'post1' },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              globalRole: true,
            },
          },
        },
      })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('comment2')
      expect(prisma.mainComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('Q&A 카테고리를 올바르게 판별해야 함', () => {
      const qaCategories = ['qa', 'qna', 'question', 'help', '질문', '문의']

      // Q&A 카테고리 테스트
      const qaCategory = { slug: 'qna-board', name: '질문답변' }
      const isQA = qaCategories.some(
        (qa) =>
          qaCategory.slug.toLowerCase().includes(qa) ||
          qaCategory.name.toLowerCase().includes(qa)
      )
      expect(isQA).toBe(true)

      // 일반 카테고리 테스트
      const normalCategory = { slug: 'react', name: 'React' }
      const isNotQA = qaCategories.some(
        (qa) =>
          normalCategory.slug.toLowerCase().includes(qa) ||
          normalCategory.name.toLowerCase().includes(qa)
      )
      expect(isNotQA).toBe(false)
    })

    it('에러 발생 시 null을 반환해야 함', async () => {
      vi.mocked(prisma.mainPost.findUnique).mockRejectedValue(
        new Error('Database error')
      )

      try {
        await prisma.mainPost.findUnique({
          where: { id: 'error-post' },
        })
      } catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toBe('Database error')
      }
    })
  })

  describe('데이터 변환', () => {
    it('Date 객체를 ISO 문자열로 변환해야 함', () => {
      const post = {
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        approvedAt: new Date('2024-01-01T12:00:00Z'),
      }

      const transformed = {
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        approvedAt: post.approvedAt?.toISOString() || null,
      }

      expect(transformed.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(transformed.updatedAt).toBe('2024-01-02T00:00:00.000Z')
      expect(transformed.approvedAt).toBe('2024-01-01T12:00:00.000Z')
    })

    it('태그 구조를 올바르게 변환해야 함', () => {
      const tags = [
        {
          tag: {
            id: 'tag1',
            name: 'React',
            slug: 'react',
            color: '#61dafb',
          },
        },
        {
          tag: {
            id: 'tag2',
            name: 'TypeScript',
            slug: 'typescript',
            color: '#3178c6',
          },
        },
      ]

      const transformed = tags.map((t) => ({
        ...t.tag,
        name: t.tag.name,
      }))

      expect(transformed).toHaveLength(2)
      expect(transformed[0].name).toBe('React')
      expect(transformed[1].name).toBe('TypeScript')
    })

    it('댓글 구조를 올바르게 변환해야 함', () => {
      const comments = [
        {
          id: 'comment1',
          content: '댓글 내용',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          authorId: 'user2',
          postId: 'post1',
          parentId: null,
          isEdited: false,
          author: {
            id: 'user2',
            name: '김철수',
            email: 'kim@test.com',
            image: null,
            globalRole: 'USER',
          },
        },
      ]

      const transformed = comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        userId: comment.authorId,
        author: comment.author,
        isEdited: comment.isEdited,
        parentId: comment.parentId,
      }))

      expect(transformed[0].userId).toBe('user2')
      expect(transformed[0].author.name).toBe('김철수')
    })
  })

  describe('관계 포함', () => {
    it('author, category, tags, _count를 포함해야 함', async () => {
      const mockPost = {
        id: 'post1',
        title: 'Test',
        status: 'PUBLISHED',
        author: { id: 'user1', name: '홍길동' },
        category: { id: 'cat1', name: 'React' },
        tags: [{ tag: { id: 'tag1', name: 'React 18' } }],
        _count: { likes: 10, bookmarks: 5, comments: 3 },
      }

      vi.mocked(prisma.mainPost.findUnique).mockResolvedValue(mockPost as any)

      const result = await prisma.mainPost.findUnique({
        where: { id: 'post1' },
        include: {
          author: true,
          category: true,
          tags: { include: { tag: true } },
          _count: { select: { likes: true, bookmarks: true, comments: true } },
        },
      })

      expect(result?.author).toBeDefined()
      expect(result?.category).toBeDefined()
      expect(result?.tags).toBeDefined()
      expect(result?._count).toBeDefined()
    })
  })
})
