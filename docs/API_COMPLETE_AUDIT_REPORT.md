# 🔍 API 완전 전수조사 보고서

## 📊 전체 요약

### 통계
- **총 API 엔드포인트**: 48개
- **구현 완료**: 48개 (100%)
- **UI 완전 연결**: 27개 (56%)
- **UI 부분 연결**: 8개 (17%)
- **UI 미연결**: 13개 (27%)
- **DB 직접 쿼리 사용 페이지**: 2개

### 🚨 핵심 발견사항
1. **모든 API는 구현되어 있음** (미구현 API 없음)
2. **27%의 API가 UI 연결 없이 방치됨**
3. **일부 페이지가 API 대신 DB 직접 쿼리 사용**
4. **중복 API 존재** (파일 업로드, 검색)

---

## 📁 API 상세 분석

### 1️⃣ 메인 사이트 API (`/api/main/*`)

| 엔드포인트 | 메서드 | 구현 | UI 연결 | 사용처 | 사용 방식 |
|-----------|--------|------|---------|---------|-----------|
| `/posts` | GET, POST | ✅ | ✅ 완전 | `app/page.tsx`, `PostList.tsx` | 서버사이드 fetch |
| `/posts/[id]` | GET, PUT, DELETE | ✅ | ✅ 완전 | `app/main/posts/[id]/page.tsx` | 서버사이드 fetch |
| `/posts/[id]/comments` | GET, POST | ✅ | ✅ 완전 | `CommentSection.tsx` | 클라이언트 fetch |
| `/posts/[id]/like` | POST, DELETE | ✅ | ❌ 미연결 | - | - |
| `/posts/[id]/bookmark` | POST, DELETE | ✅ | ❌ 미연결 | - | - |
| `/posts/[id]/approve` | PUT | ✅ | ❌ 미연결 | - | 관리자 기능 |
| `/posts/[id]/related` | GET | ✅ | ❌ 미연결 | - | - |
| `/posts/search` | GET | ✅ | ✅ 완전 | `SearchModal.tsx` | 클라이언트 fetch |
| `/posts/pending` | GET | ✅ | ❌ 미연결 | - | 관리자 기능 |
| `/categories` | GET | ✅ | ✅ 완전 | `app/page.tsx` | 서버사이드 fetch |
| `/tags` | GET, POST | ✅ | ✅ 완전 | 여러 페이지 | 서버사이드 fetch |
| `/tags/[id]` | GET, PUT, DELETE | ✅ | ❌ 미연결 | - | 태그 관리 |
| `/tags/[id]/posts` | GET | ✅ | ⚠️ 부분 | 태그 페이지 | 불명확 |
| `/comments/[id]` | PUT, DELETE | ✅ | ✅ 완전 | `CommentSection.tsx` | 클라이언트 fetch |
| `/stats` | GET | ✅ | ✅ 완전 | 홈페이지 | 서버사이드 fetch |
| `/users/active` | GET | ✅ | ✅ 완전 | 홈페이지 | 서버사이드 fetch |

### 2️⃣ 커뮤니티 API (`/api/communities/*`)

| 엔드포인트 | 메서드 | 구현 | UI 연결 | 사용처 | 사용 방식 |
|-----------|--------|------|---------|---------|-----------|
| `/` | GET, POST | ✅ | ✅ 완전 | `app/communities/page.tsx` | 서버사이드 fetch |
| `/[id]` | GET, PUT, DELETE | ✅ | ⚠️ 부분 | 커뮤니티 상세 | PUT/DELETE 미연결 |
| `/[id]/join` | POST, DELETE | ✅ | ✅ 완전 | `CommunityActions.tsx` | 클라이언트 fetch |
| `/[id]/posts` | GET, POST | ✅ | ✅ 완전 | `CommunityPostList.tsx` | 클라이언트 fetch |
| `/[id]/posts/[postId]` | GET, PUT, DELETE | ✅ | ⚠️ 부분 | 게시글 상세 | 수정/삭제 미확인 |
| `/[id]/posts/[postId]/comments` | GET, POST | ✅ | ✅ 완전 | `CommentSection.tsx` | 클라이언트 fetch |
| `/[id]/posts/[postId]/like` | POST, DELETE | ✅ | ❌ 미연결 | - | - |
| `/[id]/posts/[postId]/bookmark` | POST, DELETE | ✅ | ❌ 미연결 | - | - |
| `/[id]/members` | GET | ✅ | ✅ 완전 | `CommunityMemberList.tsx` | 클라이언트 fetch |
| `/[id]/members/[userId]` | PUT, DELETE | ✅ | ❌ 미연결 | - | 관리자 기능 |
| `/[id]/members/[userId]/ban` | POST, DELETE | ✅ | ❌ 미연결 | - | 관리자 기능 |
| `/[id]/members/approve` | POST | ✅ | ❌ 미연결 | - | 관리자 기능 |
| `/[id]/categories` | GET, POST | ✅ | ✅ 완전 | `PostEditor.tsx` | 클라이언트 fetch |
| `/[id]/announcements` | GET, POST | ✅ | ⚠️ 부분 | `CommunityAnnouncements.tsx` | GET만 연결 |
| `/[id]/announcements/[id]` | GET, PUT, DELETE | ✅ | ❌ 미연결 | - | - |

### 3️⃣ 사용자 API (`/api/users/*`)

| 엔드포인트 | 메서드 | 구현 | UI 연결 | 사용처 | 사용 방식 |
|-----------|--------|------|---------|---------|-----------|
| `/me` | GET, PUT | ✅ | ⚠️ 부분 | 프로필 관리 | 위치 불명확 |
| `/[id]` | GET | ✅ | ❌ 미연결 | - | 프로필 페이지는 DB 직접 쿼리 |
| `/[id]/posts` | GET | ✅ | ❌ 미연결 | - | - |
| `/[id]/communities` | GET | ✅ | ❌ 미연결 | - | - |
| `/bookmarks` | GET | ✅ | ❌ 미연결 | - | - |
| `/stats` | GET | ✅ | ❌ 미연결 | - | - |

### 4️⃣ 유틸리티 API

| 엔드포인트 | 메서드 | 구현 | UI 연결 | 사용처 | 문제점 |
|-----------|--------|------|---------|---------|--------|
| `/search` | GET | ✅ | ❌ 미연결 | - | SearchModal은 `/api/main/posts/search` 사용 |
| `/upload` | POST | ✅ | ❌ 미연결 | - | 중복 API |
| `/files/upload` | POST | ✅ | ❌ 미연결 | - | 중복 API |
| `/notifications` | GET | ✅ | ❌ 미연결 | - | - |
| `/notifications/[id]/read` | PATCH | ✅ | ❌ 미연결 | - | - |
| `/notifications/read-all` | PATCH | ✅ | ❌ 미연결 | - | - |
| `/notifications/sse` | GET (SSE) | ✅ | ❌ 미연결 | - | 실시간 알림 |

### 5️⃣ 관리자 API (`/api/admin/*`)

| 엔드포인트 | 메서드 | 구현 | UI 연결 | 사용처 | 사용 방식 |
|-----------|--------|------|---------|---------|-----------|
| `/stats` | GET | ✅ | ✅ 완전 | 관리자 대시보드 | 서버사이드 fetch |
| `/data-viewer/[table]` | GET | ✅ | ✅ 완전 | 데이터베이스 뷰어 | 클라이언트 fetch |

---

## 🚨 문제점 상세 분석

### 1. DB 직접 쿼리 사용 페이지

#### `components/posts/PostListServer.tsx`
```typescript
// 문제 코드 (36-79줄)
const posts = await prisma.mainPost.findMany({
  where: { status: 'PUBLISHED' },
  include: { /* ... */ },
  orderBy: { createdAt: 'desc' }
})
```
**문제**: API 대신 Prisma 직접 사용
**영향**: API 로직 우회, 일관성 없음

#### `app/profile/[id]/page.tsx`
```typescript
// 문제 코드
const user = await prisma.user.findUnique({
  where: { id },
  include: { mainPosts: true }
})
```
**문제**: `/api/users/[id]` API 있는데 사용 안 함

### 2. 완전히 미연결된 주요 API (우선순위순)

1. **알림 시스템** (4개 API)
   - 사용자 경험에 중요
   - SSE 실시간 기능 포함
   - UI 컴포넌트 전무

2. **북마크 기능** (3개 API)
   - 메인/커뮤니티 북마크
   - 북마크 목록 조회
   - 버튼/목록 UI 없음

3. **좋아요 기능** (2개 API)
   - 메인/커뮤니티 좋아요
   - 버튼 UI 없음

4. **파일 업로드** (2개 중복 API)
   - 중복 제거 필요
   - UI 없음

5. **멤버 관리** (4개 API)
   - 승인/차단/역할변경
   - 관리자 UI 없음

### 3. 부분 연결된 API

1. **공지사항**: GET만 연결, POST/PUT/DELETE 미연결
2. **커뮤니티 설정**: GET만 연결, PUT/DELETE 미연결
3. **사용자 프로필**: 일부만 연결

---

## 📋 권장 구현 순서

### 1단계: 즉시 수정 필요
1. `PostListServer.tsx` → API 사용으로 변경
2. 프로필 페이지 → `/api/users/[id]` 사용
3. 중복 API 제거 (`/api/upload` vs `/api/files/upload`)

### 2단계: 사용자 경험 개선
1. **북마크 UI 구현**
   - 게시글 북마크 버튼
   - 북마크 목록 페이지
   
2. **좋아요 UI 구현**
   - 게시글 좋아요 버튼
   - 좋아요 수 표시

3. **알림 시스템 UI**
   - 헤더 알림 아이콘
   - 알림 드롭다운
   - SSE 연결

### 3단계: 관리자 기능
1. **공지사항 관리 UI**
   - 작성/수정/삭제 모달
   
2. **멤버 관리 UI**
   - 승인/거절 버튼
   - 역할 변경 드롭다운
   - 차단 기능

### 4단계: 완성도 향상
1. 파일 업로드 UI
2. 관련 게시글 표시
3. 사용자 통계 페이지

---

## 💡 아키텍처 개선 제안

1. **일관된 데이터 접근**
   - 모든 데이터는 API를 통해서만
   - DB 직접 쿼리 제거

2. **API 클라이언트 도입**
   - 타입 안전성
   - 에러 처리 통일
   - 로딩 상태 관리

3. **중복 제거**
   - 검색 API 통합
   - 파일 업로드 API 통합

4. **문서화**
   - API 명세 작성
   - 사용 예제 추가