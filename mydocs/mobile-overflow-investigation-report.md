# 모바일 뷰포트 Overflow 문제 최종 분석 보고서

## 1. 문제 현상

390px 모바일 뷰포트에서 게시글 상세 페이지(`/main/posts/[id]`)의 컴포넌트 우측 border와 shadow가 잘려 보이는 현상.

## 2. 조사 과정

1.  **`app/main/posts/[id]/page.tsx` 분석:**
    -   페이지 최상단에 `overflow-x-hidden` 속성이 적용된 `div`를 확인. 이로 인해 내부 요소가 화면을 벗어나면 잘리게 됨.
    -   콘텐츠를 감싸는 `div`에 `px-4` (좌우 패딩)가 적용되어 있어, 실제 콘텐츠 영역은 화면보다 작게 제한됨.

2.  **`components/posts/UnifiedPostDetail.tsx` 분석:**
    -   해당 컴포넌트는 너비가 고정되어 있지 않고, 부모 요소의 너비를 상속받는 일반적인 블록 요소임.
    -   이 컴포넌트 자체는 overflow의 직접적인 원인이 아님을 확인.

3.  **`components/posts/MobileRelatedSection.tsx` 분석:**
    -   **문제의 핵심 원인으로 파악.**
    -   이 컴포넌트는 내부에 '주간 인기 게시글', '관련 게시글' 등 **가로 스크롤** 영역을 다수 포함하고 있음.
    -   각 스크롤 영역은 `overflow-x-auto`와 `flex`로 구현되어 있으며, 내부 콘텐츠(카드 목록)의 총 너비는 화면 너비보다 훨씬 큼.

## 3. 최종 원인

`UnifiedPostDetail` 컴포넌트 내부에 있는 `MobileRelatedSection`이 문제의 근원입니다.

-   `MobileRelatedSection`의 가로 스크롤 콘텐츠는 자신의 실제 너비(화면보다 훨씬 넓은)를 부모에게 알리려는 경향이 있습니다.
-   부모인 `UnifiedPostDetail`은 명시적인 너비가 없으므로, 자식인 `MobileRelatedSection`이 필요로 하는 만큼 너비를 확장하려고 시도합니다.
-   결과적으로 `UnifiedPostDetail` 컴포넌트가 비대해져 `page.tsx`에 설정된 `px-4` 패딩 영역을 침범하고 화면 밖으로 밀려납니다.
-   이때 `page.tsx`의 최상위 `div`에 적용된 `overflow-x-hidden`이 밀려난 부분을 잘라내면서, 사용자가 보는 것처럼 border와 shadow가 잘리는 현상이 나타납니다.

## 4. 제안되었던 해결책 (오류로 인해 원복)

이러한 '자식'이 '부모'의 크기를 멋대로 늘리는 것을 막기 위해, 부모인 `UnifiedPostDetail` 컴포넌트에 `overflow-x-hidden` 속성을 추가하는 해결책을 시도했습니다.

-   **수정 대상 파일:** `components/posts/UnifiedPostDetail.tsx`
-   **변경 내용:** 최상위 `div`의 className에 `overflow-x-hidden` 추가
    -   `<div className="space-y-6">` -> `<div className="space-y-6 overflow-x-hidden">`

이 방법은 `MobileRelatedSection`이 부모의 경계를 넘어 확장되는 것을 막아 문제를 해결할 수 있는 가장 직접적인 방법입니다.

## 5. 참고: 발생한 에러

상기 해결책을 적용한 후, 직접적인 연관이 없는 `components/home/PostList.tsx` 파일에서 파싱 에러가 발생하여 변경 사항을 원복했습니다. 이는 빌드 캐시 문제이거나 다른 잠재적 이슈일 수 있으므로, 근본적인 overflow 문제 해결과는 별개로 확인이 필요할 수 있습니다.
