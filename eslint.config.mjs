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
      '@typescript-eslint/prefer-optional-chain': 'error', // optional chaining 강제
      '@typescript-eslint/no-unsafe-member-access': 'error', // 타입 없는 객체 접근 금지
    },
  },
]

export default eslintConfig
