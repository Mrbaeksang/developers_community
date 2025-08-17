/**
 * HTTP URL을 HTTPS로 변환하는 헬퍼 함수
 */
export function ensureHttps(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined
  return url.replace(/^http:\/\//, 'https://')
}

/**
 * 안전한 이미지 src 반환 (Next.js Image 컴포넌트용)
 */
export function getSafeImageSrc(
  url: string | null | undefined
): string | undefined {
  const httpsUrl = ensureHttps(url)
  return httpsUrl || undefined
}
