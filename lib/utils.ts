import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind CSS 클래스를 올바른 우선순위로 병합하는 유틸리티 함수
 * clsx로 조건부 클래스 처리, tailwind-merge로 충돌 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
