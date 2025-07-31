# Homepage (localhost:3000) 구현 계획

## 1. 홈페이지에 표시될 내용

### 목표
- homepage_redesign.html 디자인으로 홈페이지만 변경
- 기존 컴포넌트와 API 최대한 재사용
- 사용자가 처음 방문했을 때 보는 화면 개선

### 홈페이지 구성 요소 (상세 매핑)
1. **히어로 섹션**: 4개 기능 카드 + 실시간 활동 피드
   - 메인 게시글 카드 → `/main/posts` (기존 MainPost 목록)
   - 자유게시판 카드 → `/main/posts?category=free` (MainCategory.slug = "free")
   - Q&A 카드 → `/main/posts?category=qna` (MainCategory.slug = "qna")  
   - 커뮤니티 카드 → `/communities` (기존 Community 목록)
   - 실시간 활동 피드 → 새 API 필요

2. **카테고리 그리드**: 기술 카테고리 탐색
   - 각 카드 → `/main/posts?category={categorySlug}` (MainCategory 기반)

3. **탭 게시글**: 주간인기/최신/Q&A 통합 표시
   - 주간 인기 탭 → 기존 WeeklyPopularPosts 활용
   - 최신 게시글 탭 → 기존 RecentPosts 활용
   - 활발한 Q&A 탭 → Q&A 카테고리 중 댓글 많은 순

4. **활성 커뮤니티**: 인기 커뮤니티 목록
   - 기존 ActiveCommunities 컴포넌트 활용

5. **오늘의 통계**: 사이트 활동 지표
   - 기존 `/api/main/stats` 활용

## 2. 홈페이지 컴포넌트 구현 계획

### 2.1 HeroSection.tsx 완전 재작성
**새로운 구조**:
- 왼쪽: 4개 기능 카드 (2x2 그리드)
- 오른쪽: 실시간 활동 피드

**필요한 데이터**:
- 메인 게시글 통계
- 커뮤니티 통계
- Q&A 해결률
- 실시간 활동 목록

### 2.2 TabPosts.tsx 신규 생성
**탭 구성**:
1. 🔥 주간 인기 (기존 WeeklyPopularPosts 활용)
2. ⚡ 최신 게시글 (기존 RecentPosts 활용)
3. 💬 활발한 Q&A (새로 구현)

### 2.3 app/page.tsx 수정
**섹션 순서**:
1. HeroSection (새로운 디자인)
2. CategoryGrid (위치 이동)
3. TabPosts (신규)
4. ActiveCommunities
5. TodayStats (신규)
6. Footer

## 3. 상세 API 및 경로 매핑

### 히어로 섹션 (4개 기능 카드 + 실시간 활동)

#### 4개 기능 카드 데이터 소스 (실제 API 기반)
```typescript
// 메인 게시글 카드 데이터 - 실제 API: POST 개수 쿼리
GET /api/main/posts?limit=1 → pagination.total로 전체 게시글 수 계산

// 자유게시판 카드 데이터 - 실제 API: category slug 필터링
GET /api/main/posts?category=free&limit=1 → pagination.total로 자유게시판 게시글 수

// Q&A 카드 데이터 - category slug로 Q&A 게시글 수
GET /api/main/posts?category=qna&limit=1 → pagination.total로 Q&A 게시글 수

// 커뮤니티 카드 데이터 - 실제 API: communities 목록에서 개수 계산
GET /api/communities?limit=1 → pagination.total로 커뮤니티 수
```

#### 실시간 활동 피드 API (신규 구현 필요)
```typescript
// 새로 만들 엔드포인트
GET /api/activities/recent?limit=5
// 응답 형태:
{
  activities: [
    {
      type: "post_created" | "comment_added" | "chat_active" | "trending",
      user: { name: "김개발", image: "..." },
      title: "React 최적화 가이드",
      category: "메인 게시글" | "Q&A" | "자유게시판" | "커뮤니티",
      timestamp: "방금 전" | "2분 전",
      metadata?: { viewCount?: number, communityName?: string }
    }
  ]
}
```

### 카테고리 그리드
```typescript
// 기존 API 활용
GET /api/main/categories → MainCategory 목록
// 각 카드 클릭 시 이동: /main/posts?category={categorySlug}
// 예: /main/posts?category=react, /main/posts?category=nextjs
```

### 탭 게시글 섹션 API 매핑

#### 🔥 주간 인기 탭
```typescript
// 기존 API 재사용
GET /api/main/posts/weekly-trending?limit=4
// WeeklyPopularPosts 컴포넌트 로직 재활용
```

#### ⚡ 최신 게시글 탭  
```typescript
// 기존 API 재사용
GET /api/main/posts?sort=latest&limit=4
// RecentPosts 컴포넌트 로직 재활용
```

#### 💬 활발한 Q&A 탭 (실제 API 사용)
```typescript
// 실제 사용 가능한 정렬 옵션: 'popular', 'likes', 'bookmarks', 'commented', 'latest'
GET /api/main/posts?category=qna&sort=commented&limit=4
// sort=commented: 댓글 많은 순 정렬 (commentCount desc)
// 실제 지원되는 파라미터만 사용
```

### 활성 커뮤니티 섹션
```typescript
// 기존 API 재사용
GET /api/communities/active?limit=4
// ActiveCommunities 컴포넌트 그대로 활용
// 각 커뮤니티 클릭 시: /communities/{slug}
```

### 오늘의 통계 섹션
```typescript
// 기존 /api/main/stats 확장 활용
GET /api/main/stats
// 현재 응답: { totalUsers, weeklyPosts, weeklyComments, activeDiscussions }
// HTML 매핑:
// - 총 게시글: weeklyPosts + 기존 게시글 (별도 카운트 필요)
// - 활성 사용자: totalUsers (온라인 사용자는 별도 구현 필요)  
// - 오늘 조회수: Redis 캐시된 조회수 데이터 (별도 구현 필요)
// - 해결된 질문: activeDiscussions (Q&A 카테고리 필터링 필요)
```

## 4. 홈페이지용 API 현황

### ✅ 재사용 가능한 기존 API
1. `GET /api/main/posts/weekly-trending` - 주간 인기 탭
2. `GET /api/main/posts` - 최신 게시글 탭  
3. `GET /api/main/categories` - 카테고리 그리드
4. `GET /api/communities/active` - 활성 커뮤니티
5. `GET /api/main/stats` - 기본 통계

### ❌ 새로 구현할 API
1. `GET /api/activities/recent` - 실시간 활동 피드 (신규)

### ✅ 기존 API로 대체 가능
2. `GET /api/main/posts?category=qna&sort=commented` - 활발한 Q&A (기존 API 사용)

### ⚠️ 확장 필요한 기존 API  
1. `/api/main/stats` - 일간 조회수, 온라인 사용자 수 추가
   (현재 응답: totalUsers, weeklyPosts, weeklyComments, activeDiscussions)

## 5. 네비게이션 및 라우팅 매핑

### 히어로 섹션 4개 카드 라우팅
```typescript
// 메인 게시글 카드 클릭
href="/main/posts" → 기존 MainPost 목록 페이지

// 자유게시판 카드 클릭  
href="/main/posts?category=free" → MainCategory.slug="free" 필터링

// Q&A 카드 클릭
href="/main/posts?category=qna" → MainCategory.slug="qna" 필터링

// 커뮤니티 카드 클릭
href="/communities" → 기존 Community 목록 페이지
```

### 카테고리 그리드 라우팅
```typescript
// 각 기술 카테고리 카드 클릭
href="/main/posts?category={categorySlug}"
// 예시:
// - 웹 개발: /main/posts?category=web
// - 모바일: /main/posts?category=mobile  
// - AI/ML: /main/posts?category=ai
// - 클라우드: /main/posts?category=cloud
// - 데이터: /main/posts?category=data
// - 보안: /main/posts?category=security
```

### 탭 게시글 섹션 라우팅
```typescript
// "더 많은 게시글 보기" 클릭 시
href="/main/posts" → 전체 게시글 목록

// 개별 게시글 클릭 시  
href="/main/posts/{slug}" → 게시글 상세 페이지
```

### 활성 커뮤니티 섹션 라우팅
```typescript
// "모든 커뮤니티 보기" 클릭
href="/communities" → 커뮤니티 목록 페이지

// 개별 커뮤니티 카드 클릭
href="/communities/{slug}" → 커뮤니티 상세 페이지
```

### 실시간 활동 피드 라우팅
```typescript
// "더 많은 활동 보기" 클릭
href="/activities" → 전체 활동 피드 페이지 (향후 구현)

// 개별 활동 클릭 시 해당 리소스로 이동
// - 게시글 작성 → /main/posts/{slug}
// - 댓글 답변 → /main/posts/{slug}#comment-{id}
// - 커뮤니티 활동 → /communities/{slug}
// - 인기 게시글 → /main/posts/{slug}
```

## 6. 구현 순서 및 우선순위

### 1단계: 컴포넌트 구조 변경 (우선순위: 높음)
1. **HeroSection.tsx 완전 재작성**
   - 4개 기능 카드 2x2 그리드 레이아웃
   - 실시간 활동 피드 우측 배치
   - Neobrutalism 카드 스타일 적용

2. **TabPosts.tsx 신규 컴포넌트 생성**
   - 3개 탭 (주간인기/최신/활발한Q&A) 통합
   - 기존 WeeklyPopularPosts, RecentPosts 로직 재활용
   - Neobrutalism 탭 디자인 적용

3. **app/page.tsx 레이아웃 재구성**
   - HeroSection → CategoryGrid → TabPosts → ActiveCommunities → TodayStats 순서
   - 사이드바 제거하고 풀 위드스 레이아웃 적용

### 2단계: API 구현 (우선순위: 중간)
1. **`/api/activities/recent` 신규 생성**
   - MainPost, MainComment, CommunityPost 활동 통합
   - 실시간 활동 타임라인 생성 로직

2. **기존 API 확장** (선택사항)
   - `/api/main/stats` - 일간 통계 데이터 추가
   (Q&A 활발한 순은 기존 sort=commented로 해결 가능)

### 3단계: 스타일링 및 최적화 (우선순위: 낮음)
1. **Neobrutalism 스타일 시스템 구축**
   - 통일된 카드, 버튼, 탭 스타일
   - hover 효과 및 애니메이션

2. **반응형 디자인 검증**
   - 모바일/태블릿/데스크톱 레이아웃 테스트
   - 성능 최적화 및 로딩 속도 개선

## 7. 기존 자원 활용도 분석

### ✅ 그대로 재사용 (70%)
- **컴포넌트**: WeeklyPopularPosts, RecentPosts, CategoryGrid, ActiveCommunities
- **API**: `/api/main/posts/weekly-trending`, `/api/main/posts`, `/api/main/categories`, `/api/communities/active`, `/api/main/stats`  
- **라우팅**: 모든 기존 페이지 경로 유지
- **데이터 구조**: MainCategory, MainPost, Community 스키마 그대로 활용

### 🔄 수정 필요 (20%)
- **HeroSection.tsx**: 완전 재작성 (4개 카드 + 활동 피드 레이아웃)
- **app/page.tsx**: 레이아웃 순서 및 구조 변경
- **기존 API**: 쿼리 파라미터 확장 (sort=active, count=true 등)

### ❌ 신규 구현 (10%)
- **TabPosts.tsx**: 새로운 탭 통합 컴포넌트
- **`/api/activities/recent`**: 실시간 활동 피드 API
- **TodayStats.tsx**: 통계 표시 컴포넌트 (선택사항)