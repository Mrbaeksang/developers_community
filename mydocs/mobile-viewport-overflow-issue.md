# 🚨 모바일 뷰포트 Overflow 문제 조사 요청

## 📱 문제 상황

390px 모바일 뷰포트에서 게시글 상세 페이지의 **모든 카드 컴포넌트들의 오른쪽 border와 shadow가 화면 밖으로 잘려서 보이지 않는 문제**가 발생하고 있습니다.

### 현재 상황 (ASCII 도식)

```
┌──────────── 390px 뷰포트 ────────────┐
│                                      │
│  ┌──────────────────────────────────│───┐  <- UnifiedPostDetail 카드
│  │                                   │   │     오른쪽 border가 잘림!
│  │  게시글 제목                      │   │
│  │  게시글 내용...                   │   │
│  │                                   │   │
│  └──────────────────────────────────│───┘
│                                      │
│  [모든 게시글 보러가기]  [Q&A 질문하│기]   <- 버튼들 오른쪽 잘림!
│                                      │
│  주간 인기 게시글                    │
│  ┌─────┐ ┌─────┐ ┌─────┐           │      <- 가로 스크롤 카드들
│  │카드1│ │카드2│ │카드3│           │         
│  └─────┘ └─────┘ └─────┘           │
│                                      │
│  관련 게시글                         │
│  ┌─────┐ ┌─────┐ ┌─────┐           │      <- 가로 스크롤 카드들
│  │카드1│ │카드2│ │카드3│           │         
│  └─────┘ └─────┘ └─────┘           │
│                                      │
│  ┌──────────────────────────────────│───┐  <- CommentSection 카드
│  │  댓글                             │   │     오른쪽 border가 잘림!
│  │  댓글 내용들...                   │   │
│  └──────────────────────────────────│───┘
│                                      │
└──────────────────────────────────────┘
         화면 경계선 →                ↑
                              여기가 잘려서 안 보임
```

## 🎯 원하는 결과

**모든 카드 컴포넌트가 390px 뷰포트 안에 완전히 들어와야 합니다.**
- 오른쪽 border가 잘리지 않고 완전히 보여야 함
- shadow도 화면 안에 완전히 표시되어야 함
- Brutal Design 시스템 (border-2 + shadow) 유지

## 📂 검사해야 할 파일들

### 1. 메인 페이지 구조
```
app/main/posts/[id]/page.tsx
```
- 현재 컨테이너 구조: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`
- grid 레이아웃 설정 확인

### 2. 문제가 발생하는 컴포넌트들
```
components/posts/UnifiedPostDetail.tsx
```
- 게시글 내용 카드
- 현재: `border-2 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]`

```
components/posts/MobileRelatedSection.tsx
```
- CTA 버튼들 (모든 게시글 보러가기, Q&A 질문하기)
- 주간 인기 게시글 카드들
- 관련 게시글 카드들
- 가로 스크롤 컨테이너 구조

```
components/posts/CommentSection.tsx
```
- 댓글 섹션 카드
- 현재: `border-2 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]`

### 3. 글로벌 설정 및 스타일 파일들
```
tailwind.config.ts
```
- container 클래스 설정 확인
- screens 브레이크포인트 설정
- 커스텀 shadow 설정

```
app/globals.css
```
- 글로벌 CSS 리셋
- container 관련 커스텀 스타일
- scrollbar-hide 클래스 정의
- box-sizing 설정

```
app/layout.tsx
```
- 최상위 레이아웃 구조
- body 태그 클래스
- viewport 메타 태그 설정

```
components/ui/card.tsx
```
- Card 컴포넌트 기본 스타일
- 패딩, 마진 설정

### 4. 정상 작동하는 참고 페이지
```
app/main/write/page.tsx
components/posts/PostEditor.tsx
```
- 이 페이지는 모바일에서 카드가 잘리지 않음
- 구조: `max-w-6xl mx-auto` (container 클래스 없음)
- 외부 wrapper에 `p-4 lg:p-8` 패딩 있음

```
app/main/posts/page.tsx
components/posts/PostCard.tsx
```
- 게시글 목록 페이지도 정상 작동
- PostCard는 shadow 없이 border만 있음

## 🔍 시도했지만 실패한 해결책들

1. **container 클래스 제거** → 해결 안 됨
2. **패딩 조정** (px-1, px-2, px-3, px-4) → 해결 안 됨
3. **shadow 제거** (max-[640px]:!shadow-none) → 해결 안 됨
4. **shadow 방향 변경** (오른쪽 → 아래) → 해결 안 됨
5. **width calc() 사용** → 해결 안 됨

## 💡 의심되는 원인들

1. **Tailwind container 클래스**와 px 패딩의 상호작용 문제
2. **box-shadow**가 레이아웃 공간을 차지하지 않아 overflow 발생
3. **grid/flex 컨테이너**와 자식 요소 간의 너비 계산 문제
4. **max-w-7xl**과 실제 뷰포트 너비 간의 불일치
5. **글로벌 CSS의 box-sizing** 설정 문제
6. **Tailwind config의 container** 기본 설정
7. **viewport 메타 태그** 설정 문제

## 🛠 기술 스택
- Next.js 15.4.4
- React 19.1.0
- Tailwind CSS v4
- Brutal Design System (굵은 border + 큰 shadow)

## ✅ 해결 요구사항

1. **390px 모바일 뷰포트**에서 모든 컴포넌트가 화면 안에 완전히 표시
2. **Brutal Design 유지** (border-2 + shadow 효과)
3. **가로 스크롤은 유지** (MobileRelatedSection의 카드들)
4. **데스크톱 레이아웃은 변경하지 않음**

## 🔍 확인 필요 사항

1. **Tailwind container 클래스 동작**
   - tailwind.config.ts에서 container 설정 확인
   - 기본 padding, center 설정 확인

2. **CSS Box Model**
   - box-sizing: border-box 적용 여부
   - border와 shadow의 실제 렌더링 영역

3. **Responsive 브레이크포인트**
   - sm: 640px 이상
   - 390px는 기본(모바일) 범위
   - 모바일 우선 설계 확인

4. **overflow 처리**
   - overflow-x-hidden이 shadow에 영향 주는지
   - 부모-자식 간 overflow 상속

## 🙏 부탁사항

이 문제를 해결하기 위해 위 파일들을 체계적으로 검토하고, 모바일에서 카드들이 화면 밖으로 나가지 않도록 수정해주세요. 

**특히 주목할 점:**
- `/main/write` 페이지는 정상 작동 (참고용)
- `/main/posts` 목록 페이지도 정상 작동
- 오직 `/main/posts/[id]` 상세 페이지만 문제

**핵심: 390px 뷰포트에서 모든 요소가 화면 안에 완전히 보여야 합니다!**

## 📝 테스트 방법

1. Chrome DevTools 열기
2. Device Mode로 전환 (Ctrl+Shift+M)
3. Responsive 모드에서 너비 390px 설정
4. `/main/posts/[id]` 페이지 접속
5. 오른쪽 border와 shadow 확인