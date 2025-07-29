# 프로젝트 구조

## 📡 디렉토리 구조

### 🚀 최근 업데이트
- **태그 관리 API 완전 구현**: 태그 CRUD 및 태그별 게시글 조회 API 구현 완료
- **댓글 시스템 완전 개편**: CommentItem 컴포넌트 분리로 한글 입력 포커스 문제 해결
- **관련 게시글 추천 기능**: 태그/카테고리 기반 스코어링 알고리즘으로 개인화된 추천
- **게시글 상세 페이지 완성**: 10개 API 완전 통합, 댓글/답글/좋아요/북마크/추천 시스템
- **Git 훅 및 린트 설정**: Husky + lint-staged로 코드 품질 자동화

```
my_project/
├── app/
│   ├── auth/                      # 인증 페이지
│   │   ├── signin/
│   │   │   └── page.tsx          ✓ 로그인 페이지
│   │   └── signup/               ✗ OAuth만 사용 (미구현)
│   ├── main/                      # 메인 사이트 페이지
│   │   ├── posts/                
│   │   │   └── page.tsx          ✓ 게시글 목록
│   │   ├── posts/[id]/           
│   │   │   └── page.tsx          ✓ 게시글 상세
│   │   ├── write/                
│   │   │   └── page.tsx          ✓ 게시글 작성
│   │   └── tags/[name]/          
│   │       └── page.tsx          ✓ 태그별 게시글
│   ├── profile/[id]/              ✓ 사용자 프로필
│   ├── communities/               # 커뮤니티 페이지
│   │   ├── page.tsx              ✓ 커뮤니티 목록
│   │   └── [id]/                 
│   │       ├── page.tsx          ✓ 커뮤니티 상세
│   │       ├── posts/
│   │       │   ├── page.tsx      ✓ 커뮤니티 게시글 목록
│   │       │   └── [postId]/
│   │       │       └── page.tsx  ✓ 커뮤니티 게시글 상세
│   │       ├── write/
│   │       │   └── page.tsx      ✓ 커뮤니티 게시글 작성
│   │       └── chat/             ✗ 커뮤니티 채팅
│   ├── admin/                     # 관리자 페이지
│   │   ├── page.tsx              ✓ 관리자 대시보드
│   │   ├── pending/
│   │   │   └── page.tsx          ✓ 게시글 승인 관리
│   │   └── test-center/
│   │       └── page.tsx          ✓ 테스트 센터 (데이터 생성)
│   ├── dashboard/
│   │   └── page.tsx              ✓ 대시보드
│   ├── api/
│   │   ├── auth/[...nextauth]/  ✓ NextAuth 라우트
│   │   ├── admin/               # 관리자 API
│   │   │   ├── stats/           ✓ 통계 조회
│   │   │   ├── test-data/       ✓ 테스트 데이터 생성 (15개 엔드포인트)
│   │   │   └── data-viewer/     ✓ 데이터 뷰어 API (8개 테이블 지원)
│   │   ├── users/                # 사용자 API
│   │   │   ├── me/              ✓ 내 정보 조회/수정
│   │   │   ├── [id]/            ✓ 프로필 조회/게시글 목록
│   │   │   ├── bookmarks/       ✓ 북마크 목록
│   │   │   └── stats/           ✓ 활동 통계
│   │   ├── main/                 # 메인 사이트 API
│   │   │   ├── posts/            
│   │   │   │   ├── route.ts      ✓ GET/POST 구현 (목록 조회/생성)
│   │   │   │   ├── search/       
│   │   │   │   │   └── route.ts  ✓ GET 구현 (검색 기능)
│   │   │   │   ├── pending/
│   │   │   │   │   └── route.ts  ✓ GET 구현 (승인 대기 목록)
│   │   │   │   └── [id]/         
│   │   │   │       ├── route.ts  ✓ GET 구현 (상세 조회)
│   │   │   │       ├── approve/
│   │   │   │       │   └── route.ts  ✓ POST 구현 (게시글 승인)
│   │   │   │       ├── like/
│   │   │   │       │   └── route.ts  ✓ POST/GET 구현 (좋아요)
│   │   │   │       ├── bookmark/
│   │   │   │       │   └── route.ts  ✓ POST/GET 구현 (북마크)
│   │   │   │       ├── comments/
│   │   │   │       │   └── route.ts  ✓ GET/POST 구현 (댓글 목록/작성)
│   │   │   │       └── related/
│   │   │   │           └── route.ts  ✓ GET 구현 (관련 게시글 추천)
│   │   │   ├── comments/         
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  ✓ PUT/DELETE 구현 (댓글 수정/삭제)
│   │   │   ├── categories/       ✓ 카테고리 목록
│   │   │   ├── tags/             ✓ 태그 목록
│   │   │   ├── stats/            ✓ 커뮤니티 통계
│   │   │   └── users/
│   │   │       └── active/       ✓ 활발한 사용자 목록
│   │   ├── communities/          # 커뮤니티 API
│   │   │   ├── route.ts          ✓ 목록/생성
│   │   │   └── [id]/             
│   │   │       ├── route.ts      ✓ 상세 조회/수정/삭제
│   │   │       └── members/      
│   │   │           └── route.ts  ✓ 멤버 목록 조회
│   │   ├── community-posts/      # 커뮤니티 게시글 API
│   │   │   └── [id]/             ✗ 상세/수정/삭제/좋아요/북마크
│   │   ├── chat/                 # 채팅 API
│   │   │   └── channels/         ✗ 채널 CRUD/참여/나가기/메시지
│   │   ├── files/                # 파일 API
│   │   │   ├── upload/           
│   │   │   │   └── route.ts      ✓ POST 구현 (파일 업로드)
│   │   │   └── [id]/             ✗ 파일 조회/삭제
│   │   ├── notifications/        # 알림 API
│   │   │   ├── route.ts          ✓ GET 구현 (목록 조회/SSE)
│   │   │   ├── [id]/
│   │   │   │   └── read/
│   │   │   │       └── route.ts  ✓ PUT 구현 (개별 읽음 처리)
│   │   │   └── read-all/
│   │   │       └── route.ts      ✓ PUT 구현 (전체 읽음 처리)
│   │   ├── search/               # 검색 API
│   │   │   └── route.ts          ✓ GET 구현 (통합 검색)
│   │   └── stats/                # 통계 API
│   │       ├── site/             ✗ 사이트 전체 통계
│   │       └── trending/         ✗ 인기 콘텐츠
│   ├── layout.tsx                ✓ 루트 레이아웃
│   └── page.tsx                  ✓ 메인 페이지
├── components/
│   ├── ui/                  # shadcn/ui 기본 컴포넌트
│   │   ├── button.tsx       ✓ 버튼 컴포넌트
│   │   ├── card.tsx         ✓ 카드 컨테이너
│   │   ├── badge.tsx        ✓ 뱃지/태그
│   │   ├── avatar.tsx       ✓ 사용자 아바타
│   │   ├── skeleton.tsx     ✓ 로딩 스켈레톤
│   │   ├── separator.tsx    ✓ 구분선
│   │   ├── dialog.tsx       ✓ 모달 다이얼로그
│   │   ├── dropdown-menu.tsx ✓ 드롭다운 메뉴
│   │   ├── sonner.tsx       ✓ 토스트 알림 (Sonner)
│   │   ├── input.tsx        ✓ 입력 필드
│   │   ├── textarea.tsx     ✓ 텍스트 영역
│   │   ├── select.tsx       ✓ 선택 드롭다운
│   │   ├── tabs.tsx         ✓ 탭 컴포넌트
│   │   ├── table.tsx        ✓ 테이블 컴포넌트 (데이터 뷰어용)
│   │   ├── slider.tsx       ✓ 슬라이더 컴포넌트
│   │   ├── radio-group.tsx  ✓ 라디오 그룹 컴포넌트
│   │   └── scroll-area.tsx  ✓ 스크롤 영역 컴포넌트
│   ├── shared/              # 공통 컴포넌트
│   │   ├── CommentList.tsx  ✗ 댓글 목록
│   │   ├── CommentItem.tsx  ✗ 댓글 아이템
│   │   ├── UserAvatar.tsx   ✗ 사용자 아바타 (DiceBear)
│   │   ├── AuthorInfo.tsx   ✗ 작성자 정보
│   │   ├── PostStats.tsx    ✗ 게시글 통계 (조회/좋아요/댓글)
│   │   ├── LikeButton.tsx   ✗ 좋아요 버튼
│   │   ├── BookmarkButton.tsx ✗ 북마크 버튼
│   │   ├── ShareButton.tsx  ✗ 공유 버튼
│   │   ├── TagList.tsx      ✗ 태그 목록
│   │   ├── CategoryBadge.tsx ✗ 카테고리 뱃지
│   │   ├── SearchBar.tsx    ✗ 검색바
│   │   ├── Pagination.tsx   ✗ 페이지네이션
│   │   ├── InfiniteScrollList.tsx ✗ 무한 스크롤
│   │   ├── EmptyState.tsx   ✗ 빈 상태 표시
│   │   ├── ErrorMessage.tsx ✗ 에러 메시지
│   │   ├── LoadingSpinner.tsx ✗ 로딩 스피너
│   │   └── SEO.tsx          ✗ SEO 메타 태그
│   ├── layouts/             # 레이아웃 컴포넌트
│   │   ├── MainLayout.tsx   ✓ 메인 레이아웃
│   │   ├── Header.tsx       ✓ 헤더 네비게이션 (관리자 메뉴 포함)
│   │   ├── Footer.tsx       ✗ 푸터
│   │   ├── Sidebar.tsx      ✗ 사이드바 (레이아웃용)
│   │   ├── MobileNav.tsx    ✗ 모바일 네비게이션
│   │   └── NavLink.tsx      ✗ 네비게이션 링크
│   ├── home/                # 메인 페이지 컴포넌트 (4개 구현)
│   │   ├── HeroSection.tsx  ✓ 히어로 섹션
│   │   ├── PostList.tsx     ✓ 게시글 목록
│   │   ├── Sidebar.tsx      ✓ 사이드바
│   │   └── SidebarContainer.tsx ✓ 사이드바 컨테이너
│   ├── posts/               # 게시글 관련 (6개 구현)
│   │   ├── PostCard.tsx     ✓ 게시글 카드
│   │   ├── index.ts         ✓ 내보내기 파일
│   │   ├── PostDetail.tsx   ✓ 게시글 상세
│   │   ├── CommentSection.tsx ✓ 댓글 섹션
│   │   ├── PostListServer.tsx ✓ 게시글 목록 서버 컴포넌트
│   │   ├── PostEditor.tsx   ✓ 게시글 에디터
│   │   ├── CommentItem.tsx  ✓ 댓글 아이템 (분리된 컴포넌트)
│   │   └── RelatedPosts.tsx ✓ 관련 게시글 추천
│   ├── communities/         # 커뮤니티 관련 (7개 구현)
│   │   ├── CommunityActions.tsx ✓ 커뮤니티 액션 버튼
│   │   ├── CommunityAnnouncements.tsx ✓ 커뮤니티 공지사항
│   │   ├── CommunityCommentSection.tsx ✓ 커뮤니티 댓글 섹션
│   │   ├── CommunityMemberList.tsx ✓ 커뮤니티 멤버 목록
│   │   ├── CommunityPostDetail.tsx ✓ 커뮤니티 게시글 상세
│   │   ├── CommunityPostEditor.tsx ✓ 커뮤니티 게시글 에디터
│   │   └── CommunityPostList.tsx ✓ 커뮤니티 게시글 목록
│   ├── auth/                # 인증 관련 (미구현 - NextAuth 사용)
│   ├── search/              # 검색 관련
│   │   ├── SearchModal.tsx  ✓ 검색 모달
│   │   └── index.ts         ✓ 내보내기 파일
│   ├── providers/           # Provider 컴포넌트
│   │   └── SessionProvider.tsx ✓ NextAuth 세션 프로바이더
│   └── admin/               # 관리자 관련
│       ├── PendingPostsManager.tsx ✓ 게시글 승인 관리
│       ├── TestActionCard.tsx ✓ 테스트 액션 카드
│       ├── TestCenterContent.tsx ✓ 테스트 센터 콘텐츠
│       ├── TestActionModal.tsx ✓ 테스트 액션 모달 (매개변수 입력)
│       ├── TestResultsPanel.tsx ✓ 테스트 결과 패널 (실시간 확인)
│       └── DataTableViewer.tsx ✓ 데이터 테이블 뷰어 (Prisma Studio 스타일)
├── lib/
│   ├── prisma.ts            ✓ Prisma 클라이언트
│   ├── utils.ts             ✓ 유틸리티
│   ├── types.ts             ✓ 타입 정의 파일
│   ├── api.ts               ✓ API 유틸리티
│   ├── notifications.ts     ✓ 알림 헬퍼 함수
│   └── auth-helpers.ts      ✓ 인증/권한 헬퍼 함수 (Stage 1 완료)
├── hooks/
│   ├── use-toast.tsx        ✓ 토스트 훅
│   └── use-debounce.ts      ✓ 디바운스 훅
├── prisma/
│   ├── schema.prisma        ✓ 데이터베이스 스키마
│   └── seed.ts              ✓ 시드 데이터
├── auth.ts                  ✓ NextAuth 설정
└── package.json             ✓ 프로젝트 설정
```

## 🎯 API 라우트 매핑

### 📊 전체 현황
- **API**: 94개 중 91개 구현 (96.8%)
- **페이지**: 18개 중 17개 구현 (94.4%)
- **컴포넌트**: 83개 중 69개 구현 (83.1%)
- **전체**: 195개 중 177개 구현 (90.8%)

### 🆕 관리자 API (24개) - ✅ 100% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/admin/stats` | GET | 관리자 통계 조회 | ✅ |
| `/api/admin/test-data/users` | POST | 테스트 사용자 생성 (커스터마이징) | ✅ |
| `/api/admin/test-data/admin-user` | POST | 관리자 계정 생성 (상세 입력) | ✅ |
| `/api/admin/test-data/main-posts` | POST | 메인 게시글 생성 (상태 선택) | ✅ |
| `/api/admin/test-data/main-comments` | POST | 메인 댓글 생성 (게시글/내용 선택) | ✅ |
| `/api/admin/test-data/communities` | POST | 테스트 커뮤니티 생성 | ✅ |
| `/api/admin/test-data/community-posts` | POST | 커뮤니티 게시글 생성 | ✅ |
| `/api/admin/test-data/community-members` | POST | 커뮤니티 멤버 추가 | ✅ |
| `/api/admin/test-data/likes` | POST | 좋아요 생성 (특정 게시글 선택) | ✅ |
| `/api/admin/test-data/bookmarks` | POST | 북마크 생성 (특정 게시글 선택) | ✅ |
| `/api/admin/test-data/tags` | POST | 태그 생성 | ✅ |
| `/api/admin/test-data/reset` | DELETE | 모든 테스트 데이터 삭제 | ✅ |
| `/api/admin/test-data/seed` | POST | 기본 시드 데이터 재생성 | ✅ |
| `/api/admin/data-viewer/users` | GET | 사용자 테이블 조회 | ✅ |
| `/api/admin/data-viewer/mainPosts` | GET | 메인 게시글 테이블 조회 | ✅ |
| `/api/admin/data-viewer/mainComments` | GET | 메인 댓글 테이블 조회 | ✅ |
| `/api/admin/data-viewer/communities` | GET | 커뮤니티 테이블 조회 | ✅ |
| `/api/admin/data-viewer/communityPosts` | GET | 커뮤니티 게시글 테이블 조회 | ✅ |
| `/api/admin/data-viewer/mainLikes` | GET | 좋아요 테이블 조회 | ✅ |
| `/api/admin/data-viewer/mainBookmarks` | GET | 북마크 테이블 조회 | ✅ |
| `/api/admin/data-viewer/mainTags` | GET | 태그 테이블 조회 | ✅ |

### 1️⃣ 인증 & 사용자 API (8개) - ✅ 100% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/auth/[...nextauth]` | * | NextAuth 핸들러 | ✅ |
| `/api/users/me` | GET | 내 정보 조회 | ✅ |
| `/api/users/me` | PUT | 내 정보 수정 | ✅ |
| `/api/users/[id]` | GET | 사용자 프로필 조회 | ✅ |
| `/api/users/[id]/posts` | GET | 사용자 게시글 목록 | ✅ |
| `/api/users/[id]/communities` | GET | 사용자 가입 커뮤니티 | ✅ |
| `/api/users/bookmarks` | GET | 내 북마크 목록 | ✅ |
| `/api/users/stats` | GET | 내 활동 통계 | ✅ |

### 2️⃣ 메인 사이트 API (23개) - ✅ 100% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/main/posts` | GET | 게시글 목록 조회 | ✅ |
| `/api/main/posts` | POST | 게시글 작성 | ✅ |
| `/api/main/posts/[id]` | GET | 게시글 상세 조회 | ✅ |
| `/api/main/posts/[id]` | PUT | 게시글 수정 | ✅ |
| `/api/main/posts/[id]` | DELETE | 게시글 삭제 | ✅ |
| `/api/main/posts/[id]/approve` | POST | 게시글 승인/거부 (알림 포함) | ✅ |
| `/api/main/posts/[id]/reject` | POST | 게시글 거부 (매니저) | ❌ |
| `/api/main/posts/[id]/like` | POST/GET | 좋아요 토글/상태 | ✅ |
| `/api/main/posts/[id]/bookmark` | POST/GET | 북마크 토글/상태 | ✅ |
| `/api/main/posts/[id]/comments` | GET | 댓글 목록 조회 | ✅ |
| `/api/main/posts/[id]/comments` | POST | 댓글 작성 | ✅ |
| `/api/main/comments/[id]` | PUT | 댓글 수정 | ✅ |
| `/api/main/comments/[id]` | DELETE | 댓글 삭제 | ✅ |
| `/api/main/categories` | GET | 카테고리 목록 | ✅ |
| `/api/main/tags` | GET | 태그 목록 | ✅ |
| `/api/main/tags` | POST | 태그 생성 | ✅ |
| `/api/main/tags/[id]` | PUT | 태그 수정 | ✅ |
| `/api/main/tags/[id]` | DELETE | 태그 삭제 | ✅ |
| `/api/main/tags/[id]/posts` | GET | 태그별 게시글 | ✅ |
| `/api/main/posts/search` | GET | 게시글 검색 | ✅ |
| `/api/main/posts/pending` | GET | 승인 대기 게시글 목록 | ✅ |
| `/api/main/posts/[id]/related` | GET | 관련 게시글 추천 | ✅ |
| `/api/main/stats` | GET | 커뮤니티 통계 | ✅ |
| `/api/main/users/active` | GET | 활발한 사용자 | ✅ |

### 3️⃣ 커뮤니티 API (26개) - ✅ 69.2% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/communities` | GET | 커뮤니티 목록 조회 | ✅ |
| `/api/communities` | POST | 커뮤니티 생성 | ✅ |
| `/api/communities/[id]` | GET | 커뮤니티 상세 조회 | ✅ |
| `/api/communities/[id]` | PUT | 커뮤니티 수정 | ✅ |
| `/api/communities/[id]` | DELETE | 커뮤니티 삭제 | ✅ |
| `/api/communities/[id]/join` | POST/DELETE | 커뮤니티 가입/탈퇴 | ✅ |
| `/api/communities/[id]/members` | GET | 멤버 목록 | ✅ |
| `/api/communities/[id]/members/approve` | POST | 멤버 가입 승인 | ✅ |
| `/api/communities/[id]/members/[userId]` | PUT | 멤버 역할 변경 | ✅ |
| `/api/communities/[id]/members/[userId]` | DELETE | 멤버 추방 | ✅ |
| `/api/communities/[id]/members/[userId]/ban` | POST/DELETE | 멤버 밴/언밴 | ✅ |
| `/api/communities/[id]/categories` | GET | 카테고리 목록 | ❌ |
| `/api/communities/[id]/categories` | POST | 카테고리 생성 | ❌ |
| `/api/communities/[id]/announcements` | GET | 공지사항 목록 | ❌ |
| `/api/communities/[id]/announcements` | POST | 공지사항 작성 | ❌ |
| `/api/communities/[id]/posts` | GET | 게시글 목록 | ✅ |
| `/api/communities/[id]/posts` | POST | 게시글 작성 | ✅ |
| `/api/communities/[id]/posts/[postId]` | GET | 게시글 상세 | ✅ |
| `/api/communities/[id]/posts/[postId]` | PUT | 게시글 수정 | ❌ |
| `/api/communities/[id]/posts/[postId]` | DELETE | 게시글 삭제 | ✅ |
| `/api/communities/[id]/posts/[postId]/like` | POST/DELETE | 좋아요 토글 | ✅ |
| `/api/communities/[id]/posts/[postId]/bookmark` | POST/DELETE | 북마크 토글 | ✅ |
| `/api/communities/[id]/posts/[postId]/comments` | GET | 댓글 목록 | ✅ |
| `/api/communities/[id]/posts/[postId]/comments` | POST | 댓글 작성 | ✅ |
| `/api/communities/[id]/posts/[postId]/comments/[commentId]` | PUT | 댓글 수정 | ❌ |
| `/api/communities/[id]/posts/[postId]/comments/[commentId]` | DELETE | 댓글 삭제 | ❌ |

### 4️⃣ 채팅 API (8개) - ❌ 0% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/communities/[id]/channels` | GET | 채널 목록 조회 | ❌ |
| `/api/communities/[id]/channels` | POST | 채널 생성 | ❌ |
| `/api/chat/channels/[id]` | PUT | 채널 수정 | ❌ |
| `/api/chat/channels/[id]` | DELETE | 채널 삭제 | ❌ |
| `/api/chat/channels/[id]/join` | POST | 채널 참여 | ❌ |
| `/api/chat/channels/[id]/leave` | DELETE | 채널 나가기 | ❌ |
| `/api/chat/channels/[id]/messages` | GET | 메시지 조회 | ❌ |
| `/api/chat/channels/[id]/messages` | POST | 메시지 전송 | ❌ |

### 5️⃣ 파일 API (3개) - ✅ 33.3% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/files/upload` | POST | 파일 업로드 | ✅ |
| `/api/files/[id]` | GET | 파일 정보 조회 | ❌ |
| `/api/files/[id]` | DELETE | 파일 삭제 | ❌ |

### 6️⃣ 알림 API (3개) - ✅ 100% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/notifications` | GET | 알림 목록 조회 | ✅ |
| `/api/notifications/[id]/read` | PUT | 알림 읽음 처리 | ✅ |
| `/api/notifications/read-all` | PUT | 모든 알림 읽음 처리 | ✅ |

### 7️⃣ 검색 API (3개) - ✅ 33.3% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/search` | GET | 통합 검색 | ✅ |
| `/api/search/communities` | GET | 커뮤니티 검색 | ❌ |
| `/api/search/users` | GET | 사용자 검색 | ❌ |

### 8️⃣ 통계 API (2개) - ❌ 0% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/stats/site` | GET | 사이트 전체 통계 | ❌ |
| `/api/stats/trending` | GET | 인기 콘텐츠 | ❌ |

### 9️⃣ 기타 (4개) - ✅ 100% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/prisma/schema.prisma` | - | DB 스키마 정의 | ✅ |
| `/prisma/seed.ts` | - | 시드 데이터 | ✅ |
| `/auth.ts` | - | NextAuth 설정 | ✅ |
| `/lib/prisma.ts` | - | Prisma 클라이언트 | ✅ |

## 🔐 권한 시스템 구현 현황 (Stage 1 완료)

### Stage 1: 기본 권한 체크 - ✅ 100% 완료
- **전역 Ban 체크**: 모든 API에 자동 적용
- **인증 체크**: 로그인 필수 API 보호
- **GlobalRole.ADMIN 슈퍼 권한**: 모든 커뮤니티에서 ADMIN 권한 자동 부여 + 커뮤니티 삭제 권한

### Stage 2: 커뮤니티 권한 적용 - ✅ 100% 완료
- **커뮤니티 멤버십 체크**: 모든 커뮤니티 API에 적용
- **커뮤니티 Ban 체크**: checkMembership()에 통합
- **역할 기반 권한**: OWNER > ADMIN > MODERATOR > MEMBER 계층 구조
- **18개 커뮤니티 API 엔드포인트에 권한 시스템 적용 완료**

### 구현된 헬퍼 함수
| 함수명 | 설명 | 상태 |
|--------|------|------|
| `checkAuth()` | 인증 확인 | ✅ |
| `checkGlobalRole()` | 전역 역할 확인 | ✅ |
| `checkCommunityRole()` | 커뮤니티 역할 확인 | ✅ |
| `checkPermission()` | 통합 권한 체크 | ✅ |
| `checkMembership()` | 커뮤니티 멤버십 확인 | ✅ |
| `checkCommunityBan()` | 커뮤니티 Ban 확인 | ✅ |
| `canManageCommunity()` | 커뮤니티 관리 권한 확인 | ✅ |

### 권한 적용 현황
- **전역 Ban**: 모든 API에 미들웨어로 자동 적용 ✅
- **커뮤니티 Ban**: 커뮤니티 관련 API에 적용 완료 (Stage 2) ✅
- **리소스 소유권**: 게시글/댓글 수정/삭제 시 확인 필요 (Stage 4) ⏳

## 📄 페이지 구현 현황

### 📊 페이지 현황: 총 18개
- ✅ 구현 완료: 17개 (94.4%)
- ❌ 미구현: 1개 (5.6%)

### 페이지 목록
| 경로 | 설명 | 레이아웃 | 상태 |
|------|------|----------|------|
| `/` | 메인 페이지 | 루트 | ✅ |
| `/auth/signin` | 로그인 페이지 | 루트 | ✅ | (OAUTH 단일사용 회원가입 페이지 X)
| `/dashboard` | 사용자 대시보드 | 루트 | ✅ |
| `/profile/[id]` | 사용자 프로필 | 루트 | ✅ |
| `/main/posts` | 게시글 목록 | 루트 | ✅ |
| `/main/posts/[id]` | 게시글 상세 | 루트 | ✅ |
| `/main/write` | 게시글 작성 | 루트 | ✅ |
| `/main/tags/[name]` | 태그별 게시글 | 루트 | ✅ |
| `/admin` | 관리자 대시보드 | 루트 | ✅ |
| `/admin/pending` | 게시글 승인 관리 | 루트 | ✅ |
| `/admin/test-center` | 테스트 데이터 생성 센터 | 루트 | ✅ |
| `/admin/users` | 사용자 관리 | 루트 | ❌ |
| `/communities` | 커뮤니티 목록 | 루트 | ✅ |
| `/communities/[id]` | 커뮤니티 상세 | 루트 | ✅ |
| `/search` | 검색 모달 (Header 통합) | - | ✅ |

## 🧩 컴포넌트 구현 현황

### 📊 컴포넌트 현황: 총 81개
- ✅ 구현 완료: 67개 (82.7%)
- ❌ 미구현: 14개 (17.3%)

### 카테고리별 현황
| 카테고리 | 전체 | 구현 | 구현율 |
|----------|------|------|---------|
| UI (shadcn) | 18개 | 18개 | 100% |
| Layouts | 6개 | 2개 | 33.3% |
| Home | 4개 | 4개 | 100% |
| Posts | 6개 | 6개 | 100% |
| Communities | 7개 | 7개 | 100% |
| Search | 2개 | 2개 | 100% |
| Providers | 1개 | 1개 | 100% |
| Admin | 6개 | 6개 | 100% |
| Hooks | 2개 | 2개 | 100% |
| Auth | 0개 | 0개 | - (NextAuth 사용) |
| Shared | 18개 | 6개 | 33.3% |
| Others | 11개 | 11개 | 100% |

## 📊 프로젝트 전체 현황 요약

### 핵심 지표
- **페이지**: 18개 중 17개 구현 (94.4% 완성)
- **API**: 94개 중 91개 구현 (96.8% 완성)
- **컴포넌트**: 83개 중 69개 구현 (83.1% 완성)

### 최근 완료된 주요 작업
- ✅ **태그 관리 시스템 구현**: 태그 CRUD API (POST/PUT/DELETE) 및 태그별 게시글 조회 API 완성
- ✅ **댓글 시스템 완전 리팩토링**: CommentItem 분리로 React 상태 관리 최적화, 한글 입력 포커스 이슈 해결
- ✅ **관련 게시글 추천 시스템**: 태그/카테고리 매칭 + 인기도 + 최신도 기반 스코어링 알고리즘 구현
- ✅ **게시글 상세 페이지 API 통합**: 10개 API 완전 연동으로 댓글, 좋아요, 북마크, 추천 기능 완성
- ✅ **코드 품질 자동화**: Husky + lint-staged + Prettier + ESLint 설정으로 Git 커밋 시 자동 포맷팅

### 다음 우선 순위
- ❌ 채팅 시스템 (8개 API, 관련 컴포넌트)
- ❌ 파일 관리 API (2개 미구현)
- ❌ 레이아웃 컴포넌트 완성 (4개 미구현)
- ❌ 통계 및 트렌딩 시스템 (2개 API)

