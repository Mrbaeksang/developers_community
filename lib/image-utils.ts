/**
 * 이미지 관련 유틸리티 함수들
 */

// Base64 blur placeholder 생성을 위한 기본값
const DEFAULT_BLUR_SIZE = 10 // 10px로 작게 만들어 base64 크기 최소화

/**
 * 투명한 1x1 픽셀 base64 이미지 (로딩 전 레이아웃 확보용)
 */
export const TRANSPARENT_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * 기본 blur placeholder (회색 블러)
 * 실제 이미지의 주요 색상을 알 수 없을 때 사용
 */
export const DEFAULT_BLUR_PLACEHOLDER =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

/**
 * 커뮤니티 로고용 컬러풀한 blur placeholder
 * 보라색 계열로 브랜드 컬러와 매칭
 */
export const COMMUNITY_LOGO_BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFBv/EACQQAAIBAwQBBQAAAAAAAAAAAAECAwAEEQUSITFREyJBYXH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABURAQEAAAAAAAAAAAAAAAAAAAAB/9oADAMBAAIRAxEAPwDK2l1cW8sUsEzxSKchkOCK01n6moWEV1dXM9xI3G6RyxxnjJNFFBR//9k='

/**
 * 프로필 이미지용 blur placeholder
 * 중성적인 회색 계열
 */
export const PROFILE_IMAGE_BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAQFBv/EACIQAAICAgEEAwAAAAAAAAAAAAECAAMEEQUSISIxE0FR/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAWEQEBAQAAAAAAAAAAAAAAAAAAEQH/2gAMAwEAAhEDEQA/AMnxmXfh5VN+PIldeQSodCw+iB6MaGbmVVrYjM6kaMIQI2//2Q=='

/**
 * 게시글 썸네일용 blur placeholder
 * 밝은 파란색 계열
 */
export const POST_THUMBNAIL_BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAUGBP/EACYQAAEDAwMDBQAAAAAAAAAAAAECAxEABCEFEjFBUWEGE3GBkf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGhEAAwADAQAAAAAAAAAAAAAAAAERAhIhQf/aAAwDAQACEQMRAD8ATaXql3YPtrZdUkJIMTAkdYpvd+p71xrtPOEwZG4xUuW3AFqKFQOTFaPStmm/1IW76XAhSVKJSnPAOM96vJHNlW//2Q=='

/**
 * 이미지 타입별 기본 blur placeholder 가져오기
 */
export function getDefaultBlurPlaceholder(
  type: 'community' | 'profile' | 'post' | 'default' = 'default'
) {
  switch (type) {
    case 'community':
      return COMMUNITY_LOGO_BLUR
    case 'profile':
      return PROFILE_IMAGE_BLUR
    case 'post':
      return POST_THUMBNAIL_BLUR
    default:
      return DEFAULT_BLUR_PLACEHOLDER
  }
}

/**
 * 이미지 URL에서 최적화된 Unsplash URL 생성
 * blur placeholder를 위한 작은 이미지 URL도 함께 반환
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    blur?: boolean
  } = {}
) {
  if (!url || !url.includes('unsplash.com')) {
    return { url, blurUrl: null }
  }

  const { width = 800, height, quality = 80, blur = false } = options

  // Unsplash URL 파라미터 구성
  const params = new URLSearchParams()
  params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())
  params.set('fit', 'crop')
  params.set('crop', 'entropy') // 중요한 부분을 중심으로 크롭

  // blur용 작은 이미지 URL
  const blurParams = new URLSearchParams()
  blurParams.set('w', DEFAULT_BLUR_SIZE.toString())
  blurParams.set('q', '20') // 낮은 품질로 용량 최소화
  blurParams.set('blur', '20') // Unsplash blur 파라미터

  const baseUrl = url.split('?')[0]
  const optimizedUrl = `${baseUrl}?${params.toString()}`
  const blurUrl = blur ? `${baseUrl}?${blurParams.toString()}` : null

  return { url: optimizedUrl, blurUrl }
}
