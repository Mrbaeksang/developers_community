import { NextRequest, NextResponse } from 'next/server'
import { handleError, throwValidationError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      throwValidationError('URL parameter required')
    }

    // Google 이미지 URL만 허용
    if (!imageUrl.startsWith('https://lh3.googleusercontent.com/')) {
      throwValidationError('Only Google images allowed')
    }

    // 직접 fetch 사용 (외부 이미지 서버이므로 apiClient 대신 사용)
    // eslint-disable-next-line no-restricted-syntax
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Developer Community)',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24시간 캐시
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return handleError(error)
  }
}
