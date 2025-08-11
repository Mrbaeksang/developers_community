import { describe, it, expect } from 'vitest'
import {
  sanitizeFilename,
  validateMimeType,
  validateFileSize,
  getFileExtension,
} from '@/lib/utils/file-sanitizer'

describe('File Sanitizer', () => {
  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      const dangerous = '../../../etc/passwd'
      const result = sanitizeFilename(dangerous)
      expect(result).not.toContain('..')
      expect(result).toMatch(/passwd_[a-f0-9]{8}/)
    })

    it('should remove dangerous characters', () => {
      const dangerous = '<script>alert("XSS")</script>.jpg'
      const result = sanitizeFilename(dangerous)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('"')
      expect(result).toContain('.jpg')
    })

    it('should handle Korean filenames', () => {
      const korean = '한글 파일명.pdf'
      const result = sanitizeFilename(korean)
      expect(result).toContain('한글_파일명')
      expect(result).toContain('.pdf')
    })

    it('should handle Windows reserved names', () => {
      const reserved = 'CON.txt'
      const result = sanitizeFilename(reserved)
      expect(result).toMatch(/^file_CON.*\.txt$/)
    })

    it('should add hash for uniqueness', () => {
      const filename = 'test.jpg'
      const result1 = sanitizeFilename(filename, { addHash: true })
      // 시간 차이를 위해 약간의 지연
      const result2 = sanitizeFilename(filename + '_different', {
        addHash: true,
      })
      expect(result1).not.toBe(result2) // Different hashes
      expect(result1).toMatch(/test_[a-f0-9]{8}\.jpg/)
    })

    it('should respect max length', () => {
      const longName = 'a'.repeat(300) + '.txt'
      const result = sanitizeFilename(longName, { maxLength: 255 })
      expect(result.length).toBeLessThanOrEqual(255)
      expect(result).toContain('.txt')
    })

    it('should handle empty or invalid input', () => {
      expect(() => sanitizeFilename('')).toThrow('Invalid filename')
      expect(() => sanitizeFilename(null as any)).toThrow('Invalid filename')
      expect(() => sanitizeFilename(undefined as any)).toThrow(
        'Invalid filename'
      )
    })

    it('should handle files with no extension', () => {
      const result = sanitizeFilename('README', { preserveExtension: true })
      expect(result).toMatch(/^README_[a-f0-9]{8}$/)
    })
  })

  describe('validateMimeType', () => {
    it('should accept valid MIME types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const allowed = ['image/jpeg', 'image/png']
      expect(validateMimeType(file, allowed)).toBe(true)
    })

    it('should reject invalid MIME types', () => {
      const file = new File([''], 'test.exe', {
        type: 'application/x-msdownload',
      })
      const allowed = ['image/jpeg', 'image/png']
      expect(validateMimeType(file, allowed)).toBe(false)
    })

    it('should support wildcard MIME types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const allowed = ['image/*', 'application/pdf']
      expect(validateMimeType(file, allowed)).toBe(true)
    })

    it('should handle files with no MIME type', () => {
      const file = new File([''], 'test.txt', { type: '' })
      const allowed = ['text/plain']
      expect(validateMimeType(file, allowed)).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.txt')
      expect(validateFileSize(file, 10000)).toBe(true)
    })

    it('should reject files exceeding size limit', () => {
      const file = new File(['a'.repeat(10000)], 'test.txt')
      expect(validateFileSize(file, 1000)).toBe(false)
    })
  })

  describe('getFileExtension', () => {
    it('should extract valid extensions', () => {
      expect(getFileExtension('file.txt')).toBe('.txt')
      expect(getFileExtension('image.JPEG')).toBe('.jpeg')
      expect(getFileExtension('archive.tar.gz')).toBe('.gz')
    })

    it('should return empty for no extension', () => {
      expect(getFileExtension('README')).toBe('')
      expect(getFileExtension('file.')).toBe('')
    })

    it('should reject suspicious extensions', () => {
      expect(getFileExtension('file.../../etc')).toBe('')
      expect(getFileExtension('file.php5abc')).toBe('') // Too long
      expect(getFileExtension('file.txt ')).toBe('') // Space
    })

    it('should handle invalid input', () => {
      expect(getFileExtension('')).toBe('')
      expect(getFileExtension(null as any)).toBe('')
      expect(getFileExtension(undefined as any)).toBe('')
    })
  })
})

describe('Security Tests', () => {
  it('should prevent path traversal attacks', () => {
    const attacks = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      'file://etc/passwd',
      '....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ]

    attacks.forEach((attack) => {
      const result = sanitizeFilename(attack)
      expect(result).not.toContain('..')
      expect(result).not.toContain('/')
      expect(result).not.toContain('\\')
      // URL 인코딩된 문자들은 그대로 남을 수 있음 (파일명에서는 무해)
    })
  })

  it('should prevent XSS in filenames', () => {
    const xssAttempts = [
      '<script>alert(1)</script>.jpg',
      'javascript:alert(1).pdf',
      'onerror=alert(1).png',
      '<img src=x onerror=alert(1)>.gif',
    ]

    xssAttempts.forEach((xss) => {
      const result = sanitizeFilename(xss)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('javascript:')
      // onerror은 위험한 문자가 아니므로 남을 수 있음
    })
  })

  it('should handle null byte injection', () => {
    const nullByteFile = 'file.txt\x00.jpg'
    const result = sanitizeFilename(nullByteFile)
    expect(result).not.toContain('\x00')
  })
})
