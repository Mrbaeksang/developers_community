/**
 * Text Processing Utilities
 * 텍스트 처리 관련 유틸리티 함수들
 */

/**
 * Tiptap에서 생성된 HTML을 일반 텍스트로 변환 (유니버설)
 * 서버/클라이언트 모두에서 동작
 */
export function stripTiptapHtml(html: string | null): string {
  if (!html) return ''

  // Tiptap 빈 에디터 HTML 패턴 제거
  if (html === '<p></p>' || html.trim() === '') {
    return ''
  }

  // 브라우저 환경에서는 DOM API 사용 (더 정확한 파싱)
  if (typeof document !== 'undefined') {
    // 임시 DOM 엘리먼트 생성하여 HTML 파싱
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // 이미지 태그를 [이미지]로 대체
    const images = tempDiv.querySelectorAll('img')
    images.forEach(() => {
      // 이미지 개수만큼 [이미지] 표시
      const imageMarker = document.createTextNode('[이미지] ')
      tempDiv.insertBefore(imageMarker, tempDiv.firstChild)
    })
    images.forEach((img) => img.remove())

    // 파일 첨부 링크를 [파일]로 대체
    const links = tempDiv.querySelectorAll('a[href*="blob.vercel-storage.com"]')
    links.forEach((link) => {
      const fileMarker = document.createTextNode('[파일] ')
      link.parentNode?.replaceChild(fileMarker, link)
    })

    // 코드 블록을 [코드]로 대체
    const codeBlocks = tempDiv.querySelectorAll('pre, code')
    codeBlocks.forEach((code) => {
      const codeMarker = document.createTextNode('[코드] ')
      code.parentNode?.replaceChild(codeMarker, code)
    })

    // 순수 텍스트 추출
    let textContent = tempDiv.textContent || tempDiv.innerText || ''

    // 불필요한 공백 정리
    textContent = textContent
      .replace(/\s+/g, ' ') // 연속 공백을 하나로
      .replace(/\n\s*/g, ' ') // 줄바꿈을 공백으로
      .trim()

    return textContent
  }

  // 서버 환경에서는 정규식 사용
  let text = html

  // HTML 태그 제거 및 대체
  text = text
    // 이미지 태그를 [이미지]로 대체
    .replace(/<img[^>]*>/gi, '[이미지] ')
    // 파일 링크를 [파일]로 대체
    .replace(
      /<a[^>]*href="[^"]*blob\.vercel-storage\.com[^"]*"[^>]*>.*?<\/a>/gi,
      '[파일] '
    )
    // 코드 블록을 [코드]로 대체
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[코드] ')
    .replace(/<code[^>]*>.*?<\/code>/gi, '[코드] ')
    // 나머지 HTML 태그 모두 제거
    .replace(/<[^>]*>/g, '')
    // HTML 엔티티 디코딩
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // 불필요한 공백 정리
  text = text
    .replace(/\s+/g, ' ') // 연속 공백을 하나로
    .replace(/\n\s*/g, ' ') // 줄바꿈을 공백으로
    .trim()

  return text
}

/**
 * 서버 사이드에서 사용할 수 있는 HTML → 텍스트 변환 (DOM 없이)
 * API에서 excerpt 생성 시 사용
 */
export function stripTiptapHtmlServer(html: string | null): string {
  if (!html) return ''

  // Tiptap 빈 에디터 HTML 패턴 제거
  if (html === '<p></p>' || html.trim() === '') {
    return ''
  }

  let text = html

  // HTML 태그 제거 및 대체
  text = text
    // 이미지 태그를 [이미지]로 대체
    .replace(/<img[^>]*>/gi, '[이미지] ')
    // 파일 링크를 [파일]로 대체
    .replace(
      /<a[^>]*href="[^"]*blob\.vercel-storage\.com[^"]*"[^>]*>.*?<\/a>/gi,
      '[파일] '
    )
    // 코드 블록을 [코드]로 대체
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[코드] ')
    .replace(/<code[^>]*>.*?<\/code>/gi, '[코드] ')
    // 나머지 HTML 태그 모두 제거
    .replace(/<[^>]*>/g, '')
    // HTML 엔티티 디코딩
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // 불필요한 공백 정리
  text = text
    .replace(/\s+/g, ' ') // 연속 공백을 하나로
    .replace(/\n\s*/g, ' ') // 줄바꿈을 공백으로
    .trim()

  return text
}

/**
 * 텍스트 길이 제한 (한글/영문 구분)
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text

  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Tiptap 콘텐츠에서 첫 번째 이미지 URL 추출
 */
export function extractFirstImageFromTiptap(
  html: string | null
): string | null {
  if (!html) return null

  const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*>/i)
  return imgMatch ? imgMatch[1] : null
}

/**
 * Tiptap 콘텐츠의 읽기 시간 계산 (HTML 태그 제외하고 계산)
 */
export function calculateReadingTimeFromTiptap(html: string): number {
  const text = stripTiptapHtmlServer(html)

  const koreanCharCount = (text.match(/[가-힣]/g) || []).length
  const englishWordCount = (text.match(/[a-zA-Z]+/g) || []).length
  const otherCharCount = text.length - koreanCharCount - englishWordCount

  return Math.max(
    1,
    Math.ceil(
      koreanCharCount / 300 + englishWordCount / 250 + otherCharCount / 800
    )
  )
}
