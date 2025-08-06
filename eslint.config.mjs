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

  // ============================================
  // 1. 전역 기본 규칙 (모든 파일)
  // ============================================
  {
    rules: {
      // TypeScript 필수 규칙
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn', // error → warn
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Console 규칙
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Import 경로 강제 (중요!)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../lib/*', '../../lib/*', '../../../lib/*'],
              message: '상대경로 대신 @/lib/* 사용',
            },
            {
              group: ['../components/*', '../../components/*'],
              message: '상대경로 대신 @/components/* 사용',
            },
          ],
          paths: [
            {
              name: 'axios',
              message: 'axios 대신 @/lib/api의 apiClient 사용',
            },
          ],
        },
      ],

      // Prisma 모델명 실수 방지 (중요!)
      'no-restricted-syntax': [
        'error',
        // Prisma 잘못된 모델명
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='post']",
          message:
            'prisma.post 없음. prisma.mainPost 또는 prisma.communityPost 사용',
        },
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='category']",
          message:
            'prisma.category 없음. prisma.mainCategory 또는 prisma.communityCategory 사용',
        },
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='comment']",
          message:
            'prisma.comment 없음. prisma.mainComment 또는 prisma.communityComment 사용',
        },
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='like']",
          message:
            'prisma.like 없음. prisma.mainLike 또는 prisma.communityLike 사용',
        },
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='bookmark']",
          message:
            'prisma.bookmark 없음. prisma.mainBookmark 또는 prisma.communityBookmark 사용',
        },
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='tag']",
          message:
            'prisma.tag 없음. prisma.mainTag 또는 prisma.communityTag 사용',
        },

        // User 관계 실수
        {
          selector:
            "MemberExpression[object.name='user'][property.name='posts']",
          message:
            'user.posts 없음. user.mainPosts 또는 user.communityPosts 사용',
        },
        {
          selector:
            "MemberExpression[object.name='user'][property.name='comments']",
          message:
            'user.comments 없음. user.mainComments 또는 user.communityComments 사용',
        },
      ],
    },
  },

  // ============================================
  // 2. 서버 API 전용 규칙 (app/api/**)
  // ============================================
  {
    files: ['app/api/**/*.ts', 'app/api/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        // fetch 사용 금지 (서버에서)
        {
          selector: "CallExpression[callee.name='fetch']",
          message: 'API route에서 fetch 대신 @/lib/api의 apiClient 사용',
        },
        // NextResponse.json 에러 처리
        {
          selector:
            "CallExpression[callee.object.name='NextResponse'][callee.property.name='json']:has([key.name='error'])",
          message:
            'NextResponse.json({ error }) 대신 @/lib/error-handler의 handleError 사용',
        },
      ],
    },
  },

  // ============================================
  // 3. 클라이언트 컴포넌트 규칙 완화
  // ============================================
  {
    files: ['components/**/*.tsx'],
    rules: {
      // fetch 사용 허용 - 클라이언트 컴포넌트는 apiClient 마이그레이션 보류
      // TODO: 추후 점진적으로 apiClient로 마이그레이션 예정
      'no-restricted-syntax': 'off',
    },
  },

  // ============================================
  // 3-1. 서버 컴포넌트 (page.tsx, layout.tsx) - fetch 허용
  // ============================================
  {
    files: ['app/**/page.tsx', 'app/**/layout.tsx', 'app/page.tsx'],
    rules: {
      // 서버 컴포넌트는 apiClient 사용 불가, fetch 사용 필수
      'no-restricted-syntax': 'off',
    },
  },

  // ============================================
  // 4. lib/api.ts 예외 (fetch 써야 함)
  // ============================================
  {
    files: ['lib/api.ts', 'lib/api-monitoring.ts', 'app/api/download/route.ts'],
    rules: {
      'no-restricted-syntax': 'off', // 모든 제한 해제 (외부 URL fetch 필요)
    },
  },

  // ============================================
  // 5. 스크립트 파일 예외
  // ============================================
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.js'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ============================================
  // 6. 테스트 파일 예외
  // ============================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
]

export default eslintConfig
