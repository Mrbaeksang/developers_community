// 숫자 포맷팅 함수 (K notation)
export const formatCount = (count: number | null | undefined): string => {
  // null, undefined, NaN 체크
  if (count == null || isNaN(count)) {
    return '0'
  }

  // 안전한 숫자 변환
  const safeCount = Number(count) || 0

  if (safeCount >= 1000) {
    return `${(safeCount / 1000).toFixed(1).replace('.0', '')}K`
  }

  return safeCount.toLocaleString()
}

// 색상 관련 함수는 color-utils.ts로 이동됨
export { hexToRgb, getLuminance, getTextColor } from './color-utils'

// 읽기 시간 계산
export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}
