import { NextResponse } from 'next/server'
import { createAIComment } from '@/lib/ai/qa-bot'
import { prisma } from '@/lib/core/prisma'

export async function GET() {
  try {
    console.error('[TEST] AI 테스트 시작')
    
    // 가장 최근 Q&A 게시글 찾기
    const post = await prisma.mainPost.findFirst({
      where: {
        category: {
          slug: 'qna'
        },
        status: 'PUBLISHED'
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (!post) {
      return NextResponse.json({ error: 'Q&A 게시글이 없습니다' })
    }
    
    console.error(`[TEST] 게시글 찾음 - id: ${post.id}, title: ${post.title}`)
    console.error(`[TEST] 카테고리: ${post.category?.name} (${post.category?.slug})`)
    
    // AI 댓글 생성 테스트
    await createAIComment(post.id)
    
    return NextResponse.json({ 
      message: 'AI 테스트 완료', 
      postId: post.id,
      title: post.title 
    })
  } catch (error) {
    console.error('[TEST] 오류:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}