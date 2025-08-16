# 🔒 보안 구현

## 📋 목차
- [보안 아키텍처](#보안-아키텍처)
- [Rate Limiting](#rate-limiting)
- [인증 & 인가](#인증--인가)
- [입력 검증](#입력-검증)
- [보안 헤더](#보안-헤더)

---

## 보안 아키텍처

### 🛡️ 다층 방어 시스템

```
1단계: Rate Limiting (IP/User)
   ↓
2단계: CSRF 토큰 검증
   ↓
3단계: 입력 검증 (Zod)
   ↓
4단계: SQL Injection 방지 (Prisma)
   ↓
5단계: XSS 방지 (DOMPurify)
```

---

## Rate Limiting

### 🚦 3단계 제한 시스템

**1. IP 기반 제한**
```typescript
// lib/security/rate-limiter.ts
const ipLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'ip',
  points: 100,      // 요청 수
  duration: 60,     // 60초
  blockDuration: 600 // 10분 차단
})

export async function checkIpLimit(ip: string) {
  try {
    await ipLimiter.consume(ip)
    return { success: true }
  } catch {
    return { success: false, error: 'Too many requests' }
  }
}
```

**2. 사용자별 제한**
```typescript
const userLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'user',
  points: 200,      // 인증 사용자는 더 많이
  duration: 60
})
```

**3. Trust Score 시스템**
```typescript
// 사용자 신뢰도 기반 동적 제한
export async function getDynamicLimit(userId: string) {
  const trustScore = await calculateTrustScore(userId)
  
  if (trustScore > 80) return 500  // 신뢰도 높음
  if (trustScore > 50) return 200  // 일반
  return 50                        // 신뢰도 낮음
}

async function calculateTrustScore(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          mainPosts: true,
          mainComments: true,
          mainLikes: true
        }
      }
    }
  })
  
  // 활동 기반 점수 계산
  const postScore = user._count.mainPosts * 10
  const commentScore = user._count.mainComments * 5
  const likeScore = user._count.mainLikes * 1
  
  return Math.min(100, postScore + commentScore + likeScore)
}
```

---

## 인증 & 인가

### 🔐 NextAuth v5 설정

**auth.ts**
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({ clientId, clientSecret }),
    GitHub({ clientId, clientSecret }),
    Kakao({ clientId, clientSecret })
  ],
  
  adapter: PrismaAdapter(prisma),
  
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as GlobalRole
      }
      return session
    },
    
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error'
  }
})
```

### 🎯 권한 체크 미들웨어

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await auth()
  const path = request.nextUrl.pathname
  
  // 관리자 페이지 보호
  if (path.startsWith('/admin')) {
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }
  
  // API 보호
  if (path.startsWith('/api')) {
    const rateLimitResult = await checkRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
  }
}
```

---

## 입력 검증

### ✅ Zod 스키마 검증

```typescript
// lib/validations/post.ts
export const PostSchema = z.object({
  title: z.string()
    .min(1, '제목을 입력하세요')
    .max(100, '제목은 100자 이내')
    .regex(/^[^<>]*$/, 'HTML 태그 사용 불가'),
    
  content: z.string()
    .min(10, '내용은 10자 이상')
    .max(10000, '내용은 10000자 이내'),
    
  categoryId: z.string().cuid(),
  
  tags: z.array(z.string())
    .max(5, '태그는 최대 5개')
})

// API 라우트에서 사용
export async function POST(req: Request) {
  const body = await req.json()
  
  // 검증
  const validated = PostSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues },
      { status: 400 }
    )
  }
  
  // 안전한 데이터로 처리
  const post = await prisma.mainPost.create({
    data: validated.data
  })
}
```

### 🧼 XSS 방지

```typescript
// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(dirty: string) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  })
}

// 사용 예시
const cleanContent = sanitizeHtml(userInput)
```

---

## 보안 헤더

### 🔰 CSP & Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' *.vercel.com;
    `.replace(/\n/g, '')
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

### 🔑 CSRF 보호

```typescript
// lib/auth/csrf.ts
export async function validateCSRF(request: Request) {
  const token = request.headers.get('x-csrf-token')
  const sessionToken = await getSessionCSRFToken()
  
  if (!token || token !== sessionToken) {
    throw new Error('Invalid CSRF token')
  }
}

// API 라우트
export async function POST(req: Request) {
  try {
    await validateCSRF(req)
    // 처리 로직
  } catch {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    )
  }
}
```

---

## 🚨 악용 패턴 감지

### 패턴 분석 시스템

```typescript
// lib/security/abuse-detector.ts
export async function detectAbusePattern(userId: string) {
  const recentActions = await redis.lrange(`actions:${userId}`, 0, 100)
  
  // 패턴 분석
  const patterns = {
    rapidFire: detectRapidFire(recentActions),      // 연속 요청
    automated: detectAutomation(recentActions),      // 자동화 의심
    suspicious: detectSuspicious(recentActions)      // 의심 행동
  }
  
  if (patterns.rapidFire || patterns.automated) {
    await blockUser(userId, '악용 패턴 감지')
    return true
  }
  
  return false
}

function detectRapidFire(actions: string[]) {
  // 1초에 10개 이상 요청
  const timestamps = actions.map(a => JSON.parse(a).timestamp)
  const oneSecondAgo = Date.now() - 1000
  const recentCount = timestamps.filter(t => t > oneSecondAgo).length
  
  return recentCount > 10
}
```

---

## 📊 보안 모니터링

### 실시간 모니터링

```typescript
// lib/security/monitor.ts
export async function logSecurityEvent(event: SecurityEvent) {
  await prisma.securityLog.create({
    data: {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      details: event.details,
      severity: event.severity
    }
  })
  
  // 심각도 높은 이벤트는 즉시 알림
  if (event.severity === 'HIGH') {
    await notifyAdmins(event)
  }
}

// 사용 예시
await logSecurityEvent({
  type: 'RATE_LIMIT_EXCEEDED',
  userId: user.id,
  ip: request.ip,
  details: 'User exceeded rate limit 5 times',
  severity: 'MEDIUM'
})
```

### 보안 대시보드

```typescript
// 관리자용 보안 현황
export async function getSecurityMetrics() {
  const [
    blockedIPs,
    suspiciousUsers,
    recentAttacks,
    rateLimitHits
  ] = await Promise.all([
    redis.scard('blocked:ips'),
    redis.scard('suspicious:users'),
    prisma.securityLog.count({
      where: {
        severity: 'HIGH',
        createdAt: { gte: new Date(Date.now() - 86400000) }
      }
    }),
    redis.get('metrics:rate_limit_hits')
  ])
  
  return {
    blockedIPs,
    suspiciousUsers,
    recentAttacks,
    rateLimitHits
  }
}
```

---

## 🔐 비밀번호 정책

```typescript
// Zod 스키마
const PasswordSchema = z.string()
  .min(8, '최소 8자 이상')
  .regex(/[A-Z]/, '대문자 포함 필수')
  .regex(/[a-z]/, '소문자 포함 필수')
  .regex(/[0-9]/, '숫자 포함 필수')
  .regex(/[^A-Za-z0-9]/, '특수문자 포함 필수')
```