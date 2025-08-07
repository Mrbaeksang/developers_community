# 🚀 Next.js 프로젝트 실무 가이드

## 1. 빠른 시작

### 필수 환경변수 (.env)
```bash
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 자주 쓰는 명령어
```bash
npm run dev           # 개발서버
npm run build         # 빌드
npm run lint          # 린트 체크
npm run type-check    # 타입 체크
npx prisma studio     # DB 브라우저
npx prisma generate   # Prisma 타입 생성
```

## 2. 프로젝트 구조 & 파일 맵

### 📑 페이지 현황 (25개)
```
app/
├── page.tsx                    # 홈페이지
├── auth/signin/                # 로그인
├── main/
│   ├── posts/                  # 게시글 목록
│   ├── posts/[id]/             # 게시글 상세
│   ├── tags/[name]/            # 태그별 게시글
│   └── write/                  # 글쓰기
├── admin/                      # 관리자 (7개 페이지)
│   ├── page.tsx                # 대시보드
│   ├── categories/             # 카테고리 관리
│   ├── communities/            # 커뮤니티 관리
│   ├── database/               # DB 관리
│   ├── pending/                # 승인 대기
│   ├── posts/                  # 게시글 관리
│   └── users/                  # 사용자 관리
├── communities/                # 커뮤니티 (7개 페이지)
│   ├── [id]/
│   ├── [id]/posts/
│   ├── [id]/posts/[postId]/
│   ├── [id]/settings/
│   ├── [id]/write/
│   └── new/
├── profile/[id]/               # 프로필
├── users/bookmarks/            # 북마크
└── dashboard/
    └── notifications/          # 알림
```

### 📁 lib 폴더 구조 (핵심 로직)
```
lib/
├── core/                       # 핵심 인프라
│   ├── prisma.ts              # DB 연결 (Prisma 클라이언트)
│   ├── redis.ts               # Redis 연결 & 캐싱
│   └── utils.ts               # 공통 유틸리티 (cn, formatDate 등)
│
├── auth/                       # 인증/보안
│   ├── session.ts             # 세션 관리 (auth-utils.ts)
│   ├── permissions.ts         # 권한 체크 (permission-helpers.ts)
│   ├── roles.ts               # 역할 계층 (role-hierarchy.ts)
│   └── csrf.ts                # CSRF 토큰 생성/검증
│
├── api/                        # API 관련
│   ├── client.ts              # API 클라이언트 (api.ts)
│   ├── response.ts            # 표준 응답 포맷 (api-response.ts)
│   ├── monitoring.ts          # API 모니터링 (api-monitoring.ts)
│   ├── monitoring-base.ts     # 기본 모니터링 (monitoring.ts)
│   ├── rate-limit.ts          # Rate Limiting (rate-limiter.ts)
│   ├── validation.ts          # Zod 스키마 (validation-schemas.ts)
│   └── errors.ts              # 에러 핸들링 (error-handler.ts)
│
├── cache/                      # 캐싱 전략
│   ├── redis.ts               # Redis 캐시 (redis-cache.ts)
│   ├── redis-sync.ts          # Redis 동기화
│   ├── query.ts               # 쿼리 캐시 (db/query-cache.ts)
│   └── patterns.ts            # Prisma 패턴 (prisma-select-patterns.ts)
│
├── post/                       # 게시글 관련
│   ├── viewcount.ts           # 조회수 처리 (common-viewcount-utils.ts)
│   └── pagination.ts          # 페이지네이션 (pagination-utils.ts)
│
├── ui/                         # UI 유틸리티
│   ├── colors.ts              # 색상 유틸 (color-utils.ts)
│   ├── images.ts              # 이미지 처리 (image-utils.ts)
│   ├── unsplash.ts            # Unsplash API (unsplash-utils.ts)
│   ├── markdown.ts            # 마크다운 렌더링
│   ├── date.ts                # 날짜 포맷 (date-utils.ts)
│   └── banner.ts              # 배너 관리 (banner-utils.ts)
│
├── chat/                       # 채팅
│   ├── utils.ts               # 채팅 유틸 (chat-utils.ts)
│   └── broadcast.ts           # 브로드캐스트 (chat-broadcast.ts)
│
├── notifications/              # 알림
│   ├── index.ts               # 알림 메인 (notifications.ts)
│   └── emitter.ts             # 이벤트 에미터 (notification-emitter.ts)
│
├── community/                  # 커뮤니티
│   └── utils.ts               # 커뮤니티 유틸 (community-utils.ts)
│
├── common/                     # 공통
│   ├── types.ts               # 공통 타입 (common-types.ts)
│   └── debounce.ts            # 디바운스
│
└── security/                   # 보안 (신규 추가)
    ├── middleware.ts           # 보안 미들웨어 통합
    ├── rate-limiter.ts         # 고급 Rate Limiting
    ├── trust-scorer.ts         # 신뢰도 점수
    ├── pattern-detector.ts     # 패턴 감지
    ├── abuse-tracker.ts        # 악용 추적
    ├── adaptive-limiter.ts     # 적응형 제한
    ├── metrics.ts              # 메트릭 수집
    └── actions.ts              # 액션 타입 정의
```

### 📊 API 라우트 현황 (102개)

#### 인증 & 보안 (3)
- `/api/auth/[...nextauth]` - NextAuth 인증
- `/api/csrf-token` - CSRF 토큰 관리
- `/api/errors` - 에러 로깅

#### 관리자 (18)
- `/api/admin/categories` - 카테고리 관리
- `/api/admin/communities` - 커뮤니티 관리
- `/api/admin/data-viewer/[table]` - 데이터 조회
- `/api/admin/monitoring/errors` - 에러 모니터링
- `/api/admin/monitoring/traffic` - 트래픽 모니터링
- `/api/admin/posts/main` - 메인 게시글 관리
- `/api/admin/posts/community` - 커뮤니티 게시글 관리
- `/api/admin/stats` - 관리자 통계
- `/api/admin/users` - 사용자 관리

#### 메인 게시글 (17)
- `/api/main/posts` - 게시글 CRUD
- `/api/main/posts/[id]/comments` - 댓글 관리
- `/api/main/posts/[id]/like` - 좋아요
- `/api/main/posts/[id]/bookmark` - 북마크
- `/api/main/posts/[id]/view` - 조회수
- `/api/main/posts/[id]/related` - 관련 게시글
- `/api/main/posts/[id]/approve` - 승인
- `/api/main/posts/pending` - 대기중 게시글
- `/api/main/posts/search` - 검색
- `/api/main/posts/weekly-trending` - 주간 인기

#### 커뮤니티 (28)
- `/api/communities` - 커뮤니티 CRUD
- `/api/communities/[id]/posts` - 게시글 관리
- `/api/communities/[id]/posts/[postId]/comments` - 댓글
- `/api/communities/[id]/posts/[postId]/like` - 좋아요
- `/api/communities/[id]/posts/[postId]/bookmark` - 북마크
- `/api/communities/[id]/posts/[postId]/view` - 조회수
- `/api/communities/[id]/members` - 멤버 관리
- `/api/communities/[id]/join` - 가입
- `/api/communities/[id]/categories` - 카테고리
- `/api/communities/[id]/announcements` - 공지사항
- `/api/communities/[id]/channel` - 채널

#### 채팅 (8)
- `/api/chat/channels` - 채널 관리
- `/api/chat/channels/[channelId]/messages` - 메시지
- `/api/chat/channels/[channelId]/events` - SSE 이벤트
- `/api/chat/channels/[channelId]/read` - 읽음 처리
- `/api/chat/channels/[channelId]/typing` - 타이핑 상태
- `/api/chat/global` - 전역 채팅
- `/api/chat/upload` - 파일 업로드

#### 사용자 (9)
- `/api/users/me` - 내 정보
- `/api/users/[id]` - 사용자 정보
- `/api/users/[id]/profile` - 프로필
- `/api/users/[id]/posts` - 작성 게시글
- `/api/users/[id]/communities` - 가입 커뮤니티
- `/api/users/bookmarks` - 북마크 목록
- `/api/users/stats` - 통계

#### 알림 (5)
- `/api/notifications` - 알림 목록
- `/api/notifications/[id]` - 알림 상세
- `/api/notifications/[id]/read` - 읽음 처리
- `/api/notifications/read-all` - 모두 읽음
- `/api/notifications/sse` - SSE 스트림

#### 파일 관리 (5)
- `/api/upload` - 파일 업로드
- `/api/files/upload` - 파일 업로드
- `/api/files/[id]` - 파일 관리
- `/api/files/cleanup` - 정리
- `/api/download` - 다운로드
- `/api/image-proxy` - 이미지 프록시

#### 통계 & 모니터링 (7)
- `/api/stats/user-activity` - 사용자 활동
- `/api/stats/post-trends` - 게시글 트렌드
- `/api/activities/realtime` - 실시간 활동
- `/api/visitors/track` - 방문자 추적
- `/api/track/page-view` - 페이지뷰 추적
- `/api/test-monitoring` - 모니터링 테스트
- `/api/cron/sync-views` - 조회수 동기화

#### 검색 & 조회 (5)
- `/api/search` - 통합 검색
- `/api/main/tags` - 태그 목록
- `/api/main/tags/trending` - 인기 태그
- `/api/main/users/active` - 활성 사용자
- `/api/main/users/weekly-mvp` - 주간 MVP

> 카테고리별 분류는 위 섹션 참조

## 3. 작업 TODO (우선순위별)

### 🔴 긴급 (1주일 내)
1. **NotificationBell 컴포넌트 구현**
   ```tsx
   // components/notifications/NotificationBell.tsx
   // 필요: 알림 개수 표시, 드롭다운, SSE 연결
   // 참고: NotificationDropdown.tsx
   ```

2. **lib 파일 단위 테스트**
   ```bash
   # 우선 테스트 필요 파일
   lib/auth/csrf.ts
   lib/auth/permissions.ts
   lib/security/rate-limiter.ts
   lib/cache/redis.ts
   ```

3. **성능 최적화**
   - 번들 크기 줄이기 (1.2MB → 800KB)
   - Next/Image 적용
   - 동적 import 적용

### 🟡 중요 (2주일 내)
1. **미구현 컴포넌트 (11개)**
   - TagSelector, CategorySelector
   - ImageUploader
   - UserStats, ActivityFeed
   - CommunityCard
   - CommentForm
   - SearchFilters
   - Pagination
   - LoadingSpinner, EmptyState

2. **API 통합 테스트**
   ```bash
   # 핵심 API 테스트
   app/api/auth/
   app/api/main/posts/
   app/api/admin/
   ```

3. **보안 점검**
   - CSRF 토큰 검증
   - Rate Limiting 동작 확인
   - 권한 체크 누락 확인

### 🟢 개선 (1개월 내)
1. **CI/CD 파이프라인**
2. **Sentry 에러 트래킹**
3. **E2E 테스트 (Playwright)**
4. **접근성 개선 (WCAG 2.1 AA)**

## 4. API 레퍼런스 (주요 엔드포인트)

### 인증
```typescript
// POST /api/auth/[...nextauth]
// NextAuth 인증 처리

// GET /api/csrf-token
// Response: { token: string }
```

### 게시글
```typescript
// GET /api/main/posts
// Query: ?page=1&limit=10&category=tech
// Response: { posts: Post[], total: number }

// POST /api/main/posts
// Body: { title, content, categoryId, tags }
// Headers: { 'X-CSRF-Token': token }
// Response: { post: Post }

// POST /api/main/posts/[id]/like
// Response: { liked: boolean, likeCount: number }
```

### 커뮤니티
```typescript
// GET /api/communities/[id]/posts
// Query: ?page=1&limit=10
// Response: { posts: CommunityPost[], total: number }

// POST /api/communities/[id]/join
// Response: { membership: Membership }
```

### 관리자
```typescript
// GET /api/admin/stats
// Response: { users, posts, comments, dailyStats }
// 권한: ADMIN only

// PUT /api/admin/posts/[id]/approve
// Response: { post: Post }
// 권한: ADMIN, MANAGER
```

### 실시간
```typescript
// GET /api/chat/channels/[channelId]/events
// SSE 스트림
// Event: { type: 'message', data: Message }

// GET /api/notifications/sse
// SSE 스트림
// Event: { type: 'notification', data: Notification }
```

### Rate Limiting 정보
```typescript
// 모든 API 응답 헤더
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200000
```

## 5. 트러블슈팅

### 자주 발생하는 에러

#### Prisma 타입 에러
```bash
# 해결
npx prisma generate
npm run type-check
```

#### Redis 연결 실패
```bash
# 로컬 Redis 실행
docker run -d -p 6379:6379 redis
# 또는 .env의 REDIS_URL 확인
```

#### CSRF 토큰 에러
```typescript
// 클라이언트에서 토큰 가져오기
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf-token='))
  ?.split('=')[1]
```

#### Rate Limit 초과
```typescript
// 429 에러 시 헤더 확인
X-RateLimit-RetryAfter: 60 // 60초 후 재시도
```

#### Next.js 15 params 에러
```typescript
// ❌ 잘못된 코드
{ params }: { params: { id: string } }

// ✅ 올바른 코드
{ params }: { params: Promise<{ id: string }> }
const { id } = await params
```

---

> **버전**: 4.0 - 2025.01.08
> **목적**: 실무 중심 가이드로 전면 개편
> **다음 업데이트**: 컴포넌트 구현 후
