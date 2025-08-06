# 🛠️ Utility 파일 구조화 계획

## 📋 현재 상태 분석

### 현재 lib 폴더 구조
- **총 33개 TypeScript 파일**
- **평면적 구조**: 모든 파일이 lib/ 루트에 위치 (db/ 제외)
- **중복과 산재**: 유사 기능이 여러 파일에 분산

### 파일별 역할 분석

#### 🔐 인증/권한 (4개)
- `auth-utils.ts` - 세션 검증, 사용자 인증
- `permission-helpers.ts` - 권한 체크 헬퍼
- `role-hierarchy.ts` - 역할 계층 관리
- `csrf.ts` - CSRF 토큰 관리

#### 🗄️ 데이터베이스/캐싱 (6개)
- `prisma.ts` - Prisma 클라이언트
- `prisma-select-patterns.ts` - Prisma select 패턴
- `redis.ts` - Redis 클라이언트
- `redis-cache.ts` - Redis 캐싱 유틸
- `redis-sync.ts` - Redis 동기화
- `db/query-cache.ts` - 쿼리 캐싱

#### 🌐 API 관련 (5개)
- `api.ts` - API 클라이언트
- `api-response.ts` - API 응답 포맷
- `api-monitoring.ts` - API 모니터링
- `rate-limiter.ts` - Rate limiting
- `validation-schemas.ts` - Zod 스키마

#### 💬 채팅/알림 (4개)
- `chat-utils.ts` - 채팅 유틸리티
- `chat-broadcast.ts` - 채팅 브로드캐스트
- `notifications.ts` - 알림 관리
- `notification-emitter.ts` - 알림 이벤트

#### 🎨 UI/표시 (6개)
- `color-utils.ts` - 색상 계산 (hexToRgb, getTextColor 등)
- `banner-utils.ts` - 배너 관리
- `image-utils.ts` - 이미지 처리
- `unsplash-utils.ts` - Unsplash API
- `markdown.ts` - 마크다운 렌더링
- `date-utils.ts` - 날짜 포맷팅

#### 📝 게시글 관련 (3개)
- `common-types.ts` - 공통 타입 정의 + 색상 함수 중복
- `common-viewcount-utils.ts` - 조회수 관리
- `pagination-utils.ts` - 페이지네이션

#### 👥 커뮤니티 (1개)
- `community-utils.ts` - 커뮤니티 헬퍼

#### 🔧 유틸리티 (4개)
- `utils.ts` - cn() 함수 (tailwind merge)
- `debounce.ts` - 디바운스 함수
- `error-handler.ts` - 에러 처리
- `monitoring.ts` - 모니터링

## 🚨 문제점

### 1. 중복 코드
- **색상 함수**: `color-utils.ts`와 `common-types.ts`에 중복
- **캐싱 로직**: `redis-cache.ts`, `query-cache.ts`에 분산
- **모니터링**: `monitoring.ts`, `api-monitoring.ts` 분리

### 2. 일관성 없는 네이밍
- `common-*` 접두사 남용
- `utils` vs `helpers` 혼재
- 단수/복수 혼재

### 3. 게시글 관련 함수 부재
- PostCard.tsx의 `getCategoryIcon()` 함수가 유틸에 없음
- 읽기 시간 계산 로직이 컴포넌트에만 있음
- 동적 텍스트 색상 로직이 여러 곳에 산재

## 📁 제안하는 새 구조

```
lib/
├── core/                    # 핵심 기능
│   ├── prisma.ts           # Prisma 클라이언트
│   ├── redis.ts            # Redis 클라이언트
│   └── utils.ts            # cn() 등 기본 유틸
│
├── auth/                    # 인증/권한
│   ├── session.ts          # auth-utils.ts 내용
│   ├── permissions.ts      # permission-helpers.ts
│   ├── roles.ts            # role-hierarchy.ts
│   └── csrf.ts             # csrf.ts
│
├── api/                     # API 관련
│   ├── client.ts           # api.ts
│   ├── response.ts         # api-response.ts
│   ├── monitoring.ts       # api-monitoring.ts + monitoring.ts 통합
│   ├── rate-limit.ts       # rate-limiter.ts
│   └── validation.ts       # validation-schemas.ts
│
├── cache/                   # 캐싱 전략
│   ├── redis.ts            # redis-cache.ts + redis-sync.ts 통합
│   ├── query.ts            # query-cache.ts
│   └── patterns.ts         # prisma-select-patterns.ts
│
├── post/                    # 게시글 관련 ⭐ 새로 추가
│   ├── display.ts          # getCategoryIcon, calculateReadingTime
│   ├── viewcount.ts        # common-viewcount-utils.ts
│   ├── pagination.ts       # pagination-utils.ts
│   └── types.ts            # 게시글 관련 타입
│
├── ui/                      # UI/표시
│   ├── colors.ts           # color-utils.ts + common-types.ts 색상 함수 통합
│   ├── images.ts           # image-utils.ts + unsplash-utils.ts 통합
│   ├── markdown.ts         # markdown.ts
│   ├── date.ts             # date-utils.ts
│   └── banner.ts           # banner-utils.ts
│
├── chat/                    # 채팅
│   ├── utils.ts            # chat-utils.ts
│   └── broadcast.ts        # chat-broadcast.ts
│
├── notifications/           # 알림
│   ├── index.ts            # notifications.ts
│   └── emitter.ts          # notification-emitter.ts
│
├── community/               # 커뮤니티
│   └── utils.ts            # community-utils.ts
│
└── common/                  # 공용
    ├── types.ts            # common-types.ts (색상 함수 제외)
    ├── errors.ts           # error-handler.ts
    └── debounce.ts         # debounce.ts
```

## 🎯 핵심 작업: post/display.ts 생성

```typescript
// lib/post/display.ts
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// PostCard.tsx에서 가져올 함수
export function getCategoryIcon(
  iconName: string | null | undefined,
  categoryName: string
): LucideIcon | undefined {
  // 아이콘 매핑 로직
}

export function calculateReadingTime(
  content: string,
  language?: string
): number {
  // 읽기 시간 계산 로직
}

export function getContrastTextColor(
  backgroundColor: string
): string {
  // color-utils.ts의 getTextColor 사용
}
```

## 🔄 마이그레이션 전략

### Phase 1: 새 구조 생성 (중단 없이)
1. 새 폴더 구조 생성
2. 기존 파일 내용을 새 위치로 복사
3. 새 파일에서 기존 파일 re-export

### Phase 2: 점진적 이동
1. 새로운 기능은 새 구조 사용
2. 리팩토링 시 import 경로 변경
3. 테스트 후 기존 파일 제거

### Phase 3: 정리
1. 사용하지 않는 파일 제거
2. import 경로 일괄 변경
3. 문서 업데이트

## 📊 예상 효과

### Before
- 33개 파일 평면 구조
- 중복 코드 다수
- 찾기 어려운 함수들

### After
- 9개 도메인 폴더로 구조화
- 중복 제거 (약 20% 코드 감소)
- 명확한 도메인별 분리
- 쉬운 탐색과 유지보수

## ⚠️ 주의사항

1. **import 경로 변경**: 모든 컴포넌트의 import 수정 필요
2. **순환 참조 방지**: 도메인 간 의존성 최소화
3. **타입 정의 위치**: 각 도메인별 types.ts 파일
4. **테스트 필수**: 각 단계마다 빌드 확인

## 🚀 우선순위

1. **긴급**: `post/display.ts` 생성 - CategoryBadge 버그 수정
2. **높음**: 색상 함수 통합 - 중복 제거
3. **중간**: API/캐싱 통합 - 성능 개선
4. **낮음**: 나머지 도메인 정리
