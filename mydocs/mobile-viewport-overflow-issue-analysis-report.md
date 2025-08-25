# 🚨 모바일 뷰포트 Overflow 문제 분석 보고서

## 1. 개요

- **문제 현상:** 390px 너비의 모바일 뷰포트에서 게시글 상세 페이지(`/main/posts/[id]`)의 주요 컴포넌트(게시글 본문, 관련 게시글, 댓글 등)가 화면 오른쪽 경계를 넘어가면서 border와 shadow가 잘려 보이는 문제가 발생합니다.
- **핵심 요구사항:** Brutal 디자인 시스템(border + shadow)을 유지하면서 모든 요소가 뷰포트 내에 완전히 표시되어야 합니다.

## 2. 원인 분석

문제의 근본 원인은 **페이지 레이아웃의 패딩(padding) 적용 방식과 컴포넌트 너비 계산의 불일치**에 있습니다.

1.  **부모 컨테이너의 내부 패딩:**
    - 문제가 발생하는 `app/main/posts/[id]/page.tsx` 파일의 최상위 `div`에는 `className="... px-4 ..."`가 적용되어 있습니다.
    - `px-4`는 좌우에 `1rem` (16px)의 패딩을 추가합니다.
    - 따라서 390px 뷰포트에서 실제 콘텐츠가 표시될 수 있는 영역의 너비는 `390px - (16px * 2) = 358px`가 됩니다.

2.  **자식 컴포넌트의 너비:**
    - 내부 카드 컴포넌트들(`UnifiedPostDetail`, `CommentSection` 등)의 너비가 `100%` 또는 `w-full`로 설정되어 있을 것입니다.
    - 정상적인 상황이라면 이 컴포넌트들은 부모의 내부 너비인 `358px`에 맞춰져야 합니다.
    - 하지만 현재 상황은 컴포넌트들이 이 패딩을 무시하고 뷰포트 전체 너비(390px)를 기준으로 렌더링되려고 하면서 오른쪽으로 `16px`만큼 밀려나고, `body` 또는 상위 요소에 설정된 `overflow-x: hidden` 때문에 잘려나가는 것으로 보입니다.

3.  **정상 작동 페이지와의 비교:**
    - 정상 작동하는 `/main/write` 페이지는 컨테이너 자체에 `px-*` 패딩을 적용하는 대신, 내부 wrapper에 `p-4`를 적용하여 콘텐츠 영역을 제어합니다.
    - 이는 패딩을 적용하는 위치가 문제 해결의 핵심임을 시사합니다.

결론적으로, **부모 요소에 설정된 `px-4` 패딩이 내부 자식 요소들의 너비 계산에 올바르게 반영되지 않아** overflow가 발생하고 있습니다.

## 3. 해결 방안

가장 안정적이고 부작용이 적은 해결책은 **패딩의 적용 위치를 변경**하는 것입니다.

최상위 컨테이너의 `max-w-7xl`과 `mx-auto`는 그대로 유지하여 전체적인 데스크톱 레이아웃 구조를 보존하되, 모바일 뷰포트 문제를 일으키는 `px-*` 패딩을 하위 요소로 옮겨 적용합니다.

### 수정 제안 코드

**파일:** `app/main/posts/[id]/page.tsx`

```tsx
// 수정 전
export default function PostPage({ params }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <main className="flex flex-col gap-4">
        <UnifiedPostDetail postId={params.id} />
        <MobileRelatedSection postId={params.id} />
        <CommentSection postId={params.id} />
      </main>
    </div>
  );
}
```

```tsx
// 수정 후
export default function PostPage({ params }) {
  return (
    // 1. 최상위 div에서 px-* 패딩 클래스를 제거합니다.
    <div className="max-w-7xl mx-auto">
      {/* 2. 내부에 있는 main 태그 또는 새로운 wrapper div에 px-* 패딩을 적용합니다. */}
      <main className="px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
        <UnifiedPostDetail postId={params.id} />
        <MobileRelatedSection postId={params.id} />
        <CommentSection postId={params.id} />
      </main>
    </div>
  );
}
```

### 기대 효과

- 이 구조 변경을 통해 `main` 태그가 `max-w-7xl` 너비 내에서 패딩을 갖게 됩니다.
- 내부 컴포넌트들은 패딩이 적용된 `main` 태그의 너비(`100%`)를 기준으로 올바르게 계산되므로, 더 이상 뷰포트 밖으로 밀려나지 않습니다.
- 모바일(390px) 뷰포트에서 모든 컴포넌트와 shadow가 화면 안에 정상적으로 표시됩니다.
- 데스크톱 뷰포트에서도 기존 레이아웃이 그대로 유지됩니다.

## 4. 검증 방법

1.  제안된 코드로 `app/main/posts/[id]/page.tsx` 파일을 수정합니다.
2.  Chrome DevTools를 열고 모바일 디바이스 모드(390px 너비)로 전환합니다.
3.  게시글 상세 페이지에 접속하여 오른쪽 border와 shadow가 잘리지 않고 완전히 보이는지 확인합니다.
4.  데스크톱 뷰로 전환하여 레이아웃이 깨지지 않았는지 확인합니다.
