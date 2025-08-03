// 숫자 포맷팅 함수 (K notation)
export const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`
  }
  return count.toLocaleString()
}

// 색상 관련 함수는 color-utils.ts로 이동됨
export { hexToRgb, getLuminance, getTextColor } from './color-utils'

// 읽기 시간 계산
export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}
