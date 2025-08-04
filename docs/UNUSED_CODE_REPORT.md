# 프로젝트 코드 사용 현황 분석 보고서

## 1. lib/ 폴더 분석

### api-response.ts
- Export: `ApiResponse`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/errors/route.ts:15, app/api/test/route.ts:22
- Export: `successResponse`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/auth/[...nextauth]/route.ts:45
- Export: `errorResponse`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/auth/[...nextauth]/route.ts:52
- Export: `validationErrorResponse`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

### auth-utils.ts
- Export: `getSession`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/test/route.ts:10, app/auth/signin/page.tsx:15
- Export: `requireAuthAPI`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/admin/route.ts:18
- Export: `hasCommunityPermission`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

### chat-utils.ts
- Export: `uploadChatFile`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/chat/FloatingChatWindow.tsx:89
- Export: `isImageFile`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/chat/FloatingChatWindow.tsx:102
- Export: `getMessageType`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

### community-utils.ts
- Export: `DEFAULT_AVATARS`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/communities/route.ts:45
- Export: `getAvatarUrl`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/communities/CommunityActions.tsx:32
- Export: `getAvatarFromName`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

### validation-schemas.ts
- Export: `idSchema`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/communities/[id]/route.ts:28
- Export: `createPostSchema`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/posts/route.ts:56
- Export: `validateRequestBody`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/upload/route.ts:22
- Export: `sanitizeSqlInput`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

## 2. components/ 폴더 분석

### NotificationDropdown.tsx
- Export: `NotificationDropdown`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/layouts/Header.tsx:45

### FloatingChatButton.tsx
- Export: `FloatingChatButton`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/layout.tsx:32

### CommunityPostEditor.tsx
- Export: `CommunityPostEditor`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

### ErrorBoundaryTest.tsx
- Export: `ErrorBoundaryTest`
  - 사용 여부: ❌ 미사용
  - 조치: 삭제 권장

## 3. Zustand 스토어 분석

### useNotificationStore.ts
- 상태: `notifications`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/notifications/NotificationDropdown.tsx:15
- 액션: `addNotification`
  - 사용 여부: ✅ 사용중  
  - 사용처: hooks/use-notifications.ts:28

### useUIStore.ts
- 상태: `sidebarOpen`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/layouts/MainLayout.tsx:23
- 액션: `toggleSidebar`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/layouts/Header.tsx:38

### useUserStore.ts
- 상태: `currentUser`
  - 사용 여부: ✅ 사용중  
  - 사용처: components/shared/AuthorAvatar.tsx:12
- 액션: `setUser`
  - 사용 여부: ✅ 사용중  
  - 사용처: app/api/auth/[...nextauth]/route.ts:78

## 4. 중복 코드 패턴

1. **날짜 포맷팅 유틸리티 중복**
   - `lib/date-utils.ts`와 `lib/utils.ts` 모두 날짜 포맷팅 함수 포함
   - 조치: `lib/utils.ts`의 날짜 함수 삭제하고 `lib/date-utils.ts`로 통일

2. **에러 응답 생성 로직 중복**
   - `lib/api-response.ts`의 `errorResponse`와 `auth-utils.ts`의 `authResponses` 유사 기능
   - 조치: `authResponses` 삭제하고 `errorResponse`로 통일

## 5. import 분석

1. **미사용 import**
   - `components/CommunityPostEditor.tsx`에서 `useState` import 후 미사용
   - `lib/validation-schemas.ts`에서 `escapeHtml` import 후 미사용

2. **순환 참조**
   - `lib/auth-utils.ts`와 `lib/permission-helpers.ts` 상호 참조 발견
   - 조치: 권한 검사 로직 `permission-helpers.ts`로 이동 후 종속성 제거

3. **경로 일관성**
   - 절대경로(`@/components`)와 상대경로(`../components`) 혼용
   - 조치: 프로젝트 전체에 절대경로 사용으로 통일

## 종합 개선 권장사항

1. 미사용 코드 삭제: 사용되지 않는 8개 함수/컴포넌트 삭제
2. 중복 코드 통합: 날짜 유틸리티 및 에러 응답 생성 로직 통합
3. 순환 참조 해결: 권한 검사 로직 리팩토링
4. import 정리: 미사용 import 제거 및 경로 통일
5. 유효성 검사: `sanitizeSqlInput` 대신 ORM 수준에서 SQL Injection 방지 구현
