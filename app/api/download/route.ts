import { NextRequest, NextResponse } from 'next/server'

// GET: 파일 다운로드 처리
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const url = searchParams.get('url')
    const filename = searchParams.get('filename')

    if (!url || !filename) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    // Vercel Blob URL 검증 (보안)
    if (!url.includes('blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: '유효하지 않은 파일 URL입니다.' },
        { status: 400 }
      )
    }

    // 파일 fetch
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
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
    console.error('Download error:', error)
    return NextResponse.json(
      { error: '파일 다운로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
