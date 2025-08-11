// AI Q&A 봇 API 엔드포인트
import { auth } from '@/auth'
import { createAIComment, processQAPosts } from '@/lib/ai/qa-bot'
import {
  handleError,
  throwAuthorizationError,
  throwValidationError,
} from '@/lib/api/errors'
import { successResponse } from '@/lib/api/response'

// POST: 특정 게시글에 AI 댓글 생성 (관리자 전용)
export async function POST(req: Request) {
  try {
    const session = await auth()

    // 관리자 권한 확인
    if (session?.user?.role !== 'ADMIN') {
      throw throwAuthorizationError('관리자 권한이 필요합니다')
    }

    const { postId } = await req.json()

    if (!postId) {
      throw throwValidationError('게시글 ID가 필요합니다')
    }

    // AI 댓글 생성
    await createAIComment(postId)

    return successResponse({
      message: 'AI 댓글 생성 요청이 처리되었습니다',
      postId,
    })
  } catch (error) {
    return handleError(error)
  }
}

// GET: Q&A 게시글 배치 처리 (관리자 전용 또는 크론잡)
export async function GET(req: Request) {
  try {
    // 크론잡 시크릿 키 확인 (Vercel Cron 등에서 사용)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (authHeader !== `Bearer ${cronSecret}`) {
      // 크론잡이 아닌 경우 관리자 권한 확인
      const session = await auth()
      if (session?.user?.role !== 'ADMIN') {
        throw throwAuthorizationError('권한이 없습니다')
      }
    }

    // Q&A 게시글 배치 처리
    await processQAPosts()

    return successResponse({
      message: 'Q&A 게시글 처리가 완료되었습니다',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleError(error)
  }
}
