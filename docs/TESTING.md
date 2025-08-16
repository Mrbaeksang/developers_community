# 🧪 테스트 전략

## 📋 목차
- [테스트 환경](#테스트-환경)
- [단위 테스트](#단위-테스트)
- [통합 테스트](#통합-테스트)
- [E2E 테스트](#e2e-테스트)
- [테스트 커버리지](#테스트-커버리지)

---

## 테스트 환경

### 🛠️ 테스트 스택

| 도구 | 버전 | 용도 |
|------|------|------|
| **Vitest** | 3.2.4 | 단위/통합 테스트 |
| **Playwright** | 1.54.1 | E2E 테스트 |
| **Testing Library** | 16.3.0 | React 컴포넌트 테스트 |
| **MSW** | - | API 모킹 |

### 📂 테스트 구조

```
__tests__/
├── unit/           # 단위 테스트
│   ├── utils/
│   └── hooks/
├── integration/    # 통합 테스트
│   ├── api/
│   └── auth/
└── e2e/           # E2E 테스트
    ├── auth.spec.ts
    └── post.spec.ts
```

---

## 단위 테스트

### ⚡ Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/']
    }
  }
})
```

### 🧩 컴포넌트 테스트

```typescript
// __tests__/components/PostCard.test.tsx
import { render, screen } from '@testing-library/react'
import { PostCard } from '@/components/posts/PostCard'

describe('PostCard', () => {
  const mockPost = {
    id: '1',
    title: '테스트 게시글',
    content: '내용',
    author: { name: '작성자', image: null },
    createdAt: new Date()
  }

  it('게시글 제목이 렌더링되어야 함', () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText('테스트 게시글')).toBeInTheDocument()
  })

  it('작성자 이름이 표시되어야 함', () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText('작성자')).toBeInTheDocument()
  })

  it('좋아요 버튼이 동작해야 함', async () => {
    const { user } = renderWithUser(<PostCard post={mockPost} />)
    const likeButton = screen.getByRole('button', { name: /좋아요/ })
    
    await user.click(likeButton)
    expect(likeButton).toHaveClass('text-red-500')
  })
})
```

### 🔧 유틸리티 테스트

```typescript
// __tests__/utils/format.test.ts
import { formatDate, formatNumber } from '@/lib/utils'

describe('formatDate', () => {
  it('날짜를 올바르게 포맷해야 함', () => {
    const date = new Date('2024-01-01')
    expect(formatDate(date)).toBe('2024년 1월 1일')
  })

  it('상대 시간을 표시해야 함', () => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    expect(formatDate(fiveMinutesAgo, { relative: true })).toBe('5분 전')
  })
})

describe('formatNumber', () => {
  it('큰 숫자를 축약해야 함', () => {
    expect(formatNumber(1000)).toBe('1K')
    expect(formatNumber(1500000)).toBe('1.5M')
  })
})
```

---

## 통합 테스트

### 🔌 API 테스트

```typescript
// __tests__/api/posts.test.ts
import { POST, GET } from '@/app/api/main/posts/route'
import { prisma } from '@/lib/core/prisma'

describe('POST /api/main/posts', () => {
  beforeEach(async () => {
    await prisma.mainPost.deleteMany()
  })

  it('새 게시글을 생성해야 함', async () => {
    const request = new Request('http://localhost/api/main/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '테스트 제목',
        content: '테스트 내용',
        categoryId: 'test-category'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.post.title).toBe('테스트 제목')
  })

  it('검증 실패 시 400을 반환해야 함', async () => {
    const request = new Request('http://localhost/api/main/posts', {
      method: 'POST',
      body: JSON.stringify({ title: '' })  // 빈 제목
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### 🔐 인증 테스트

```typescript
// __tests__/auth/session.test.ts
import { auth } from '@/auth'
import { mockSession } from '@/test/mocks'

vi.mock('@/auth')

describe('인증 미들웨어', () => {
  it('로그인하지 않은 사용자를 리다이렉트해야 함', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    
    const response = await middleware(
      new NextRequest('http://localhost/admin')
    )
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/login')
  })

  it('관리자 권한을 확인해야 함', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: 'USER' }))
    
    const response = await middleware(
      new NextRequest('http://localhost/admin')
    )
    
    expect(response.status).toBe(403)
  })
})
```

---

## E2E 테스트

### 🎭 Playwright 설정

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }},
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }},
    { name: 'webkit', use: { ...devices['Desktop Safari'] }}
  ]
})
```

### 🌐 E2E 시나리오

```typescript
// __tests__/e2e/post-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('게시글 작성 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('게시글을 작성하고 게시할 수 있어야 함', async ({ page }) => {
    // 작성 페이지로 이동
    await page.click('text=새 글 작성')
    await page.waitForURL('/main/write')

    // 제목과 내용 입력
    await page.fill('[name="title"]', 'E2E 테스트 게시글')
    await page.fill('[name="content"]', '이것은 테스트 내용입니다.')
    
    // 카테고리 선택
    await page.selectOption('[name="categoryId"]', 'tech')
    
    // 저장
    await page.click('button:has-text("게시하기")')
    
    // 리다이렉트 확인
    await expect(page).toHaveURL(/\/main\/posts\//)
    await expect(page.locator('h1')).toContainText('E2E 테스트 게시글')
  })

  test('댓글을 작성할 수 있어야 함', async ({ page }) => {
    await page.goto('/main/posts/test-post')
    
    // 댓글 작성
    await page.fill('[name="comment"]', '테스트 댓글입니다')
    await page.click('button:has-text("댓글 작성")')
    
    // 댓글 표시 확인
    await expect(page.locator('.comment-list')).toContainText('테스트 댓글입니다')
  })
})
```

### 📱 반응형 테스트

```typescript
// __tests__/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test'

test.use(devices['iPhone 13'])

test('모바일에서 메뉴가 동작해야 함', async ({ page }) => {
  await page.goto('/')
  
  // 햄버거 메뉴 클릭
  await page.click('[aria-label="메뉴"]')
  
  // 모바일 메뉴 표시 확인
  await expect(page.locator('.mobile-menu')).toBeVisible()
  
  // 메뉴 항목 클릭
  await page.click('text=커뮤니티')
  await expect(page).toHaveURL('/communities')
})
```

---

## 테스트 커버리지

### 📊 현재 커버리지

```bash
# 커버리지 실행
npm run test:coverage

# 결과
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files              |   85.2  |   78.4   |   82.1  |   85.0  |
 components/           |   88.5  |   82.3   |   86.2  |   88.1  |
 lib/                  |   82.7  |   75.6   |   79.8  |   82.5  |
 app/api/              |   84.3  |   76.2   |   80.5  |   84.0  |
------------------------|---------|----------|---------|---------|
```

### 🎯 커버리지 목표

| 카테고리 | 현재 | 목표 |
|---------|------|------|
| **Statements** | 85% | 90% |
| **Branches** | 78% | 85% |
| **Functions** | 82% | 90% |
| **Lines** | 85% | 90% |

---

## 🔧 테스트 유틸리티

### Mock 데이터

```typescript
// test/mocks/data.ts
export const mockUser = {
  id: 'user-1',
  name: '테스트 사용자',
  email: 'test@example.com',
  globalRole: 'USER'
}

export const mockPost = {
  id: 'post-1',
  title: '테스트 게시글',
  content: '테스트 내용',
  status: 'PUBLISHED',
  author: mockUser
}

export const createMockPosts = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockPost,
    id: `post-${i}`,
    title: `게시글 ${i}`
  }))
}
```

### 테스트 헬퍼

```typescript
// test/helpers.ts
export function renderWithProviders(
  ui: React.ReactElement,
  options = {}
) {
  return render(
    <QueryClient>
      <SessionProvider>
        {ui}
      </SessionProvider>
    </QueryClient>,
    options
  )
}

export async function loginUser(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}
```

---

## 📝 테스트 명령어

```bash
# 단위 테스트
npm run test          # 전체 테스트
npm run test:watch    # 감시 모드
npm run test:ui       # UI 모드

# 커버리지
npm run test:coverage # 커버리지 리포트

# E2E 테스트
npm run test:e2e      # 헤드리스
npm run test:e2e:ui   # UI 모드

# CI/CD
npm run test:ci       # CI 환경용
```