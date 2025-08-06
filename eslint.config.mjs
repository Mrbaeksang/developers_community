import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error', // warn → error로 변경
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }], // warn → error로 변경
      // 타입 정보가 필요한 규칙들 비활성화 (Next.js 설정 문제로 인해)
      '@typescript-eslint/prefer-optional-chain': 'off', // 타입 정보 필요
      '@typescript-eslint/no-unsafe-member-access': 'off', // 타입 정보 필요
    },
  },
]

export default eslintConfig
