# UI 개선 계획 문서 (2025.08)

## 📋 개요
현재 네오브루털리즘 디자인을 유지하면서 2025년 트렌드에 맞는 현대적인 개발자 커뮤니티 플랫폼으로 업그레이드

## 🎯 Phase 1: 즉시 교체 필요 (우선순위 높음)

### 1. 실시간 채팅 시스템 (분리형 구조)

#### A. 글로벌 채팅 (플로팅 전용)
**현재 구조 유지:**
- FloatingChatButton.tsx → 글로벌 채팅 전용
- 플로팅 윈도우로만 접근
- 전체 사이트 공용 채팅

#### B. 커뮤니티 채팅 (내장형)
**가져올 컴포넌트:**
- Discord 스타일 사이드바 채팅
- 스레드 시스템
- 이모지 리액션 피커
- 멘션 자동완성
- 코드 블록 렌더러
- 탭 전환 컴포넌트 (모바일용)

**영향받는 파일:**
```
components/communities/
├── CommunityChatPanel.tsx (신규 - 사이드바용)
├── CommunityChatTab.tsx (신규 - 탭용)
└── CommunityChatMobile.tsx (신규 - 모바일용)

app/communities/[id]/
├── layout.tsx (레이아웃 수정 - 사이드바 추가)
└── page.tsx (탭 네비게이션 추가)

components/chat/
├── FloatingChatButton.tsx (글로벌 전용으로 수정)
└── ChatChannelList.tsx (글로벌 채널만 표시)
```

**21st.dev 검색 키워드:**
- "discord sidebar chat react"
- "slack workspace chat panel"
- "tab navigation chat component"
- "responsive chat layout"

---

### 2. AI 강화 검색바 (Command Palette)
**가져올 컴포넌트:**
- Command Palette (Cmd+K)
- 퍼지 검색
- AI 제안 시스템
- 최근 검색 기록

**영향받는 파일:**
```
components/ui/
├── command.tsx (현재 미사용 → 교체)
└── search-command.tsx (신규)

components/shared/
└── Header.tsx (수정 - 검색바 교체)

app/api/search/
└── route.ts (AI 검색 API 추가)
```

**21st.dev 검색 키워드:**
- "command palette react cmdk"
- "ai powered search component"
- "fuzzy search with suggestions"

---

### 3. 코드 에디터 업그레이드
**가져올 컴포넌트:**
- Monaco Editor 또는 CodeMirror 6
- Diff 뷰어
- 신택스 하이라이팅
- 자동완성
- 멀티 커서

**영향받는 파일:**
```
components/posts/
├── PostEditor.tsx (교체)
└── CodeBlock.tsx (교체)

components/communities/
├── CommunityPostEditor.tsx (수정)
└── CommunityCommentSection.tsx (수정)

package.json (의존성 추가)
- @monaco-editor/react 또는
- @codemirror/lang-*
```

**21st.dev 검색 키워드:**
- "monaco editor react typescript"
- "codemirror 6 react component"
- "code diff viewer react"

---

### 4. 대시보드 Bento Grid
**가져올 컴포넌트:**
- 드래그 앤 드롭 그리드
- 리사이즈 가능한 위젯
- 실시간 차트
- GitHub 스타일 활동 히트맵

**영향받는 파일:**
```
app/dashboard/
└── page.tsx (전면 재구성)

components/dashboard/
├── DashboardGrid.tsx (신규)
├── ActivityHeatmap.tsx (신규)
├── StatsWidget.tsx (신규)
└── DashboardQuickLinks.tsx (수정)
```

**21st.dev 검색 키워드:**
- "bento grid dashboard react"
- "draggable grid layout"
- "github contribution graph react"

---

## 🔄 Phase 2: 개선 필요 (중간 우선순위)

### 5. 알림 센터
**가져올 컴포넌트:**
- 알림 드롭다운
- 알림 타임라인
- 읽음/안읽음 관리

**영향받는 파일:**
```
components/shared/
├── Header.tsx (알림 벨 추가)
└── NotificationCenter.tsx (신규)

lib/notifications/
└── types.ts (수정)
```

---

### 6. 파일 업로드 시스템
**가져올 컴포넌트:**
- Dropzone
- 파일 미리보기
- 업로드 진행률
- 다중 파일 관리

**영향받는 파일:**
```
components/ui/
└── file-upload.tsx (신규)

components/communities/
└── CommunityPostEditor.tsx (파일 업로드 개선)
```

---

### 7. 데이터 테이블
**가져올 컴포넌트:**
- TanStack Table
- 가상 스크롤
- 필터/정렬 UI

**영향받는 파일:**
```
components/ui/
└── data-table.tsx (신규)

app/admin/ (관리자 페이지들)
└── 모든 목록 페이지 개선
```

---

## 💡 Phase 3: Nice to Have (낮은 우선순위)

### 8. 게임화 시스템
- 레벨/경험치 바
- 배지 컬렉션
- 리더보드
- 스트릭 캘린더

### 9. 온보딩 플로우
- 인터랙티브 튜토리얼
- 프로그레스 인디케이터
- 툴팁 투어

---

## 📦 필요한 npm 패키지

### Phase 1 패키지
```json
{
  "@monaco-editor/react": "^4.6.0",
  "cmdk": "^1.0.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/core": "^6.1.0",
  "react-grid-layout": "^1.4.0",
  "@emoji-mart/react": "^1.1.1",
  "recharts": "^2.12.0"
}
```

### Phase 2 패키지
```json
{
  "@tanstack/react-table": "^8.20.0",
  "react-dropzone": "^14.2.0",
  "@tanstack/react-virtual": "^3.10.0"
}
```

---

## 🎨 Magic MCP 프롬프트 템플릿

### 채팅 컴포넌트
```
Create a Discord-style chat component with:
- Thread support
- Emoji reactions
- Code syntax highlighting
- User mentions with @
- Typing indicators
- Message editing/deletion
- File attachments
Keep neobrutalism design with black borders and hard shadows
```

### Command Palette
```
Create a VS Code style command palette with:
- Fuzzy search
- AI-powered suggestions
- Recent searches
- Keyboard navigation
- Categories (Files, Commands, Users)
- Cmd+K shortcut
Neobrutalism style with sharp edges and bold typography
```

### 코드 에디터
```
Create a code editor component with:
- Monaco editor integration
- Multiple language support
- Diff view
- Minimap
- Auto-completion
- Theme switcher (light/dark)
- Line numbers and folding
```

### Bento Grid Dashboard
```
Create a Notion-style bento grid dashboard with:
- Drag and drop widgets
- Resizable cards
- Activity heatmap like GitHub
- Stats cards with charts
- Quick actions section
- Responsive grid layout
Maintain neobrutalism aesthetic
```

---

## 🚀 구현 순서

### Week 1-2
1. Command Palette 설치 및 통합
2. 채팅 시스템 업그레이드
3. 헤더 검색바 교체

### Week 3-4
4. 코드 에디터 교체
5. 대시보드 Bento Grid 구현
6. 알림 센터 추가

### Week 5-6
7. 파일 업로드 개선
8. 데이터 테이블 도입
9. 성능 최적화 및 테스트

---

## ⚠️ 주의사항

1. **기존 네오브루털리즘 유지**
   - 검은 테두리 (border-2 border-black)
   - 하드 섀도우 (shadow-[4px_4px_0px_0px_rgba(0,0,0,1)])
   - 굵은 타이포그래피 (font-bold, font-black)

2. **성능 고려**
   - 번들 크기 모니터링
   - 레이지 로딩 적용
   - 트리 셰이킹 확인

3. **접근성**
   - WCAG 2.1 AA 준수
   - 키보드 네비게이션
   - 스크린 리더 지원

4. **모바일 대응**
   - 터치 제스처
   - 반응형 레이아웃
   - 성능 최적화

---

## 📊 예상 효과

- **사용자 경험**: 50% 개선
- **페이지 로딩**: 30% 단축
- **인터랙션**: 실시간 협업 강화
- **차별화**: AI 기능으로 경쟁력 확보
- **개발자 만족도**: 코드 에디터로 크게 향상