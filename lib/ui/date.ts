import {
  format,
  formatDistance,
  formatDistanceToNow,
  formatRelative,
  subMonths,
  subDays,
  subHours,
  subMinutes,
  isWithinInterval,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addHours,
  addMinutes,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'

// 날짜 포맷 상수
export const DATE_FORMATS = {
  DEFAULT: 'yyyy-MM-dd',
  FULL: 'yyyy년 MM월 dd일',
  WITH_TIME: 'yyyy-MM-dd HH:mm',
  FULL_WITH_TIME: 'yyyy년 MM월 dd일 HH시 mm분',
  TIME_ONLY: 'HH:mm',
  MONTH_DAY: 'MM월 dd일',
  YEAR_MONTH: 'yyyy년 MM월',
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
} as const

// 상대 시간 표시 헬퍼
export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return '잘못된 날짜'
  }

  const now = new Date()
  const diffInMinutes = differenceInMinutes(now, dateObj)
  const diffInHours = differenceInHours(now, dateObj)
  const diffInDays = differenceInDays(now, dateObj)

  // 1분 미만
  if (diffInMinutes < 1) {
    return '방금 전'
  }

  // 1시간 미만
  if (diffInHours < 1) {
    return `${diffInMinutes}분 전`
  }

  // 24시간 미만
  if (diffInDays < 1) {
    return `${diffInHours}시간 전`
  }

  // 7일 미만
  if (diffInDays < 7) {
    return `${diffInDays}일 전`
  }

  // 30일 미만
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks}주 전`
  }

  // 365일 미만
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months}개월 전`
  }

  // 1년 이상
  const years = Math.floor(diffInDays / 365)
  return `${years}년 전`
}

// 날짜 포맷팅 헬퍼
export function formatDate(
  date: Date | string,
  formatStr: keyof typeof DATE_FORMATS | string = 'DEFAULT'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return '잘못된 날짜'
  }

  const formatString =
    DATE_FORMATS[formatStr as keyof typeof DATE_FORMATS] || formatStr

  return format(dateObj, formatString, { locale: ko })
}

// 상대적 날짜 표시 (오늘, 어제, 내일 등)
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return '잘못된 날짜'
  }

  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = addDays(today, 1)
  const yesterday = subDays(today, 1)

  if (isSameDay(dateObj, today)) {
    return '오늘'
  }

  if (isSameDay(dateObj, tomorrow)) {
    return '내일'
  }

  if (isSameDay(dateObj, yesterday)) {
    return '어제'
  }

  // 일주일 이내
  if (isWithinInterval(dateObj, { start: subDays(today, 7), end: today })) {
    return formatRelative(dateObj, now, { locale: ko })
  }

  // 그 외에는 날짜 표시
  return formatDate(dateObj, 'MONTH_DAY')
}

// 기간 계산 헬퍼
export function getDateRange(
  period: 'day' | 'week' | 'month',
  baseDate: Date = new Date()
) {
  switch (period) {
    case 'day':
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate),
      }
    case 'week':
      return {
        start: startOfWeek(baseDate, { locale: ko }),
        end: endOfWeek(baseDate, { locale: ko }),
      }
    case 'month':
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate),
      }
  }
}

// 남은 시간 계산
export function formatTimeRemaining(targetDate: Date | string): string {
  const dateObj =
    typeof targetDate === 'string' ? parseISO(targetDate) : targetDate

  if (!isValid(dateObj)) {
    return '잘못된 날짜'
  }

  const now = new Date()

  if (isBefore(dateObj, now)) {
    return '만료됨'
  }

  const diffInMinutes = differenceInMinutes(dateObj, now)
  const diffInHours = differenceInHours(dateObj, now)
  const diffInDays = differenceInDays(dateObj, now)

  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 남음`
  }

  if (diffInHours < 24) {
    return `${diffInHours}시간 남음`
  }

  return `${diffInDays}일 남음`
}

// 날짜 검증
export function isValidDate(date: unknown): boolean {
  if (!date) return false

  try {
    const dateObj =
      typeof date === 'string'
        ? parseISO(date)
        : new Date(date as string | number | Date)
    return isValid(dateObj)
  } catch {
    return false
  }
}

// 날짜 파싱 안전 헬퍼
export function safeParseDate(date: unknown): Date | null {
  if (!date) return null

  try {
    const dateObj =
      typeof date === 'string'
        ? parseISO(date)
        : new Date(date as string | number | Date)
    return isValid(dateObj) ? dateObj : null
  } catch {
    return null
  }
}

// 특정 기간 전 날짜 계산
export function getDateBefore(
  amount: number,
  unit: 'days' | 'hours' | 'minutes' | 'months'
): Date {
  const now = new Date()

  switch (unit) {
    case 'days':
      return subDays(now, amount)
    case 'hours':
      return subHours(now, amount)
    case 'minutes':
      return subMinutes(now, amount)
    case 'months':
      return subMonths(now, amount)
    default:
      return now
  }
}

// 날짜 범위 포맷팅
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

  if (!isValid(start) || !isValid(end)) {
    return '잘못된 날짜 범위'
  }

  // 같은 날
  if (isSameDay(start, end)) {
    return formatDate(start, 'FULL')
  }

  // 같은 달
  if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
    return `${format(start, 'yyyy년 MM월 dd일')} - ${format(end, 'dd일', { locale: ko })}`
  }

  // 같은 년도
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    return `${format(start, 'yyyy년 MM월 dd일')} - ${format(end, 'MM월 dd일', { locale: ko })}`
  }

  // 다른 년도
  return `${formatDate(start, 'FULL')} - ${formatDate(end, 'FULL')}`
}

// 시간 포맷팅 (12시간/24시간)
export function formatTime(
  date: Date | string,
  use24Hour: boolean = true
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return '잘못된 시간'
  }

  if (use24Hour) {
    return format(dateObj, 'HH:mm', { locale: ko })
  }

  return format(dateObj, 'a h:mm', { locale: ko })
}

// Export date-fns functions for direct use
export {
  format,
  formatDistance,
  formatDistanceToNow,
  formatRelative,
  subMonths,
  subDays,
  subHours,
  subMinutes,
  addDays,
  addHours,
  addMinutes,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
}
