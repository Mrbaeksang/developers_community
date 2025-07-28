# 프로젝트 구조

## 📡 디렉토리 구조

```
my_project/
├── app/
│   ├── (auth)/                    # 인증 레이아웃
│   │   ├── signin/
│   │   │   └── page.tsx          ✓ 로그인 페이지
│   │   └── signup/               ✗ 회원가입 페이지
│   ├── (main)/                    # 메인 사이트 레이아웃
│   │   ├── posts/                
│   │   │   └── page.tsx          ✓ 게시글 목록 (리다이렉트)
│   │   ├── posts/[id]/           
│   │   │   └── page.tsx          ✓ 게시글 상세
│   │   ├── write/                ✗ 게시글 작성
│   │   ├── profile/[id]/         ✗ 사용자 프로필
│   │   └── search/               ✗ 검색 결과
│   ├── (community)/               # 커뮤니티 레이아웃
│   │   ├── page.tsx              ✗ 커뮤니티 목록
│   │   ├── [id]/                 ✗ 커뮤니티 상세
│   │   └── [id]/chat/            ✗ 커뮤니티 채팅
│   ├── dashboard/
│   │   └── page.tsx              ✓ 대시보드
│   ├── api/
│   │   ├── auth/[...nextauth]/  ✓ NextAuth 라우트
│   │   ├── users/                # 사용자 API
│   │   │   ├── me/              ✗ 내 정보 조회/수정
│   │   │   ├── [id]/            ✗ 프로필/게시글/커뮤니티
│   │   │   ├── bookmarks/       ✗ 북마크 목록
│   │   │   └── stats/           ✗ 활동 통계
│   │   ├── main/                 # 메인 사이트 API
│   │   │   ├── posts/            
│   │   │   │   ├── route.ts      ✓ GET 구현 (목록 조회)
│   │   │   │   └── [id]/         
│   │   │   │       ├── route.ts  ✓ GET 구현 (상세 조회)
│   │   │   │       ├── like/
│   │   │   │       │   └── route.ts  ✓ POST/GET 구현 (좋아요)
│   │   │   │       └── bookmark/
│   │   │   │           └── route.ts  ✓ POST/GET 구현 (북마크)
│   │   │   ├── comments/         ✗ 댓글 CRUD
│   │   │   ├── categories/       ✓ 카테고리 목록
│   │   │   └── tags/             ✓ 태그 목록
│   │   ├── communities/          # 커뮤니티 API
│   │   │   ├── route.ts          ✗ 목록/생성
│   │   │   └── [id]/             ✗ 상세/수정/삭제/가입/탈퇴/멤버/카테고리/공지/게시글
│   │   ├── community-posts/      # 커뮤니티 게시글 API
│   │   │   └── [id]/             ✗ 상세/수정/삭제/좋아요/북마크
│   │   ├── chat/                 # 채팅 API
│   │   │   └── channels/         ✗ 채널 CRUD/참여/나가기/메시지
│   │   ├── files/                # 파일 API
│   │   │   ├── upload/           ✗ 파일 업로드
│   │   │   └── [id]/             ✗ 파일 조회/삭제
│   │   ├── notifications/        # 알림 API
│   │   │   └── route.ts          ✗ 목록/읽음처리
│   │   ├── search/               # 검색 API
│   │   │   └── route.ts          ✗ 통합/게시글/커뮤니티/사용자
│   │   └── stats/                ✓ 통계 API
│   │       └── route.ts          ✗ 사이트/트렌딩
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
│   │   └── tabs.tsx         ✓ 탭 컴포넌트
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
│   │   ├── Header.tsx       ✓ 헤더 네비게이션
│   │   ├── Footer.tsx       ✗ 푸터
│   │   ├── Sidebar.tsx      ✗ 사이드바 (레이아웃용)
│   │   ├── MobileNav.tsx    ✗ 모바일 네비게이션
│   │   └── NavLink.tsx      ✗ 네비게이션 링크
│   ├── home/                # 메인 페이지 컴포넌트
│   │   ├── HeroSection.tsx  ✓ 히어로 섹션
│   │   ├── PostList.tsx     ✓ 게시글 목록
│   │   ├── Sidebar.tsx      ✓ 사이드바
│   │   ├── FeaturedContent.tsx ✗ 주요 콘텐츠 그리드
│   │   ├── CommunityShowcase.tsx ✗ 커뮤니티 쇼케이스
│   │   ├── RecentQA.tsx     ✗ 최신 Q&A
│   │   ├── StatsSection.tsx ✗ 통계 섹션
│   │   ├── FooterCTA.tsx    ✗ 하단 CTA
│   │   ├── TypeWriter.tsx   ✗ 타이핑 애니메이션
│   │   └── ParticleBackground.tsx ✗ 파티클 배경
│   ├── posts/               # 게시글 관련
│   │   ├── PostCard.tsx     ✓ 게시글 카드
│   │   ├── index.ts         ✓ 내보내기 파일
│   │   ├── PostDetail.tsx   ✓ 게시글 상세
│   │   ├── CommentSection.tsx ✓ 댓글 섹션
│   │   ├── PostEditor.tsx   ✗ 게시글 에디터
│   │   ├── PostFilters.tsx  ✗ 필터/정렬
│   │   └── QACard.tsx       ✗ Q&A 전용 카드
│   ├── communities/         # 커뮤니티 관련
│   │   ├── CommunityCard.tsx ✗ 커뮤니티 카드
│   │   ├── CommunityList.tsx ✗ 커뮤니티 목록
│   │   ├── CommunityHeader.tsx ✗ 커뮤니티 헤더
│   │   ├── MemberList.tsx   ✗ 멤버 목록
│   │   └── JoinButton.tsx   ✗ 가입 버튼
│   ├── chat/                # 채팅 관련
│   │   ├── ChatRoom.tsx     ✗ 채팅방
│   │   ├── MessageList.tsx  ✗ 메시지 목록
│   │   ├── MessageInput.tsx ✗ 메시지 입력
│   │   └── ChatSkeleton.tsx ✗ 채팅 스켈레톤
│   └── auth/                # 인증 관련
│       ├── LoginForm.tsx    ✗ 로그인 폼
│       ├── SignupForm.tsx   ✗ 회원가입 폼
│       ├── SocialLogin.tsx  ✗ 소셜 로그인 버튼
│       └── UserMenu.tsx     ✗ 사용자 메뉴
│   └── providers/           # Provider 컴포넌트
│       └── SessionProvider.tsx ✓ NextAuth 세션 프로바이더
├── lib/
│   ├── prisma.ts            ✓ Prisma 클라이언트
│   ├── utils.ts             ✓ 유틸리티
│   ├── types.ts             ✓ 타입 정의 파일
│   └── api.ts               ✓ API 유틸리티
├── hooks/
│   └── use-toast.tsx        ✓ 토스트 훅
├── prisma/
│   ├── schema.prisma        ✓ 데이터베이스 스키마
│   └── seed.ts              ✓ 시드 데이터
├── auth.ts                  ✓ NextAuth 설정
└── package.json             ✓ 프로젝트 설정
```

## 🎯 API 라우트 매핑

### 📊 전체 현황
- **API**: 60개 중 13개 구현 (21.7%)
- **페이지**: 12개 중 5개 구현 (41.7%)
- **컴포넌트**: 83개 중 26개 구현 (31.3%)
- **전체**: 155개 중 44개 구현 (28.4%)

### 1️⃣ 인증 & 사용자 API (8개) - ✅ 12.5% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/auth/[...nextauth]` | * | NextAuth 핸들러 | ✅ |
| `/api/users/me` | GET | 내 정보 조회 | ❌ |
| `/api/users/me` | PUT | 내 정보 수정 | ❌ |
| `/api/users/[id]` | GET | 사용자 프로필 조회 | ❌ |
| `/api/users/[id]/posts` | GET | 사용자 게시글 목록 | ❌ |
| `/api/users/[id]/communities` | GET | 사용자 가입 커뮤니티 | ❌ |
| `/api/users/bookmarks` | GET | 내 북마크 목록 | ❌ |
| `/api/users/stats` | GET | 내 활동 통계 | ❌ |

### 2️⃣ 메인 사이트 API (19개) - ✅ 52.6% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/main/posts` | GET | 게시글 목록 조회 | ✅ |
| `/api/main/posts` | POST | 게시글 작성 | ❌ |
| `/api/main/posts/[id]` | GET | 게시글 상세 조회 | ✅ |
| `/api/main/posts/[id]` | PUT | 게시글 수정 | ❌ |
| `/api/main/posts/[id]` | DELETE | 게시글 삭제 | ❌ |
| `/api/main/posts/[id]/approve` | POST | 게시글 승인 (매니저) | ❌ |
| `/api/main/posts/[id]/reject` | POST | 게시글 거부 (매니저) | ❌ |
| `/api/main/posts/[id]/like` | POST/GET | 좋아요 토글/상태 | ✅ |
| `/api/main/posts/[id]/bookmark` | POST/GET | 북마크 토글/상태 | ✅ |
| `/api/main/posts/[id]/comments` | GET | 댓글 목록 조회 | ✅ |
| `/api/main/posts/[id]/comments` | POST | 댓글 작성 | ✅ |
| `/api/main/comments/[id]` | PUT | 댓글 수정 | ❌ |
| `/api/main/comments/[id]` | DELETE | 댓글 삭제 | ❌ |
| `/api/main/categories` | GET | 카테고리 목록 | ✅ |
| `/api/main/tags` | GET | 태그 목록 | ✅ |
| `/api/main/tags` | POST | 태그 생성 | ❌ |
| `/api/main/tags/[id]` | PUT | 태그 수정 | ❌ |
| `/api/main/tags/[id]` | DELETE | 태그 삭제 | ❌ |
| `/api/main/tags/[id]/posts` | GET | 태그별 게시글 | ❌ |

### 3️⃣ 커뮤니티 API (21개) - ❌ 0% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/communities` | GET | 커뮤니티 목록 조회 | ❌ |
| `/api/communities` | POST | 커뮤니티 생성 | ❌ |
| `/api/communities/[id]` | GET | 커뮤니티 상세 조회 | ❌ |
| `/api/communities/[id]` | PUT | 커뮤니티 수정 | ❌ |
| `/api/communities/[id]` | DELETE | 커뮤니티 삭제 | ❌ |
| `/api/communities/[id]/join` | POST | 커뮤니티 가입 | ❌ |
| `/api/communities/[id]/leave` | DELETE | 커뮤니티 탈퇴 | ❌ |
| `/api/communities/[id]/members` | GET | 멤버 목록 | ❌ |
| `/api/communities/[id]/members/[userId]` | PUT | 멤버 역할 변경 | ❌ |
| `/api/communities/[id]/members/[userId]/ban` | POST | 멤버 밴 | ❌ |
| `/api/communities/[id]/categories` | GET | 카테고리 목록 | ❌ |
| `/api/communities/[id]/categories` | POST | 카테고리 생성 | ❌ |
| `/api/communities/[id]/announcements` | GET | 공지사항 목록 | ❌ |
| `/api/communities/[id]/announcements` | POST | 공지사항 작성 | ❌ |
| `/api/communities/[id]/posts` | GET | 게시글 목록 | ❌ |
| `/api/communities/[id]/posts` | POST | 게시글 작성 | ❌ |
| `/api/community-posts/[id]` | GET | 게시글 상세 | ❌ |
| `/api/community-posts/[id]` | PUT | 게시글 수정 | ❌ |
| `/api/community-posts/[id]` | DELETE | 게시글 삭제 | ❌ |
| `/api/community-posts/[id]/like` | POST | 좋아요 토글 | ❌ |
| `/api/community-posts/[id]/bookmark` | POST | 북마크 토글 | ❌ |

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

### 5️⃣ 파일 API (3개) - ❌ 0% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/files/upload` | POST | 파일 업로드 | ❌ |
| `/api/files/[id]` | GET | 파일 정보 조회 | ❌ |
| `/api/files/[id]` | DELETE | 파일 삭제 | ❌ |

### 6️⃣ 알림 API (3개) - ❌ 0% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/notifications` | GET | 알림 목록 조회 | ❌ |
| `/api/notifications/[id]/read` | PUT | 알림 읽음 처리 | ❌ |
| `/api/notifications/read-all` | PUT | 모든 알림 읽음 처리 | ❌ |

### 7️⃣ 검색 API (4개) - ❌ 0% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/search` | GET | 통합 검색 | ❌ |
| `/api/search/posts` | GET | 게시글 검색 | ❌ |
| `/api/search/communities` | GET | 커뮤니티 검색 | ❌ |
| `/api/search/users` | GET | 사용자 검색 | ❌ |

### 8️⃣ 통계 API (3개) - ✅ 66.7% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/main/stats` | GET | 커뮤니티 통계 | ✅ |
| `/api/main/users/active` | GET | 활발한 사용자 | ✅ |
| `/api/stats/site` | GET | 사이트 전체 통계 | ❌ |
| `/api/stats/trending` | GET | 인기 콘텐츠 | ❌ |

### 9️⃣ 기타 (2개) - ✅ 100% 완료
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/prisma/schema.prisma` | - | DB 스키마 정의 | ✅ |
| `/prisma/seed.ts` | - | 시드 데이터 | ✅ |
| `/auth.ts` | - | NextAuth 설정 | ✅ |
| `/lib/prisma.ts` | - | Prisma 클라이언트 | ✅ |

## 📄 페이지 구현 현황

### 📊 페이지 현황: 총 12개
- ✅ 구현 완료: 5개 (41.7%)
- ❌ 미구현: 7개 (58.3%)

### 페이지 목록
| 경로 | 설명 | 레이아웃 | 상태 |
|------|------|----------|------|
| `/` | 메인 페이지 | (marketing) | ✅ |
| `/signin` | 로그인 페이지 | (auth) | ✅ |
| `/signup` | 회원가입 페이지 | (auth) | ❌ |
| `/dashboard` | 사용자 대시보드 | (dashboard) | ✅ |
| `/profile/[id]` | 사용자 프로필 | (main) | ❌ |
| `/main/posts` | 게시글 목록 | (main) | ✅ |
| `/main/posts/[id]` | 게시글 상세 | (main) | ✅ |
| `/main/write` | 게시글 작성 | (main) | ❌ |
| `/communities` | 커뮤니티 목록 | (community) | ❌ |
| `/communities/[id]` | 커뮤니티 상세 | (community) | ❌ |
| `/communities/[id]/chat` | 커뮤니티 채팅 | (community) | ❌ |
| `/search` | 검색 결과 | (main) | ❌ |

## 🧩 컴포넌트 구현 현황

### 📊 컴포넌트 현황: 총 83개
- ✅ 구현 완료: 26개 (31.3%)
- ❌ 미구현: 57개 (68.7%)

### 카테고리별 현황
| 카테고리 | 전체 | 구현 | 구현율 |
|----------|------|------|---------|
| UI (shadcn) | 14개 | 14개 | 100% |
| Layouts | 6개 | 2개 | 33.3% |
| Home | 11개 | 3개 | 27.3% |
| Posts | 7개 | 4개 | 57.1% |
| Hooks | 1개 | 1개 | 100% |
| Shared | 18개 | 0개 | 0% |
| Communities | 5개 | 0개 | 0% |
| Chat | 4개 | 0개 | 0% |
| Auth | 4개 | 0개 | 0% |
| Providers | 1개 | 1개 | 100% |
| Others | 13개 | 0개 | 0% |

## 🛠️ 기술 스택

- **Framework**: Next.js 15.4.4 (App Router)
- **Auth**: NextAuth.js v5
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand
- **API**: tRPC (planned)