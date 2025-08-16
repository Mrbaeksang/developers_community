# 🛠️ 기술 스택

## 📋 목차
- [기술 스택 개요](#기술-스택-개요)
- [Frontend](#frontend)
- [Backend & Database](#backend--database)
- [개발 도구](#개발-도구)
- [선택 이유](#선택-이유)

---

## 기술 스택 개요

### 🎯 최신 기술 활용
2025년 최신 버전들을 적극 도입하여 최고의 성능과 개발 경험을 제공합니다.

```
✅ Next.js 15.4.4 (최신)
✅ React 19.1.0 (최신)
✅ TypeScript 5.8 (최신)
✅ Tailwind CSS v4 (최신)
✅ Prisma 6.13.0 (최신)
✅ NextAuth v5 beta (최신)
```

---

## Frontend

### ⚛️ Core Framework

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15.4.4 | 풀스택 React 프레임워크 |
| **React** | 19.1.0 | UI 라이브러리 (최신 기능) |
| **TypeScript** | 5.8 | 타입 안정성 |

### 🎨 스타일링

| 기술 | 버전 | 특징 |
|------|------|------|
| **Tailwind CSS** | v4.0 | 유틸리티 우선 CSS |
| **Radix UI** | Latest | 헤드리스 컴포넌트 |
| **Framer Motion** | 12.23 | 애니메이션 |
| **Lucide Icons** | 0.526 | 모던 아이콘 |

### 📊 상태 관리

```typescript
// TanStack Query v5 - 서버 상태
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts
})

// Zustand v5 - 클라이언트 상태
const useStore = create((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 }))
}))
```

### 📝 에디터

| 기술 | 버전 | 용도 |
|------|------|------|
| **TipTap** | 3.0.9 | 리치 텍스트 에디터 |
| **React Markdown** | 10.1.0 | 마크다운 렌더링 |
| **Highlight.js** | 11.11 | 코드 하이라이팅 |

---

## Backend & Database

### 🗄️ 데이터베이스

| 기술 | 버전 | 역할 |
|------|------|------|
| **PostgreSQL** | 16 | 메인 데이터베이스 |
| **Prisma** | 6.13.0 | ORM (39개 모델) |
| **Redis** | Latest | 캐싱 & Rate Limiting |
| **Vercel KV** | 3.0.0 | 서버리스 Redis |
| **Vercel Blob** | 1.1.1 | 파일 스토리지 |

### 🔐 인증 & 보안

```typescript
// NextAuth v5 - 최신 베타
import { auth } from '@/auth'
const session = await auth()

// Zod v4 - 스키마 검증
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

// Rate Limiter - 보안
import { RateLimiterRedis } from 'rate-limiter-flexible'
```

### 🤖 AI & 자동화

| 기술 | 버전 | 용도 |
|------|------|------|
| **OpenAI** | 5.12.2 | AI 답변 생성 |
| **GitHub Actions** | - | CI/CD 자동화 |
| **Vercel Functions** | - | 서버리스 함수 |

---

## 개발 도구

### 🧪 테스트

```bash
# Vitest 3.2.4 - 최신 테스트 프레임워크
npm run test
npm run test:coverage  # 85% 커버리지

# Playwright 1.54.1 - E2E 테스트
npm run test:e2e
```

### 📝 코드 품질

| 도구 | 버전 | 설정 |
|------|------|------|
| **ESLint** | 9.32.0 | Next.js 규칙 |
| **Prettier** | 3.6.2 | 자동 포매팅 |
| **Husky** | 9.1.7 | Git hooks |
| **TypeScript** | 5.8 | Strict mode |

### 🚀 빌드 & 배포

```json
{
  "scripts": {
    "dev": "next dev --turbo",      // Turbopack 사용
    "build": "prisma generate && next build",
    "verify": "npm run lint:fix && npm run format && npm run type-check"
  }
}
```

---

## 선택 이유

### 🎯 Next.js 15.4 선택 이유

**서버 컴포넌트**
```typescript
// 직접 DB 접근으로 1,276배 성능 향상
export default async function Page() {
  const data = await prisma.post.findMany()
  return <PostList data={data} />
}
```

**App Router**
- 파일 기반 라우팅
- 레이아웃 시스템
- 병렬 라우트 지원

### 🎨 Tailwind CSS v4 선택 이유

**최신 기능**
```css
/* CSS 변수 자동 지원 */
@theme {
  --color-primary: oklch(0.205 0 0);
}

/* 새로운 유틸리티 */
.shadow-brutal {
  box-shadow: 4px 4px 0px rgba(0,0,0,1);
}
```

### 🗄️ Prisma 6.13 선택 이유

**타입 안정성**
```typescript
// 자동 타입 생성
const user: User = await prisma.user.create({
  data: { /* 자동 완성 */ }
})
```

**복잡한 관계 관리**
```prisma
model MainPost {
  author    User @relation("UserMainPosts")
  category  MainCategory @relation()
  tags      MainPostTag[]
  // 39개 모델 관계 정의
}
```

### 🧪 Vitest 선택 이유

**빠른 실행 속도**
```typescript
// Jest 대비 5-10배 빠름
describe('PostCard', () => {
  it('renders correctly', () => {
    // HMR 지원으로 즉시 피드백
  })
})
```

---

## 📊 버전 관리 전략

### 최신 버전 유지
```json
{
  "next": "15.4.4",      // 항상 최신
  "react": "19.1.0",     // 최신 안정화
  "prisma": "^6.13.0",   // 마이너 업데이트 허용
  "typescript": "^5"     // 메이저 버전 고정
}
```

### 의존성 업데이트
```bash
# 정기적 업데이트 체크
npm outdated
npm update

# 보안 취약점 검사
npm audit
npm audit fix
```

---

## 🚀 성능 최적화 도구

| 도구 | 용도 |
|------|------|
| **Bundle Analyzer** | 번들 크기 분석 |
| **Vercel Analytics** | 실시간 성능 모니터링 |
| **Speed Insights** | Core Web Vitals 추적 |
| **Sentry** | 에러 트래킹 |