import crypto from 'crypto'
import path from 'path'

/**
 * 파일명 sanitization 유틸리티
 * 보안 취약점 방지 및 파일 시스템 호환성 보장
 */

/**
 * 위험한 문자 및 패턴 제거
 */
const DANGEROUS_PATTERNS = [
  /\.\./g, // Path traversal
  /[<>:"\/\\|?*]/g, // Windows 금지 문자
  /[\x00-\x1f]/g, // 제어 문자
  /^\.+/, // 숨김 파일
  /\s+/g, // 공백 -> 언더스코어
]

/**
 * 예약된 파일명 (Windows)
 */
const RESERVED_NAMES = [
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]

/**
 * 파일명 sanitize
 * @param filename 원본 파일명
 * @param options 옵션
 * @returns 안전한 파일명
 */
export function sanitizeFilename(
  filename: string,
  options: {
    maxLength?: number
    preserveExtension?: boolean
    addHash?: boolean
  } = {}
): string {
  const { maxLength = 255, preserveExtension = true, addHash = true } = options

  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename')
  }

  // 확장자 분리
  const ext = preserveExtension ? path.extname(filename) : ''
  let base = preserveExtension
    ? path.basename(filename, ext)
    : path.basename(filename)

  // 위험한 패턴 제거
  DANGEROUS_PATTERNS.forEach((pattern) => {
    base = base.replace(pattern, '_')
  })

  // 예약된 이름 체크
  const upperBase = base.toUpperCase()
  if (RESERVED_NAMES.includes(upperBase)) {
    base = `file_${base}`
  }

  // 빈 파일명 방지
  if (!base || base === '_') {
    base = 'unnamed'
  }

  // 해시 추가 (중복 방지)
  if (addHash) {
    const hash = crypto
      .createHash('md5')
      .update(`${filename}-${Date.now()}`)
      .digest('hex')
      .substring(0, 8)
    base = `${base}_${hash}`
  }

  // 길이 제한
  let result = base + ext
  if (result.length > maxLength) {
    const availableLength = maxLength - ext.length - (addHash ? 9 : 0)
    base = base.substring(0, Math.max(1, availableLength))
    result = addHash
      ? `${base}_${crypto.randomBytes(4).toString('hex')}${ext}`
      : base + ext
  }

  return result
}

/**
 * MIME 타입 검증
 * @param file File 객체
 * @param allowedTypes 허용된 MIME 타입 배열
 */
export function validateMimeType(
  file: File,
  allowedTypes: readonly string[]
): boolean {
  if (!file.type) return false

  // 정확한 매치 또는 와일드카드 매치
  return allowedTypes.some((allowed) => {
    if (allowed.endsWith('/*')) {
      // 예: 'image/*' 는 'image/jpeg', 'image/png' 등 매치
      const prefix = allowed.slice(0, -2)
      return file.type.startsWith(prefix + '/')
    }
    return file.type === allowed
  })
}

/**
 * 파일 크기 검증
 * @param file File 객체
 * @param maxSize 최대 크기 (bytes)
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

/**
 * 파일 확장자 추출 (안전하게)
 * @param filename 파일명
 * @returns 확장자 (점 포함) 또는 빈 문자열
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''

  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === filename.length - 1) return ''

  const ext = filename.slice(lastDot).toLowerCase()
  // 확장자 길이 제한 (보통 4자 이내)
  if (ext.length > 5) return ''

  // 알파벳과 숫자만 허용
  if (!/^\.[a-z0-9]+$/.test(ext)) return ''

  return ext
}

/**
 * 파일 해시 생성 (중복 체크용)
 * @param file File 객체 또는 Buffer
 */
export async function generateFileHash(
  file: File | Buffer | ArrayBuffer
): Promise<string> {
  let buffer: Buffer

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file)
  } else {
    buffer = file
  }

  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * 안전한 파일 경로 생성
 * @param baseDir 기본 디렉토리
 * @param filename 파일명
 * @returns 안전한 전체 경로
 */
export function createSafePath(baseDir: string, filename: string): string {
  const safeName = sanitizeFilename(filename)
  const resolvedPath = path.resolve(baseDir, safeName)

  // baseDir 밖으로 나가는지 체크
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    throw new Error('Path traversal attempt detected')
  }

  return resolvedPath
}
