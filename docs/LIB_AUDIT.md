# lib 폴더 구조 분석 및 개선 방안

## 현재 구조 분석

### 1. 발견된 중복

#### 1.1 Auth 관련 중복
- **문제**: `auth-helpers.ts`와 `auth-utils.ts`에 동일한 에러 클래스 중복
  - `AuthError`, `ForbiddenError` 클래스가 양쪽에 정의됨
  - `unauthorized()`, `forbidden()` 함수도 중복
- **현황**: 모든 파일이 `auth-utils.ts`만 사용 중 (auth-helpers.ts는 사용되지 않음)
- **해결방안**: `auth-helpers.ts` 삭제

#### 1.2 API Response 타입 중복
- **문제**: `ApiResponse<T>` 인터페이스가 중복 정의됨
  - `lib/api-response.ts`: API 응답 헬퍼와 함께 정의
  - `lib/types.ts`: 다른 타입들과 함께 정의
- **현황**: `api.ts`는 `types.ts`의 것을 사용
- **해결방안**: `types.ts`의 ApiResponse를 제거하고 `api-response.ts` 것으로 통일

### 2. 파일 분류 및 구조

#### 2.1 인증/권한 관련 (Auth)
- `auth-utils.ts` ✅ (메인 인증 유틸리티)
- `auth-helpers.ts` ❌ (중복, 삭제 필요)
- `permission-helpers.ts` ✅ (권한 체크 헬퍼)
- `role-hierarchy.ts` ✅ (역할 계층 관리)

#### 2.2 API 관련
- `api.ts` ✅ (API 클라이언트)
- `api-response.ts` ✅ (API 응답 헬퍼)
- `error-handler.ts` ✅ (에러 처리)
- `csrf.ts` ✅ (CSRF 보호)
- `rate-limiter.ts` ✅ (속도 제한)

#### 2.3 데이터베이스/캐시
- `prisma.ts` ✅ (Prisma 클라이언트)
- `redis.ts` ✅ (Redis 클라이언트)
- `redis-sync.ts` ✅ (Redis 동기화)

#### 2.4 유틸리티
- `utils.ts` ✅ (공통 유틸리티 - cn 함수)
- `date-utils.ts` ✅ (날짜 포맷팅)
- `color-utils.ts` ✅ (색상 유틸리티)
- `markdown.ts` ✅ (마크다운 처리)
- `debounce.ts` ✅ (디바운스 함수)

#### 2.5 검증 (Validation)
- `validation-schemas.ts` ✅ (Zod 스키마 및 검증 헬퍼)

#### 2.6 커뮤니티 관련
- `community-utils.ts` ✅ (커뮤니티 유틸리티)
- `post-format-utils.ts` ✅ (게시글 포맷팅)
- `banner-utils.ts` ✅ (배너 관리)

#### 2.7 채팅/알림
- `chat-utils.ts` ✅ (채팅 유틸리티)
- `chat-broadcast.ts` ✅ (채팅 브로드캐스트)
- `notifications.ts` ✅ (알림 처리)
- `notification-emitter.ts` ✅ (알림 이벤트)

#### 2.8 외부 서비스
- `unsplash-utils.ts` ✅ (Unsplash API)

#### 2.9 타입 정의
- `types.ts` ⚠️ (ApiResponse 중복 제거 필요)

#### 2.10 상태 관리 (stores/)
- `stores/index.ts` ✅
- `stores/useNotificationStore.ts` ✅
- `stores/useUIStore.ts` ✅
- `stores/useUserStore.ts` ✅

### 3. 개선 방안

#### 3.1 즉시 개선 사항
1. **auth-helpers.ts 삭제**
   - 사용되지 않는 파일이며 auth-utils.ts와 완전 중복

2. **ApiResponse 타입 통일**
   - types.ts의 ApiResponse 제거
   - api.ts가 api-response.ts를 import하도록 수정

#### 3.2 폴더 구조 개선 제안
```
lib/
├── auth/               # 인증/권한 관련
│   ├── auth-utils.ts
│   ├── permission-helpers.ts
│   └── role-hierarchy.ts
├── api/                # API 관련
│   ├── client.ts       (현재 api.ts)
│   ├── response.ts     (현재 api-response.ts)
│   ├── error-handler.ts
│   ├── csrf.ts
│   └── rate-limiter.ts
├── db/                 # 데이터베이스/캐시
│   ├── prisma.ts
│   ├── redis.ts
│   └── redis-sync.ts
├── validation/         # 검증
│   └── schemas.ts      (현재 validation-schemas.ts)
├── features/           # 기능별 유틸리티
│   ├── community/
│   │   ├── utils.ts
│   │   ├── post-format.ts
│   │   └── banner.ts
│   ├── chat/
│   │   ├── utils.ts
│   │   └── broadcast.ts
│   └── notifications/
│       ├── index.ts
│       └── emitter.ts
├── utils/              # 공통 유틸리티
│   ├── common.ts       (현재 utils.ts)
│   ├── date.ts
│   ├── color.ts
│   ├── markdown.ts
│   └── debounce.ts
├── external/           # 외부 서비스
│   └── unsplash.ts
├── stores/             # 상태 관리 (현재 구조 유지)
└── types.ts            # 공통 타입 정의
```

#### 3.3 장점
1. **명확한 분류**: 기능별로 명확히 구분되어 찾기 쉬움
2. **중복 제거**: 중복된 코드 제거로 유지보수 용이
3. **확장성**: 새로운 기능 추가 시 적절한 위치가 명확함
4. **의존성 관리**: 관련 파일들이 함께 있어 의존성 파악 용이

### 4. 실행 계획

1. **Phase 1: 중복 제거** (즉시)
   - auth-helpers.ts 삭제
   - types.ts의 ApiResponse 제거 및 import 수정

2. **Phase 2: 폴더 구조 개선** (선택적)
   - 새 폴더 구조 생성
   - 파일 이동 및 import 경로 업데이트
   - 테스트 및 검증

### 5. 현재 상태 요약
- **총 파일 수**: 30개
- **중복 파일**: 1개 (auth-helpers.ts)
- **부분 중복**: 1개 (types.ts의 ApiResponse)
- **잘 구성된 파일**: 28개
- **개선 필요도**: 낮음 (현재도 잘 동작하지만 구조 개선으로 더 나아질 수 있음)