// 색상 관련 유틸리티 함수들

// hex 색상을 RGB로 변환
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 100, g: 100, b: 100 }
}

// 밝기 계산 (0-255)
export function getLuminance(color: string) {
  const rgb = hexToRgb(color)
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
}

// 배경색에 따른 텍스트 색상 결정
export function getTextColor(backgroundColor: string): string {
  return getLuminance(backgroundColor) > 128 ? '#000000' : '#FFFFFF'
}

// RGB 색상을 hex로 변환
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

// 색상 명도 조절 (밝게/어둡게)
export function adjustColorBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color)
  const r = Math.max(0, Math.min(255, rgb.r + amount))
  const g = Math.max(0, Math.min(255, rgb.g + amount))
  const b = Math.max(0, Math.min(255, rgb.b + amount))
  return rgbToHex(r, g, b)
}

// 색상 투명도 적용
export function colorWithOpacity(color: string, opacity: number): string {
  const rgb = hexToRgb(color)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}
