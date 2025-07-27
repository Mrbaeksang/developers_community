# 개발자 커뮤니티 플랫폼 - API 명세서

> 최종 업데이트: 2025년 1월 27일

## 📊 API 및 페이지 현황

### 전체 시스템: 38개 (API 30개 + 페이지 8개)
- ✅ 구현 완료: 13개 (34.2%)
- 🚧 구현 중: 0개 
- ❌ 미구현: 25개 (65.8%)

## 🎯 구현 현황

### ✅ 완료된 기능

#### 인증 시스템 (OAuth)
- ✅ **NextAuth.js v5 설정 완료** (`/auth.ts`)
  - GitHub OAuth 프로바이더 설정
  - Google OAuth 프로바이더 설정
  - Kakao OAuth 프로바이더 설정 (REST API 키 사용)
  - Prisma Adapter 연동
  - 세션 관리 구현

- ✅ **로그인 페이지** (`/app/(auth)/signin/page.tsx`)
  - 소셜 로그인 버튼 UI
  - OAuth 프로바이더 연동
  - Next.js 15 searchParams Promise 타입 대응

- ✅ **인증 API 라우트** (`/app/api/auth/[...nextauth]/route.ts`)
  - NextAuth.js 핸들러 설정
  - OAuth 콜백 처리

#### 데이터베이스 구조
- ✅ **Prisma 스키마 정의** (`/prisma/schema.prisma`)
  - 사용자 모델 (User, Account, Session)
  - 메인 사이트 모델 (MainPost, MainCategory, MainTag)
  - 커뮤니티 모델 (Community, CommunityPost, CommunityComment)
  - 채팅 모델 (ChatRoom, ChatMessage)
  - 파일 및 알림 시스템

- ✅ **데이터베이스 마이그레이션**
  - 초기 마이그레이션 완료
  - 시드 데이터 구성

#### 기본 페이지
- ✅ **메인 페이지** (`/app/page.tsx`)
  - 인증 상태 표시
  - 로그인/로그아웃 버튼
  - 기본 레이아웃 구성

### 🚧 구현 중인 기능
- 없음

### ❌ 미구현 기능

#### 메인 사이트 API (11개)
- ❌ GET `/api/main/posts` - 메인 게시글 목록
- ❌ POST `/api/main/posts` - 메인 게시글 작성
- ❌ GET `/api/main/posts/[id]` - 메인 게시글 상세
- ❌ PUT `/api/main/posts/[id]` - 메인 게시글 수정
- ❌ DELETE `/api/main/posts/[id]` - 메인 게시글 삭제
- ❌ POST `/api/main/posts/[id]/approve` - 게시글 승인
- ❌ GET `/api/main/categories` - 카테고리 목록
- ❌ GET `/api/main/tags` - 태그 목록
- ❌ GET `/api/main/tags/[id]/posts` - 태그별 게시글
- ❌ POST `/api/main/posts/[id]/comments` - 댓글 작성
- ❌ DELETE `/api/main/comments/[id]` - 댓글 삭제

#### 커뮤니티 API (10개)
- ❌ GET `/api/communities` - 커뮤니티 목록
- ❌ POST `/api/communities` - 커뮤니티 생성
- ❌ GET `/api/communities/[id]` - 커뮤니티 상세
- ❌ POST `/api/communities/[id]/join` - 커뮤니티 가입
- ❌ DELETE `/api/communities/[id]/leave` - 커뮤니티 탈퇴
- ❌ GET `/api/communities/[id]/posts` - 커뮤니티 게시글
- ❌ POST `/api/communities/[id]/posts` - 커뮤니티 게시글 작성
- ❌ PUT `/api/community-posts/[id]` - 커뮤니티 게시글 수정
- ❌ DELETE `/api/community-posts/[id]` - 커뮤니티 게시글 삭제
- ❌ POST `/api/community-posts/[id]/comments` - 커뮤니티 댓글

#### 채팅 API (4개)
- ❌ GET `/api/chat/rooms` - 채팅방 목록
- ❌ POST `/api/chat/rooms` - 채팅방 생성
- ❌ GET `/api/chat/rooms/[id]/messages` - 메시지 조회
- ❌ POST `/api/chat/rooms/[id]/messages` - 메시지 전송

#### 페이지 (5개)
- ❌ `/dashboard` - 대시보드 페이지
- ❌ `/main/posts` - 메인 게시글 목록 페이지
- ❌ `/main/posts/[id]` - 메인 게시글 상세 페이지
- ❌ `/communities` - 커뮤니티 목록 페이지
- ❌ `/communities/[id]` - 커뮤니티 상세 페이지

## 🔄 최근 업데이트

### 2025년 1월 27일
- ✅ OAuth 인증 시스템 구현 완료
  - GitHub, Google, Kakao 프로바이더 설정
  - 로그인 페이지 구현
  - 세션 관리 구현
- ✅ 데이터베이스 스키마 정의 및 마이그레이션
- ✅ Next.js 15 searchParams Promise 타입 수정
- ✅ Git 히스토리 정리 및 시크릿 제거

## 📝 다음 단계

1. **메인 사이트 API 구현**
   - 게시글 CRUD API
   - 카테고리 및 태그 시스템
   - 댓글 기능

2. **페이지 구현**
   - 대시보드 페이지
   - 메인 게시글 목록/상세 페이지
   - 커뮤니티 페이지

3. **권한 시스템**
   - 역할 기반 접근 제어
   - 매니저 승인 시스템
   - 커뮤니티 권한 관리