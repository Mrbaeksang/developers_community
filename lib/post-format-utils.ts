// 숫자 포맷팅 함수 (K notation)
export const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`
  }
  return count.toLocaleString()
}

// RGB로 변환
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

// Luminance 계산
export const getLuminance = (color: string): number => {
  const rgb = hexToRgb(color)
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
}

// 배경색에 따른 텍스트 색상 결정
export const getTextColor = (backgroundColor: string): string => {
  return getLuminance(backgroundColor) > 128 ? '#000000' : '#FFFFFF'
}

// 읽기 시간 계산
export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200
  const wordCount = text.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}
