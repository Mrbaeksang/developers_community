# API 문서 (API Documentation)

## 📌 API 개요
- **총 API 수**: 62개
- **구현 완료**: 55개 (88.7%)
- **미구현**: 7개 (11.3%)
- **UI 미연결**: 20개 (32.3%)

## 🚨 미구현 API (Not Implemented)

### 1. 전역 사용자 관리
- `POST /api/users/[id]/ban` - 전역 Ban (ADMIN 전용)
- `DELETE /api/users/[id]/ban` - 전역 Ban 해제 (ADMIN 전용)
- `PUT /api/users/[id]/role` - 사용자 역할 변경 (ADMIN 전용)

### 2. 커뮤니티 고급 관리
- `PUT /api/communities/[id]/settings` - 커뮤니티 설정 변경 (ADMIN/OWNER)
- `POST /api/communities/[id]/transfer-ownership` - 소유권 이전 (OWNER 전용)

### 3. 메인 사이트 카테고리 관리
- `PUT /api/main/categories/[id]` - 카테고리 수정 (ADMIN 전용)
- `DELETE /api/main/categories/[id]` - 카테고리 삭제 (ADMIN 전용)

## ⚠️ 구현되었지만 미연결 API (Implemented but Not Connected)

### 1. 커뮤니티 멤버 관리
- ✅ `POST /api/communities/[id]/members/approve` - 멤버 가입 승인
  - **용도**: PRIVATE 커뮤니티 가입 승인
  - **권한**: ADMIN, OWNER
  - **상태**: API 구현 완료, 프론트엔드 미연결

- ✅ `POST /api/communities/[id]/members/[userId]/ban` - 멤버 Ban
  - **용도**: 커뮤니티에서 특정 멤버 차단
  - **권한**: 계층적 권한 (상위 역할만 가능)
  - **상태**: API 구현 완료, 프론트엔드 미연결

- ✅ `PUT /api/communities/[id]/members/[userId]` - 멤버 역할 변경
  - **용도**: 커뮤니티 내 역할 변경
  - **권한**: 계층적 권한
  - **상태**: API 구현 완료, 프론트엔드 미연결

### 2. 게시글 관리
- ✅ `POST /api/main/posts/[id]/approve` - 게시글 승인
  - **용도**: PENDING 게시글 승인/거부
  - **권한**: MANAGER, ADMIN
  - **상태**: API 구현 완료, admin 페이지에서만 사용 중

### 3. 알림 시스템
- ✅ `GET /api/notifications` - 알림 목록
- ✅ `PUT /api/notifications/[id]/read` - 알림 읽음 처리
- ✅ `PUT /api/notifications/read-all` - 모든 알림 읽음
- ✅ `GET /api/notifications/sse` - 실시간 알림 (SSE)
  - **상태**: API 구현 완료, 프론트엔드 미연결

### 4. 파일 업로드
- ✅ `POST /api/files/upload` - 파일 업로드
  - **상태**: API 구현 완료, 부분적으로 사용 중

### 5. 사용자 관련
- ✅ `GET /api/users/bookmarks` - 북마크 목록
- ✅ `GET /api/users/me` - 내 정보
- ✅ `GET /api/users/stats` - 사용자 통계
  - **상태**: API 구현 완료, 프론트엔드 미연결

### 6. 커뮤니티 공지사항
- ✅ `GET /api/communities/[id]/announcements` - 공지사항 목록
- ✅ `POST /api/communities/[id]/announcements` - 공지사항 작성
- ✅ `PUT /api/communities/[id]/announcements/[announcementId]` - 공지사항 수정
- ✅ `DELETE /api/communities/[id]/announcements/[announcementId]` - 공지사항 삭제
  - **상태**: API 구현 완료, 프론트엔드 미연결

## ✅ 구현 및 연결 완료 API (Fully Implemented and Connected)

### 1. 인증
- `POST /api/auth/[...nextauth]` - NextAuth 인증

### 2. 메인 사이트
- `GET /api/main/posts` - 게시글 목록
- `GET /api/main/posts/[id]` - 게시글 상세
- `PUT /api/main/posts/[id]` - 게시글 수정
- `DELETE /api/main/posts/[id]` - 게시글 삭제
- `GET /api/main/categories` - 카테고리 목록
- `GET /api/main/tags` - 태그 목록
- `POST /api/main/tags` - 태그 생성
- `GET /api/main/stats` - 통계
- `GET /api/main/users/active` - 활성 사용자

### 3. 커뮤니티
- `GET /api/communities` - 커뮤니티 목록
- `POST /api/communities` - 커뮤니티 생성
- `GET /api/communities/[id]` - 커뮤니티 상세
- `POST /api/communities/[id]/join` - 커뮤니티 가입
- `GET /api/communities/[id]/posts` - 커뮤니티 게시글
- `POST /api/communities/[id]/posts` - 게시글 작성

### 4. 상호작용
- `POST /api/main/posts/[id]/like` - 좋아요
- `POST /api/main/posts/[id]/bookmark` - 북마크
- `GET /api/main/posts/[id]/comments` - 댓글 목록
- `POST /api/main/posts/[id]/comments` - 댓글 작성

### 5. 업로드
- `POST /api/upload` - 이미지 업로드 (커뮤니티용)

### 6. 검색
- `GET /api/search` - 통합 검색
- `GET /api/main/posts/search` - 게시글 검색

### 7. 관리자
- `GET /api/admin/stats` - 관리자 통계
- `GET /api/admin/data-viewer/[table]` - 데이터베이스 뷰어

## 🎯 UI 연결 계획 (UI Integration Plan)

### 1. 커뮤니티 멤버 관리
- **멤버 승인**: `/communities/[id]/admin/members` 페이지 생성
  - 대기 중인 가입 신청 목록
  - 승인/거부 버튼
- **멤버 Ban**: `/communities/[id]/members` 페이지에 드롭다운 메뉴 추가
- **역할 변경**: 멤버 관리 페이지에서 인라인 편집

### 2. 알림 시스템
- **헤더**: 알림 벨 아이콘 추가 (NotificationBell.tsx)
- **전용 페이지**: `/notifications` 생성
- **실시간**: SSE 연결로 토스트 알림

### 3. 사용자 관련
- **북마크**: `/my/bookmarks` 페이지 생성
- **대시보드**: `/my/dashboard` 통계 페이지
- **프로필**: `/my/profile` 설정 페이지

### 4. 공지사항
- **커뮤니티 메인**: 상단 공지 섹션 추가
- **전용 페이지**: `/communities/[id]/announcements`

### 5. 관리자 페이지
- **전역 사용자**: `/admin/users`
- **카테고리**: `/admin/categories`
- **커뮤니티 설정**: `/communities/[id]/settings`

## 📋 우선순위 개발 계획

### Phase 1: 핵심 API 구현 (1주차)
1. 전역 Ban API 구현
2. 사용자 역할 변경 API 구현
3. 알림 시스템 UI 전체 연결

### Phase 2: 멤버 관리 (2주차)
1. 커뮤니티 멤버 승인/거부 UI
2. 커뮤니티 멤버 Ban UI
3. 멤버 역할 변경 UI

### Phase 3: 사용자 경험 (3주차)
1. 북마크 페이지
2. 사용자 대시보드
3. 공지사항 시스템

### Phase 4: 고급 기능 (4주차)
1. 커뮤니티 설정 페이지
2. 소유권 이전 기능
3. 카테고리 관리 시스템

## 📊 성공 지표
- 관리 작업 완료 시간 50% 감소
- 알림 확인율 80% 이상
- 모바일 사용자 만족도 4.5/5
- 권한 관련 문의 70% 감소