# 🚀 개발자 중심 프로젝트 구조 가이드

## 1. 프로젝트 현황
### 📊 완성도
| 항목 | 완료율 | 상태 | 미완성 |
|------|--------|------|--------|
| **API** | 98.8% (81/82) | ✅ | `app/api/stats/` (사용자 활동 통계) |
| **페이지** | 100% (22/22) | ✅ | - |
| **컴포넌트** | 83.1% | ⏳ | 일부 커스텀 컴포넌트 |

### ⚙️ 기술 스택
```markdown
- Next.js 15
- Prisma + Neon PostgreSQL
- NextAuth v5 + Redis 세션
- shadcn/ui 컴포넌트 라이브러리
```

### 🔔 최근 업데이트
```markdown
- [x] Redis 캐싱 전면 적용
- [x] 52개 API 라우트 Next.js 15 async 파라미터 처리
- [x] CSRF 보안 강화 (Double Submit Cookie)
- [x] 모든 API Zod 유효성 검사 적용
```

---

## 2. 시스템 아키텍처
### 🗄️ 데이터베이스 계층
```mermaid
graph LR
A[Next.js] --> B[Prisma ORM]
B --> C[Neon PostgreSQL]
B --> D[Redis Cloud]
```

### 🔐 권한 시스템
```markdown
- **Global Roles**: 
  👑 ADMIN → 🛠️ MANAGER → 👤 USER
- **Community Roles**:
  OWNER → MODERATOR → MEMBER
```

### ⚡ 실시간 기능
```markdown
- SSE 기반 채팅 (`app/api/chat/`)
- Redis Pub/Sub 알림 시스템
- 실시간 대시보드 (`components/admin/RealtimeDashboard`)
```

---

## 3. 코드베이스 구조
### 📂 핵심 디렉토리
```mermaid
graph TD
A[Project Root] --> B[app]
A --> C[components]
A --> D[lib]
A --> E[prisma]
A --> F[public]
B --> G[api]
B --> H[admin]
B --> I[communities]
C --> J[ui]
C --> K[shared]
C --> L[feature]
D --> M[auth-utils.ts]
D --> N[redis.ts]
```

### 📊 API 라우트 전체 현황 (83개)
#### 인증 (8 routes)
| Method | Path | 파일 경로 | 상태 |
|--------|------|-----------|------|
| GET | /api/auth/* | app/api/auth/[...nextauth]/route.ts | ✅ |

#### 관리자 (15 routes)
| Method | Path | 파일 경로 | 상태 |
|--------|------|-----------|------|
| GET | /api/admin/categories | app/api/admin/categories/route.ts | ✅ |
| PUT | /api/admin/categories/[id] | app/api/admin/categories/[id]/route.ts | ✅ |
| GET | /api/admin/communities | app/api/admin/communities/route.ts | ✅ |
| POST | /api/admin/communities/[communityId] | app/api/admin/communities/[communityId]/route.ts | ✅ |
| GET | /api/admin/data-viewer/[table] | app/api/admin/data-viewer/[table]/route.ts | ✅ |
| GET | /api/admin/posts/community | app/api/admin/posts/community/route.ts | ✅ |
| PUT | /api/admin/posts/community/[id] | app/api/admin/posts/community/[id]/route.ts | ✅ |
| GET | /api/admin/posts/main | app/api/admin/posts/main/route.ts | ✅ |
| PUT | /api/admin/posts/main/[id] | app/api/admin/posts/main/[id]/route.ts | ✅ |
| POST | /api/admin/posts/main/[id]/pin | app/api/admin/posts/main/[id]/pin/route.ts | ✅ |
| GET | /api/admin/stats | app/api/admin/stats/route.ts | ✅ |
| GET | /api/admin/users | app/api/admin/users/route.ts | ✅ |
| PUT | /api/admin/users/[userId]/active | app/api/admin/users/[userId]/active/route.ts | ✅ |
| POST | /api/admin/users/[userId]/ban | app/api/admin/users/[userId]/ban/route.ts | ✅ |
| PUT | /api/admin/users/[userId]/role | app/api/admin/users/[userId]/role/route.ts | ✅ |
| POST | /api/admin/users/[userId]/unban | app/api/admin/users/[userId]/unban/route.ts | ✅ |

#### 채팅 (12 routes)
| Method | Path | 파일 경로 | 상태 |
|--------|------|-----------|------|
| GET | /api/chat/channels | app/api/chat/channels/route.ts | ✅ |
| POST | /api/chat/channels/[channelId]/messages | app/api/chat/channels/[channelId]/messages/route.ts | ✅ |
| GET | /api/chat/channels/[channelId]/events | app/api/chat/channels/[channelId]/events/route.ts | ✅ |
| POST | /api/chat/channels/[channelId]/read | app/api/chat/channels/[channelId]/read/route.ts | ✅ |
| POST | /api/chat/channels/[channelId]/typing | app/api/chat/channels/[channelId]/typing/route.ts | ✅ |
| GET | /api/chat/global | app/api/chat/global/route.ts | ✅ |
| POST | /api/chat/upload | app/api/chat/upload/route.ts | ✅ |

#### 커뮤니티 (32 routes)
| Method | Path | 파일 경로 | 상태 |
|--------|------|-----------|------|
| POST | /api/communities | app/api/communities/route.ts | ✅ |
| GET | /api/communities/[id] | app/api/communities/[id]/route.ts | ✅ |
| GET | /api/communities/[id]/announcements | app/api/communities/[id]/announcements/route.ts | ✅ |
| PUT | /api/communities/[id]/announcements/[announcementId] | app/api/communities/[id]/announcements/[announcementId]/route.ts | ✅ |
| GET | /api/communities/[id]/categories | app/api/communities/[id]/categories/route.ts | ✅ |
| PUT | /api/communities/[id]/categories/[categoryId] | app/api/communities/[id]/categories/[categoryId]/route.ts | ✅ |
| POST | /api/communities/[id]/categories/reorder | app/api/communities/[id]/categories/reorder/route.ts | ✅ |
| GET | /api/communities/[id]/channel | app/api/communities/[id]/channel/route.ts | ✅ |
| PUT | /api/communities/[id]/comments/[commentId] | app/api/communities/[id]/comments/[commentId]/route.ts | ✅ |
| POST | /api/communities/[id]/join | app/api/communities/[id]/join/route.ts | ✅ |
| GET | /api/communities/[id]/members | app/api/communities/[id]/members/route.ts | ✅ |
| PUT | /api/communities/[id]/members/[memberId] | app/api/communities/[id]/members/[memberId]/route.ts | ✅ |
| POST | /api/communities/[id]/members/approve | app/api/communities/[id]/members/approve/route.ts | ✅ |
| GET | /api/communities/[id]/posts | app/api/communities/[id]/posts/route.ts | ✅ |
| PUT | /api/communities/[id]/posts/[postId] | app/api/communities/[id]/posts/[postId]/route.ts | ✅ |
| GET | /api/communities/active | app/api/communities/active/route.ts | ✅ |
| POST | /api/communities/check-duplicate | app/api/communities/check-duplicate/route.ts | ✅ |
| POST | /api/communities/check-slug | app/api/communities/check-slug/route.ts | ✅ |

#### 검색 (1 route)
| Method | Path | 파일 경로 | 상태 |
|--------|------|-----------|------|
| GET | /api/search | app/api/search/route.ts | ✅ |

#### 통계 (2 routes - 미구현)
| Method | Path | 파일 경로 | 상태 |
|--------|------|-----------|------|
| GET | /api/stats/user-activity | ❌ 파일 없음 | ❌ |
| GET | /api/stats/post-trends | ❌ 파일 없음 | ❌ |

> 전체 83개 API 중 81개 구현 완료 (✅), 2개 미구현 (❌)

> 전체 83개 API 중 81개 구현 완료 (✅), 2개 미구현 (❌)

---

## 4. 개발 워크플로우
### 🛠️ 로컬 환경 설정
```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env)
DATABASE_URL="postgres://..."
REDIS_URL="redis://..."

# 3. DB 마이그레이션
npx prisma migrate dev
```

### ⚡ 주요 명령어
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 & 포맷팅
npm run lint
```

### 🧪 테스트
```markdown
- 관리자 테스트 센터: `app/admin/test`
- 테스트 명령어: `npm run test` (구현 필요 ⚠️)
```

---

## 5. 미완성 작업
### ❌ API
```markdown
1. 사용자 활동 통계: 
   - `GET /api/stats/user-activity`
   - 위치: `app/api/stats/route.ts` (파일 없음)

2. 게시글 추이 통계:
   - `GET /api/stats/post-trends`
```

### ⚠️ 코드 품질
```markdown
- **단위 테스트 부족**: 0% 커버리지
- **성능 개선**: Lighthouse 점수 62점 (Poor)
- **최적화**: 
  - Redis 캐싱 응답시간 300ms → 50ms 개선 가능
  - 번들 크기 1.2MB → 800KB 목표
```

---

## 6. UI 컴포넌트 가이드
### 🧩 컴포넌트 전체 목록 (84개)

#### UI 라이브러리 컴포넌트 (18개)
| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| `Button` | `components/ui/button.tsx` | 기본 버튼 컴포넌트 |
| `Dialog` | `components/ui/dialog.tsx` | 모달 다이얼로그 |
| `Table` | `components/ui/table.tsx` | 데이터 테이블 렌더링 |
| `Avatar` | `components/ui/avatar.tsx` | 사용자 아바타 |
| `Card` | `components/ui/card.tsx` | 카드 레이아웃 컴포넌트 |
| `Input` | `components/ui/input.tsx` | 입력 필드 |
| ... | ... | ... |

#### 커스텀 컴포넌트 (66개)
| 컴포넌트 | 경로 | 기능 |
|----------|------|------|
| `VisitorTracker` | `components/VisitorTracker.tsx` | 방문자 추적 UI |
| `DataTableViewer` | `components/admin/DataTableViewer.tsx` | 관리자 데이터 표시 |
| `FloatingChatButton` | `components/chat/FloatingChatButton.tsx` | 채팅 시작 버튼 |
| `FloatingChatWindow` | `components/chat/FloatingChatWindow.tsx` | 채팅 창 컴포넌트 |
| `CommunityPostEditor` | `components/communities/CommunityPostEditor.tsx` | 커뮤니티 게시글 편집기 |
| `CommunityMemberList` | `components/communities/CommunityMemberList.tsx` | 커뮤니티 멤버 목록 |
| `CategorySettings` | `components/communities/settings/CategorySettings.tsx` | 커뮤니티 카테고리 설정 | 
| `GeneralSettings` | `components/communities/settings/GeneralSettings.tsx` | 커뮤니티 일반 설정 |
| `MemberSettings` | `components/communities/settings/MemberSettings.tsx` | 커뮤니티 멤버 관리 |
| `ErrorBoundary` | `components/error-boundary/ErrorBoundary.tsx` | 에러 처리 컴포넌트 |
| `HeroSection` | `components/home/HeroSection.tsx` | 홈페이지 헤로 섹션 |
| `Header` | `components/layouts/Header.tsx` | 전역 헤더 네비게이션 |
| `NotificationDropdown` | `components/notifications/NotificationDropdown.tsx` | 알림 드롭다운 |
| `CommentItem` | `components/posts/CommentItem.tsx` | 댓글 아이템 |
| `CommentSection` | `components/posts/CommentSection.tsx` | 댓글 섹션 |
| `DropzoneArea` | `components/posts/DropzoneArea.tsx` | 파일 업로드 영역 |
| `MarkdownPreview` | `components/posts/MarkdownPreview.tsx` | 마크다운 미리보기 |
| `MemoizedComponents` | `components/posts/MemoizedComponents.tsx` | 성능 최적화 컴포넌트 |
| `PostEditor` | `components/posts/PostEditor.tsx` | 게시글 편집기 |
| `RelatedPosts` | `components/posts/RelatedPosts.tsx` | 관련 게시글 표시 |
| `ShareModal` | `components/posts/ShareModal.tsx` | 게시글 공유 모달 |
| `SearchModal` | `components/search/SearchModal.tsx` | 통합 검색 모달 |
| `AuthorAvatar` | `components/shared/AuthorAvatar.tsx` | 작성자 아바타 |
| ... | ... | ... |

### 📑 페이지 전체 현황 (22개)

#### 메인 페이지 (7)
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 홈 | `app/page.tsx` | ✅ |
| 게시글 목록 | `app/main/posts/page.tsx` | ✅ |
| 게시글 상세 | `app/main/posts/[id]/page.tsx` | ✅ |
| 태그별 게시글 | `app/main/tags/[name]/page.tsx` | ✅ |
| 글 작성 | `app/main/write/page.tsx` | ✅ |
| 프로필 | `app/profile/[id]/page.tsx` | ✅ |
| 북마크 | `app/users/bookmarks/page.tsx` | ✅ |

#### 관리자 페이지 (6)
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 대시보드 | `app/admin/page.tsx` | ✅ |
| 카테고리 관리 | `app/admin/categories/page.tsx` | ✅ |
| 커뮤니티 관리 | `app/admin/communities/page.tsx` | ✅ |
| 데이터 관리 | `app/admin/database/page.tsx` | ✅ |
| 게시글 승인 | `app/admin/pending/page.tsx` | ✅ |
| 사용자 관리 | `app/admin/users/page.tsx` | ✅ |

#### 커뮤니티 페이지 (6)
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 커뮤니티 목록 | `app/communities/page.tsx` | ✅ |
| 커뮤니티 상세 | `app/communities/[id]/page.tsx` | ✅ |
| 커뮤니티 게시글 | `app/communities/[id]/posts/page.tsx` | ✅ |
| 커뮤니티 설정 | `app/communities/[id]/settings/page.tsx` | ✅ |
| 커뮤니티 글 작성 | `app/communities/[id]/write/page.tsx` | ✅ |
| 커뮤니티 생성 | `app/communities/new/page.tsx` | ✅ |

#### 기타 페이지 (3)
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 로그인 | `app/auth/signin/page.tsx` | ✅ |
| 대시보드 | `app/dashboard/page.tsx` | ✅ |
| 알림 | `app/dashboard/notifications/page.tsx` | ✅ |

### 📱 반응형 디자인
```markdown
- 모바일 퍼스트 접근
- Breakpoint: sm:640px, md:768px, lg:1024px
- 예시: `className="md:flex hidden"`
```

> **Note**: 문서 버전 3.0 - 2025.08.04 업데이트 (전체 컴포넌트 73개, 페이지 22개 상세 기술)
