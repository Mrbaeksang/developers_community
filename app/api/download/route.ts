import { NextRequest, NextResponse } from 'next/server'
import {
  handleError,
  throwValidationError,
  throwNotFoundError,
} from '@/lib/api/errors'

// GET: 파일 다운로드 처리
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const url = searchParams.get('url')
    const filename = searchParams.get('filename')

    if (!url || !filename) {
      throw throwValidationError('잘못된 요청입니다.')
    }

    // Vercel Blob URL 검증 (보안)
    if (!url.includes('blob.vercel-storage.com')) {
      throw throwValidationError('유효하지 않은 파일 URL입니다.')
    }

    // 파일 fetch
    const response = await fetch(url)

    if (!response.ok) {
      throw throwNotFoundError('파일을 찾을 수 없습니다.')
    }

    // Response headers 설정
    const headers = new Headers()
    headers.set(
      'Content-Type',
      response.headers.get('content-type') || 'application/octet-stream'
    )
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`
    )

    // Content-Length가 있다면 추가
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      headers.set('Content-Length', contentLength)
    }

    // 파일 스트림 반환
    return new NextResponse(response.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    return handleError(error)
  }
}
