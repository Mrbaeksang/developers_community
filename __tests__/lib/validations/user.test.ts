import { describe, it, expect } from 'vitest'
import { updateProfileSchema } from '@/lib/validations/user'

describe('User Validation', () => {
  describe('updateProfileSchema', () => {
    it('should accept valid profile update', () => {
      const validData = {
        name: '유효한 이름',
        username: 'validuser123',
        bio: '간단한 자기소개입니다.',
        email: 'test@example.com',
      }

      const result = updateProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('유효한 이름')
        expect(result.data.username).toBe('validuser123')
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should accept partial updates', () => {
      const partialData = {
        name: '새로운 이름만',
      }

      const result = updateProfileSchema.safeParse(partialData)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('새로운 이름만')
        expect(result.data.username).toBeUndefined()
      }
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: '잘못된이메일형식',
      }

      const result = updateProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === 'email'
        )
        expect(emailError?.message).toBe('올바른 이메일 형식이 아닙니다')
      }
    })

    it('should reject short username', () => {
      const invalidData = {
        username: 'a', // too short
      }

      const result = updateProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const usernameError = result.error.issues.find(
          (issue) => issue.path[0] === 'username'
        )
        expect(usernameError?.message).toBe('사용자명은 3자 이상이어야 합니다')
      }
    })

    it('should reject bio that is too long', () => {
      const longBio = 'a'.repeat(501) // exceeds 500 character limit

      const invalidData = {
        bio: longBio,
      }

      const result = updateProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const bioError = result.error.issues.find(
          (issue) => issue.path[0] === 'bio'
        )
        expect(bioError?.message).toBe('자기소개는 500자 이내여야 합니다')
      }
    })

    it('should trim whitespace from name field', () => {
      const dataWithSpaces = {
        name: '  유효한 이름  ',
      }

      const result = updateProfileSchema.safeParse(dataWithSpaces)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('유효한 이름')
      }
    })

    it('should lowercase username and email', () => {
      const dataWithUppercase = {
        username: 'ValidUser123',
        email: 'TEST@EXAMPLE.COM',
      }

      const result = updateProfileSchema.safeParse(dataWithUppercase)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.username).toBe('validuser123')
        expect(result.data.email).toBe('test@example.com')
      }
    })
  })
})
