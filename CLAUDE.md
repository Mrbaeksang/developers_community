# 개발자 커뮤니티 프로젝트 - AI 에이전트 가이드

## 🚨 필수 준수 사항

### 1️⃣ 코드 변경 전 필수 체크리스트
```bash
# 매번 실행 (필수)
1. Read prisma/schema.prisma  # 전체 스키마 읽기 (가장 중요!)
2. npm run lint               # 현재 경고사항 확인
3. npm run type-check         # 현재 오류 확인
```

### 2️⃣ 프로젝트 아키텍처

**플랫폼 구조**: 메인 사이트(승인제) + 사용자 생성 커뮤니티(자유게시)
- **메인 사이트**: 승인제 Q&A, 정보공유 (PENDING → PUBLISHED)
- **커뮤니티**: 즉시 게시, 파일 업로드, 실시간 채팅 지원

**기술 스택 (2025년 최신)**:
- Next.js 15.4.4 + React 19.1.0 + TypeScript 5
- NextAuth v5.0.0-beta.29 (OAuth: Google, GitHub, Kakao)
- Prisma 6.12.0 + PostgreSQL
- Tailwind CSS v4 + Radix UI
- Vercel Blob Storage + Redis KV
- Zod v4.0.10 (validation)

### 3️⃣ 데이터베이스 스키마 규칙 (절대 추측 금지)

#### ✅ 정확한 모델명
```typescript
// 메인 사이트 모델
MainPost, MainCategory, MainTag, MainComment
MainLike, MainBookmark, MainPostTag

// 커뮤니티 모델  
CommunityPost, CommunityCategory, CommunityComment
CommunityLike, CommunityBookmark, CommunityAnnouncement
CommunityTag, CommunityPostTag, CommunityMember

// 사용자 및 기타
User, Account, Session
File, ChatChannel, ChatMessage, Notification
Setting, SiteStats

// ❌ 절대 사용 금지: Post, Category, Tag, Comment
```

#### ✅ 정확한 관계명
```typescript
// User 관계 (정확한 이름 사용)
user.mainPosts           // ❌ NOT user.posts
user.mainComments        // ❌ NOT user.comments  
user.mainLikes          
user.mainBookmarks
user.communityPosts
user.communityComments
user.communityLikes
user.communityBookmarks
user.ownedCommunities    // as owner
user.communityMemberships // as member

// 태그 관계
tag.posts               // through MainPostTag/CommunityPostTag
tag.postCount          // DB 필드, 계산값 아님
```

#### ✅ Enum 값들
```typescript
// GlobalRole
'USER' | 'MANAGER' | 'ADMIN'

// CommunityRole  
'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER'

// PostStatus
'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'DELETED'

// MembershipStatus
'PENDING' | 'ACTIVE' | 'BANNED' | 'LEFT'

// CommunityVisibility
'PUBLIC' | 'PRIVATE'
```

### 4️⃣ 프레임워크 패턴

#### Next.js 15 (중요!)
```typescript
// ✅ 정확: Async params (Next.js 15)
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
}

// ✅ API 라우트
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}

// ❌ 틀림: Sync params (Next.js 14 방식)
{ params }: { params: { id: string } }
```

#### NextAuth v5
```typescript
// ✅ 정확
import { auth } from '@/auth'
const session = await auth()

// ❌ 틀림 (v4 방식)
import { getServerSession } from 'next-auth'
```

#### Zod v4
```typescript
// ✅ 정확: issues 배열
error.issues[0].message

// ❌ 틀림: errors 배열 (v2/v3)
error.errors[0].message
```

### 5️⃣ 타입 안정성 및 Null 처리

```typescript
// ✅ 정확: Prisma null → TypeScript undefined
const image = user.image || undefined
const name = user.name || 'Unknown'

// ❌ 틀림: Non-null assertion 사용
const image = user.image!  // ESLint 오류 발생

// ✅ 정확: 세션 체크
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = session.user.id

// ❌ 틀림: console.log (ESLint no-console 규칙)
console.log('debug', data)

// ✅ 정확: console.error/warn만 허용
console.error('Error:', error)
```

### 6️⃣ 라우팅 패턴

```typescript
// 메인 사이트 게시글
/main/posts/${post.id}        // ID 기반
/main/categories/${category.slug}

// 커뮤니티 게시글
/communities/${community.slug}/posts/${post.id}
/communities/${community.slug}/categories/${category.slug}

// 프로필
/profile/${user.id}
/settings                     // 현재 사용자 설정

// API
/api/main/posts
/api/communities/[slug]/posts
/api/user/profile
```

### 7️⃣ 컴포넌트 최적화 패턴

```typescript
// ✅ React.memo 사용
export const CommentCard = memo(function CommentCard({ ... }) {
  // useMemo로 계산 최적화
  const formattedDate = useMemo(() => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: ko,
    })
  }, [createdAt])
})

// ✅ 공통 컴포넌트 활용
<AuthorAvatar author={author} size="sm" showName />
<PostStats likeCount={likes} commentCount={comments} />
```

### 8️⃣ 비즈니스 규칙

**게시글 승인 프로세스**:
- **메인 게시글**: DRAFT → PENDING → PUBLISHED (매니저/관리자 승인 필요)
- **커뮤니티 게시글**: DRAFT → PUBLISHED (즉시 게시)

**파일 업로드**:
- **메인 게시글**: ❌ 파일 업로드 불가
- **커뮤니티 게시글**: ✅ 파일 업로드 가능 (Vercel Blob)

**권한 계층**:
- **전역**: ADMIN > MANAGER > USER
- **커뮤니티**: OWNER > ADMIN > MODERATOR > MEMBER

**실시간 기능**:
- 채팅 시스템 (커뮤니티별)
- 알림 시스템 (실시간 푸시)
- Redis 기반 캐싱 및 동기화

### 9️⃣ 파일 구조

```
app/
├── (auth)/              # 인증 페이지
├── main/               # 메인 사이트
│   ├── posts/[id]/     
│   └── categories/[slug]/
├── communities/        # 커뮤니티
│   └── [slug]/
├── profile/[id]/       # 사용자 프로필
├── settings/           # 설정
└── api/               # API 라우트

components/
├── posts/             # PostCard 등
├── shared/            # 공통 컴포넌트
├── profile/           # 프로필 관련
├── communities/       # 커뮤니티 관련
├── dashboard/         # 대시보드
├── settings/          # 설정
└── ui/               # 기본 UI 컴포넌트

lib/
├── core/             # prisma, utils, redis
├── auth/             # 인증 관련
├── api/              # API 유틸리티
├── cache/            # 캐시 시스템
├── post/             # 게시글 유틸리티
├── chat/             # 채팅 시스템
├── notifications/    # 알림 시스템
├── community/        # 커뮤니티 유틸리티
├── comment/          # 댓글 타입 및 유틸리티
├── ui/               # UI 유틸리티
└── common/           # 공통 타입 및 유틸리티
```

### 🔟 개발 워크플로우

```bash

# 코드 품질 검사 (커밋 전 필수)
npm run format:check     # Prettier 검사
npm run lint             # ESLint 검사  
npm run type-check       # TypeScript 검사
npm run test            # 전체 테스트 (lint + type-check)
npm run verify          # 전체 검증 및 수정

# 데이터베이스
npm run db:generate     # Prisma 클라이언트 생성
npm run db:push         # 스키마 푸시 (개발용)
npm run db:migrate      # 마이그레이션 (프로덕션용)

# 빌드 및 배포
npm run build           # 프로덕션 빌드
npm run start           # 프로덕션 서버
```

### 1️⃣1️⃣ 커밋 전 필수 검사

```bash
# 절대 준수 (NO EXCEPTIONS)
npm run format:check    # 반드시 통과
npm run lint           # 0개 오류
npm run type-check     # 반드시 통과

# NEVER use --no-verify
# 모든 이슈 해결 후 커밋
```

### 1️⃣2️⃣ 성능 최적화

**이미지 최적화**:
- Next.js Image 컴포넌트 + WebP/AVIF
- Vercel Blob Storage 연동
- 1년 캐싱 정책

**번들 최적화**:
- Package imports 최적화 (Radix UI, Lucide 등)
- Bundle analyzer 활용 (`ANALYZE=true npm run build`)

**데이터베이스 최적화**:
- 복합 인덱스 활용
- Redis 캐싱 및 동기화
- 쿼리 최적化 (select 필드 제한)

### 1️⃣3️⃣ 커밋 메시지 규칙

**AI 관련 멘션 제거**:
- "🤖 Generated with [Claude Code]" 제거
- "Co-Authored-By: Claude" 제거
- 모든 AI 관련 attribution 제거

---

## 💡 AI 에이전트 사용 팁

1. **항상 스키마 먼저**: 코드 작성 전 `prisma/schema.prisma` 읽기
2. **모델명 확인**: Main*/Community* 접두사 사용
3. **타입 안전성**: Non-null assertion 절대 금지  
4. **ESLint 준수**: console.log 사용 금지
5. **Next.js 15**: Async params 패턴 사용
6. **최적화 적용**: memo, useMemo, 공통 컴포넌트 활용