# 🚀 Vercel 배포 최적화

## 📋 목차
- [배포 설정](#배포-설정)
- [환경 변수](#환경-변수)
- [빌드 최적화](#빌드-최적화)
- [Edge Functions](#edge-functions)
- [캐싱 전략](#캐싱-전략)
- [모니터링](#모니터링)

---

## 배포 설정

### ⚙️ vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["icn1"],
  "functions": {
    "app/api/ai/qa-bot/route.ts": {
      "maxDuration": 180
    },
    "app/api/*/route.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate=59"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 🌍 Region 설정

| Region | 위치 | 용도 |
|--------|------|------|
| **icn1** | 서울 | 주 배포 (한국 사용자) |
| **hnd1** | 도쿄 | 백업 리전 |
| **sfo1** | 샌프란시스코 | 글로벌 |

---

## 환경 변수

### 🔐 필수 환경 변수

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."
KAKAO_CLIENT_ID="..."
KAKAO_CLIENT_SECRET="..."

# Storage
BLOB_READ_WRITE_TOKEN="..."

# Redis
KV_URL="..."
KV_REST_API_URL="..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."

# AI
OPENROUTER_API_KEY="..."
AI_BOT_USER_ID="..."
```

### 🔄 환경별 설정

```bash
# Production
NEXT_PUBLIC_API_URL="https://api.devcom.kr"
NEXT_PUBLIC_ENVIRONMENT="production"

# Preview
NEXT_PUBLIC_API_URL="https://preview.devcom.kr"
NEXT_PUBLIC_ENVIRONMENT="preview"

# Development
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_ENVIRONMENT="development"
```

---

## 빌드 최적화

### ⚡ Next.js 최적화

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com'
      }
    ]
  },
  
  // 번들 분석
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-*',
      'lucide-react',
      '@tanstack/react-query'
    ]
  },
  
  // 출력 최적화
  output: 'standalone',
  
  // SWC 최적화
  swcMinify: true,
  
  // 압축
  compress: true
}
```

### 📦 번들 크기 최적화

```bash
# 번들 분석
ANALYZE=true npm run build

# 사용하지 않는 패키지 제거
npm prune --production

# Tree shaking 확인
npm run build -- --profile
```

### 🎨 이미지 최적화

```typescript
// Vercel Image Optimization
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="..."
  width={800}
  height={600}
  quality={85}
  placeholder="blur"
  blurDataURL={blurUrl}
  loading="lazy"
/>
```

---

## Edge Functions

### 🌐 Edge Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 지역 기반 라우팅
  const country = request.geo?.country || 'KR'
  
  // 캐시 헤더
  const response = NextResponse.next()
  
  // 정적 자산 캐싱
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }
  
  // API 캐싱
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set(
      'Cache-Control',
      's-maxage=1, stale-while-revalidate=59'
    )
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### ⚡ Edge API Routes

```typescript
// app/api/edge/route.ts
import { NextRequest } from 'next/server'

export const runtime = 'edge' // Edge Runtime 사용

export async function GET(request: NextRequest) {
  // Edge에서 실행되는 API
  const data = await fetch('https://api.example.com', {
    next: { revalidate: 60 } // ISR 캐싱
  })
  
  return Response.json(await data.json())
}
```

---

## 캐싱 전략

### 🔄 Data Cache

```typescript
// ISR (Incremental Static Regeneration)
export const revalidate = 60 // 60초마다 재생성

// On-demand Revalidation
import { revalidatePath, revalidateTag } from 'next/cache'

// 경로 재검증
revalidatePath('/main/posts')

// 태그 재검증
revalidateTag('posts')
```

### 📦 Static Generation

```typescript
// 정적 페이지 생성
export async function generateStaticParams() {
  const posts = await prisma.mainPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true }
  })
  
  return posts.map((post) => ({
    id: post.id
  }))
}
```

### 🚀 CDN 캐싱

```typescript
// Vercel Edge Cache
export async function GET() {
  return new Response('Hello', {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      'CDN-Cache-Control': 'max-age=86400',
      'Vercel-CDN-Cache-Control': 'max-age=86400'
    }
  })
}
```

---

## 모니터링

### 📊 Analytics

```typescript
// Vercel Analytics
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 🔍 로깅

```typescript
// 구조화된 로깅
console.error(JSON.stringify({
  level: 'error',
  message: 'Database connection failed',
  timestamp: new Date().toISOString(),
  context: {
    userId: session?.user?.id,
    path: request.nextUrl.pathname
  }
}))
```

### 📈 Web Vitals

```typescript
// app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    console.log(metric)
    
    // 외부 모니터링 서비스로 전송
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(metric)
    })
  }
}
```

---

## 🚀 배포 프로세스

### GitHub Integration

```yaml
# .github/workflows/preview.yml
name: Vercel Preview Deployment
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  Deploy-Preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

### 프로덕션 배포

```bash
# 자동 배포 (main 브랜치)
git push origin main

# 수동 배포
vercel --prod

# 롤백
vercel rollback [deployment-url]
```

---

## 💰 비용 최적화

### Function 최적화

```typescript
// 함수 크기 줄이기
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}

// 불필요한 의존성 제거
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('../components/HeavyComponent'),
  { ssr: false }
)
```

### 대역폭 최적화

```typescript
// 응답 압축
import { compress } from 'next/dist/compiled/compression'

// 이미지 최적화
const optimizedUrl = `/_vercel/image?url=${encodeURIComponent(url)}&w=640&q=75`
```

### 사용량 모니터링

```bash
# Vercel CLI로 사용량 확인
vercel inspect [deployment-url]

# 로그 확인
vercel logs [deployment-url]
```

---

## 🔧 트러블슈팅

### 일반적인 이슈

| 문제 | 원인 | 해결 |
|------|------|------|
| **빌드 실패** | 메모리 부족 | `NODE_OPTIONS="--max-old-space-size=4096"` |
| **느린 콜드 스타트** | 번들 크기 | 코드 스플리팅, dynamic imports |
| **Function 타임아웃** | 긴 처리 시간 | Edge Functions 사용, 백그라운드 작업 |
| **높은 비용** | 과도한 호출 | 캐싱 강화, ISR 활용 |

### 디버깅 팁

```bash
# 로컬에서 Vercel 환경 테스트
vercel dev

# 환경 변수 확인
vercel env ls

# 빌드 로그 확인
vercel logs --output raw
```