# 🗄️ 데이터베이스 설계

## 📋 목차
- [데이터베이스 구조](#데이터베이스-구조)
- [주요 모델](#주요-모델)
- [관계 설계](#관계-설계)
- [인덱스 전략](#인덱스-전략)
- [최적화 기법](#최적화-기법)

---

## 데이터베이스 구조

### 📊 기술 스택
- **PostgreSQL 16**: 메인 데이터베이스
- **Prisma 6.13**: Type-safe ORM
- **Redis**: 캐싱 레이어
- **총 24개 모델**: 복잡한 관계 관리

### 🏗️ 모델 카테고리

```
📦 데이터베이스 (24개 모델)
├── 👤 사용자 시스템 (3)
│   ├── User, Account, Session
│
├── 📝 메인 사이트 (7)
│   ├── MainPost, MainCategory, MainTag
│   ├── MainComment, MainLike, MainBookmark
│   └── MainPostTag
│
├── 🏘️ 커뮤니티 (10)
│   ├── Community, CommunityPost, CommunityCategory
│   ├── CommunityComment, CommunityLike, CommunityBookmark
│   ├── CommunityMember, CommunityAnnouncement
│   └── CommunityTag, CommunityPostTag
│
└── 🔧 기타 (4)
    ├── File, ChatChannel, ChatMessage
    └── Notification, Setting, SiteStats
```

---

## 주요 모델

### 👤 User 모델

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  image         String?
  globalRole    GlobalRole  @default(USER)
  
  // 관계
  mainPosts           MainPost[]
  mainComments        MainComment[]
  mainLikes           MainLike[]
  mainBookmarks       MainBookmark[]
  
  communityPosts      CommunityPost[]
  communityComments   CommunityComment[]
  communityLikes      CommunityLike[]
  communityBookmarks  CommunityBookmark[]
  
  ownedCommunities    Community[]
  communityMemberships CommunityMember[]
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([email])
  @@index([globalRole])
}

enum GlobalRole {
  USER
  MANAGER
  ADMIN
}
```

### 📝 MainPost 모델

```prisma
model MainPost {
  id          String      @id @default(cuid())
  title       String
  content     String      @db.Text
  slug        String      @unique
  status      PostStatus  @default(DRAFT)
  viewCount   Int         @default(0)
  
  // 관계
  author      User        @relation(fields: [authorId], references: [id])
  authorId    String
  
  category    MainCategory @relation(fields: [categoryId], references: [id])
  categoryId  String
  
  tags        MainPostTag[]
  comments    MainComment[]
  likes       MainLike[]
  bookmarks   MainBookmark[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  publishedAt DateTime?
  
  // 복합 인덱스 (성능 최적화)
  @@index([status, categoryId, createdAt])
  @@index([authorId, status])
  @@index([slug])
}

enum PostStatus {
  DRAFT
  PENDING    // 승인 대기
  PUBLISHED  // 게시됨
  REJECTED   // 거절됨
  ARCHIVED
  DELETED
}
```

### 🏘️ Community 모델

```prisma
model Community {
  id            String      @id @default(cuid())
  name          String
  slug          String      @unique
  description   String?
  image         String?
  visibility    CommunityVisibility @default(PUBLIC)
  
  // 관계
  owner         User        @relation(fields: [ownerId], references: [id])
  ownerId       String
  
  members       CommunityMember[]
  posts         CommunityPost[]
  categories    CommunityCategory[]
  announcements CommunityAnnouncement[]
  chatChannels  ChatChannel[]
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([slug])
  @@index([ownerId])
}

enum CommunityVisibility {
  PUBLIC
  PRIVATE
}
```

---

## 관계 설계

### 🔗 다대다 관계 (태그 시스템)

```prisma
// 중간 테이블을 통한 다대다
model MainPostTag {
  post      MainPost  @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  
  tag       MainTag   @relation(fields: [tagId], references: [id])
  tagId     String
  
  @@id([postId, tagId])
  @@index([tagId])
}

model MainTag {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  postCount Int       @default(0)  // 캐시된 카운트
  
  posts     MainPostTag[]
  
  @@index([slug])
  @@index([postCount])  // 인기 태그 조회용
}
```

### 🔄 일대다 관계 (댓글 시스템)

```prisma
model MainComment {
  id        String    @id @default(cuid())
  content   String    @db.Text
  
  // 부모 댓글 (대댓글 지원)
  parentId  String?
  parent    MainComment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   MainComment[] @relation("CommentReplies")
  
  // 작성자
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  
  // 게시글
  post      MainPost  @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@index([postId, createdAt])
  @@index([authorId])
  @@index([parentId])
}
```

---

## 인덱스 전략

### 🚀 복합 인덱스 설계

```prisma
// 자주 사용하는 쿼리 패턴에 맞춤
model MainPost {
  // 카테고리별 최신 게시글
  @@index([status, categoryId, createdAt(sort: Desc)])
  
  // 작성자별 게시글
  @@index([authorId, status])
  
  // URL 슬러그 조회
  @@index([slug])
}

model MainComment {
  // 게시글별 댓글 (최신순)
  @@index([postId, createdAt(sort: Desc)])
  
  // 대댓글 조회
  @@index([parentId])
}

model CommunityMember {
  // 커뮤니티별 멤버 조회
  @@index([communityId, status])
  
  // 사용자별 커뮤니티 조회
  @@index([userId, status])
}
```

### 📊 인덱스 사용 예시

```typescript
// 효율적인 쿼리 (인덱스 활용)
const posts = await prisma.mainPost.findMany({
  where: {
    status: 'PUBLISHED',
    categoryId: 'abc123',
  },
  orderBy: { createdAt: 'desc' },
  take: 20
})
// 실행 계획: Index Scan on idx_status_category_created
```

---

## 최적화 기법

### 1️⃣ Select 최적화

```typescript
// ❌ 모든 필드 조회
const posts = await prisma.mainPost.findMany({
  include: { author: true, category: true, tags: true }
})

// ✅ 필요한 필드만
const posts = await prisma.mainPost.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    createdAt: true,
    author: {
      select: { name: true, image: true }
    },
    _count: {
      select: { comments: true, likes: true }
    }
  }
})
```

### 2️⃣ N+1 문제 해결

```typescript
// ❌ N+1 문제
const posts = await prisma.mainPost.findMany()
for (const post of posts) {
  const author = await prisma.user.findUnique({
    where: { id: post.authorId }
  })
}

// ✅ Include 사용
const posts = await prisma.mainPost.findMany({
  include: { 
    author: true,
    _count: { select: { comments: true }}
  }
})
```

### 3️⃣ 집계 최적화

```typescript
// 태그별 게시글 수 (캐시된 값 사용)
const popularTags = await prisma.mainTag.findMany({
  orderBy: { postCount: 'desc' },
  take: 10
})

// postCount 업데이트 (트랜잭션)
await prisma.$transaction([
  prisma.mainPostTag.create({ data: { postId, tagId }}),
  prisma.mainTag.update({
    where: { id: tagId },
    data: { postCount: { increment: 1 }}
  })
])
```

### 4️⃣ 페이지네이션

```typescript
// 커서 기반 페이지네이션 (효율적)
const posts = await prisma.mainPost.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastPostId },
  where: { status: 'PUBLISHED' },
  orderBy: { createdAt: 'desc' }
})

// 오프셋 기반 (간단하지만 느림)
const posts = await prisma.mainPost.findMany({
  skip: page * 20,
  take: 20
})
```

---

## 🔄 마이그레이션 전략

### 개발 환경
```bash
# 스키마 변경 후
npm run db:push    # 빠른 동기화

# 또는 마이그레이션
npm run db:migrate  # 마이그레이션 생성
```

### 프로덕션 환경
```bash
# 1. 마이그레이션 생성
npx prisma migrate dev --name add_new_field

# 2. 검토
npx prisma migrate status

# 3. 배포
npx prisma migrate deploy
```

---

## 📈 모니터링

### 쿼리 성능 분석

```typescript
// Prisma 로깅 설정
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' }
  ]
})

// 느린 쿼리 감지
prisma.$on('query', (e) => {
  if (e.duration > 1000) {  // 1초 이상
    console.warn('Slow query:', {
      query: e.query,
      duration: e.duration,
      params: e.params
    })
  }
})
```

### 데이터베이스 통계

```sql
-- 테이블 크기 확인
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```