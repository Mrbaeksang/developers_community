# 🎨 프로젝트 디자인 시스템 & UI/UX 로드맵

## 📋 현재 상태 분석

### ✅ 구현 완료
- **UI 기반**: shadcn/ui 컴포넌트 (23개)
- **디자인 패턴**: Neobrutalism (굵은 테두리, 하드 섀도우)
- **핵심 컴포넌트**: TagSelector, CategorySelector, Pagination, LoadingSpinner, EmptyState
- **에디터**: PostEditor, CommunityPostEditor (마크다운, 자동저장, 미리보기)

### 🏗️ 아키텍처 개요
```
메인 사이트 (승인제)          커뮤니티 (즉시 게시)
├── MainPost                 ├── Community
├── MainCategory             ├── CommunityPost  
├── MainTag                  ├── CommunityCategory
└── MainComment              └── CommunityComment

사용자 시스템                 실시간 기능
├── GlobalRole               ├── ChatChannel
├── CommunityRole            ├── ChatMessage
└── Notification             └── File Upload
```

## 🎯 미구현 핵심 기능 & 디자인 제안

### Phase 1: 즉시 필요 (1주)

#### 1️⃣ CommentForm 컴포넌트
**위치**: `components/comments/CommentForm.tsx`
**디자인 스펙**:
```typescript
interface CommentFormProps {
  postId: string
  parentId?: string // 답글용
  onSuccess?: () => void
  autoFocus?: boolean
}
```

**UI 특징**:
- 📝 확장형 텍스트 영역 (focus시 확장)
- 🎨 마크다운 미니 툴바 (Bold, Italic, Code, Link)
- 👤 @멘션 자동완성 (사용자 검색)
- 😊 이모지 피커 (floating popover)
- 📎 이미지 붙여넣기 지원
- 💾 임시저장 (localStorage)

**Neobrutalism 스타일**:
```css
border-2 border-black
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
focus-within:bg-yellow-50
```

#### 2️⃣ ImageUploader 컴포넌트
**위치**: `components/forms/ImageUploader.tsx`
**디자인 스펙**:
```typescript
interface ImageUploaderProps {
  onUpload: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // MB
  acceptedTypes?: string[]
  showPreview?: boolean
}
```

**UI 특징**:
- 🎯 드래그앤드롭 존 (dashed border)
- 🖼️ 썸네일 미리보기 그리드
- ✂️ 이미지 크롭 도구
- 📊 업로드 진행률 표시
- ❌ 개별 파일 삭제
- 🔄 드래그로 순서 변경

#### 3️⃣ SearchFilters 컴포넌트
**위치**: `components/search/SearchFilters.tsx`
**디자인 스펙**:
```typescript
interface SearchFiltersProps {
  categories: Category[]
  tags: Tag[]
  onFilterChange: (filters: FilterState) => void
  defaultFilters?: FilterState
}
```

**UI 특징**:
- 📁 카테고리 체크박스 그룹
- 🏷️ 태그 클라우드 (인기도 반영 크기)
- 📅 날짜 범위 선택기
- 👤 작성자 필터
- 📊 정렬 옵션 (최신/인기/댓글)
- 🔄 필터 리셋 버튼

### Phase 2: 핵심 기능 (2주)

#### 4️⃣ UserProfile 페이지
**위치**: `app/users/[username]/page.tsx`
**레이아웃**:
```
┌─────────────────────────────────────┐
│  🖼️ 배너 이미지                      │
│  ┌───┐ 사용자명                     │
│  │📷│ @username                     │
│  └───┘ 자기소개...                   │
│  📊 팔로워 100 | 게시글 50 | 댓글 200│
├─────────────────────────────────────┤
│ [게시글] [댓글] [북마크] [커뮤니티]   │
├─────────────────────────────────────┤
│  콘텐츠 리스트...                    │
└─────────────────────────────────────┘
```

#### 5️⃣ CommunityCard & CommunityList
**위치**: `components/communities/CommunityCard.tsx`
**카드 디자인**:
```
┌─────────────────────────┐
│ 🖼️ 배너 (16:9)         │
│ 📷 커뮤니티명           │
│ 👥 1.2K 멤버 · 📝 500글 │
│ 설명 텍스트 2줄...      │
│ 🔥 인기 태그 3개        │
│ [가입하기]              │
└─────────────────────────┘
```

#### 6️⃣ ActivityFeed 컴포넌트
**위치**: `components/dashboard/ActivityFeed.tsx`
**타임라인 아이템**:
```
⏰ 5분 전
👤 김철수님이 당신의 게시글에 댓글을 남겼습니다
"정말 유용한 정보네요! 감사합니다."
[게시글 보기]
─────────────────
```

### Phase 3: 고급 기능 (3주)

#### 7️⃣ ChatInterface 컴포넌트
**위치**: `components/chat/ChatInterface.tsx`
**레이아웃**:
```
┌─────────────────────────────────┐
│ #️⃣ 채널명           👥 온라인: 12│
├─────────────────────────────────┤
│ 메시지 영역                      │
│ ├─ 👤 사용자1: 안녕하세요        │
│ ├─ 👤 사용자2: 반갑습니다        │
│ └─ 📎 image.png                 │
├─────────────────────────────────┤
│ [😊] [📎] 메시지 입력... [전송]   │
└─────────────────────────────────┘
```

#### 8️⃣ NotificationCenter
**위치**: `components/notifications/NotificationCenter.tsx`
**탭 구조**:
- 전체 알림
- 댓글 & 답글
- 좋아요 & 북마크
- 커뮤니티
- 시스템

#### 9️⃣ UserStats 대시보드
**위치**: `components/dashboard/UserStats.tsx`
**통계 카드**:
- 📈 활동 히트맵 (GitHub 스타일)
- 📊 주간/월간 통계 차트
- 🏆 획득 배지 & 업적
- 🔥 연속 활동 일수

### Phase 4: 관리 기능 (1주)

#### 🔟 AdminDashboard 개선
**위치**: `app/admin/dashboard/page.tsx`
**위젯 구성**:
- 실시간 사용자 활동 모니터
- 대기중 승인 큐
- 신고 관리 패널
- 시스템 상태 & 성능 지표

## 🎨 디자인 시스템 일관성

### 색상 팔레트
```css
--primary: #000000 (검정 테두리)
--accent: #fbbf24 (노란색 강조)
--success: #22c55e (성공)
--danger: #ef4444 (위험)
--info: #3b82f6 (정보)
--bg-hover: #f9fafb (호버 배경)
```

### 컴포넌트 스타일 규칙
```typescript
// 기본 버튼
className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"

// 입력 필드
className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"

// 카드
className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
```

### 반응형 브레이크포인트
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 📅 구현 로드맵

### Week 1 (즉시 필요)
- [ ] CommentForm 컴포넌트
- [ ] ImageUploader 컴포넌트  
- [ ] SearchFilters 컴포넌트

### Week 2-3 (핵심 기능)
- [ ] UserProfile 페이지
- [ ] CommunityCard/List
- [ ] ActivityFeed

### Week 4-6 (고급 기능)
- [ ] ChatInterface
- [ ] NotificationCenter
- [ ] UserStats

### Week 7 (관리 기능)
- [ ] AdminDashboard 개선

## 🚀 다음 단계

1. **즉시 시작**: CommentForm 컴포넌트 구현
2. **디자인 검토**: Figma 목업 생성 (선택사항)
3. **테스트**: Storybook 스토리 작성
4. **문서화**: 각 컴포넌트 사용법 문서화

## 📝 참고사항

- 모든 컴포넌트는 TypeScript + React Hook 사용
- 상태관리: Zustand (전역), React Query (서버 상태)
- 스타일: Tailwind CSS + Neobrutalism
- 접근성: WCAG 2.1 AA 준수
- 성능: React.lazy() 활용, 이미지 최적화