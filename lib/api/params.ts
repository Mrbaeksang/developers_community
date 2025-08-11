import { type URLSearchParams } from 'url'

/**
 * URLSearchParams를 안전하게 파싱하여 Zod에 전달할 수 있는 객체로 변환
 * null 값을 undefined로 변환하여 Zod optional() 필드와 호환되게 함
 */
export function parseSearchParams<T extends Record<string, string>>(
  searchParams: URLSearchParams,
  keys: (keyof T)[]
): Partial<Record<keyof T, string | undefined>> {
  const result: Partial<Record<keyof T, string | undefined>> = {}

  for (const key of keys) {
    const value = searchParams.get(key as string)
    // null을 undefined로 변환 (Zod optional()과 호환)
    result[key] = value ?? undefined
  }

  return result
}

/**
 * 단일 파라미터를 안전하게 가져오기
 */
export function getParam(
  searchParams: URLSearchParams,
  key: string
): string | undefined {
  return searchParams.get(key) ?? undefined
}

/**
 * 숫자 파라미터를 안전하게 파싱
 */
export function getNumberParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue?: number
): number | undefined {
  const value = searchParams.get(key)
  if (value === null) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * 불린 파라미터를 안전하게 파싱
 */
export function getBooleanParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = searchParams.get(key)
  if (value === null) return defaultValue
  return value === 'true' || value === '1'
}
