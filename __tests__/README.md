# 테스트 전략 및 계획

## 🎯 테스트 목표
프로덕션 환경에서 안전하고 성능 최적화된 서버 컴포넌트 Prisma 직접 사용 검증

## 🚨 Critical Priority (즉시 필요)

### 1. 서버 컴포넌트 렌더링 테스트
- [ ] `/app/communities/page.tsx` 렌더링 및 데이터 검증
- [ ] `/app/communities/[id]/page.tsx` 커뮤니티 상세 페이지
- [ ] `/app/communities/[id]/posts/page.tsx` 게시글 목록
- [ ] `/app/communities/[id]/posts/[postId]/page.tsx` 게시글 상세
- [ ] `/app/main/posts/[id]/page.tsx` 메인 게시글 상세

### 2. 권한 및 보안 테스트
- [ ] 비공개 커뮤니티 접근 제한 (`PRIVATE` vs `PUBLIC`)
- [ ] 멤버십 상태별 접근 권한 (`ACTIVE`, `PENDING`, `BANNED`, `LEFT`)
- [ ] 게시글 상태별 조회 권한 (`PUBLISHED`, `DRAFT`, `DELETED`)
- [ ] 커뮤니티 소유자 권한 확인
- [ ] 로그인/비로그인 사용자 권한 분리

### 3. 데이터 일관성 테스트
- [ ] Prisma 쿼리 결과 타입 검증
- [ ] API 응답 형식과 서버 컴포넌트 데이터 호환성
- [ ] Date 객체 → ISO string 변환 검증
- [ ] null/undefined 처리 안전성

## 📋 High Priority (이번 주 내)

### 4. 성능 및 최적화 테스트
- [ ] **N+1 쿼리 방지 검증**:
  - 커뮤니티 목록 + 소유자 정보
  - 게시글 목록 + 작성자/카테고리/태그 정보
  - 댓글 목록 + 작성자 정보
- [ ] **쿼리 성능 벤치마크**:
  - 기존 API fetch vs 새로운 Prisma 직접 사용
  - 쿼리 실행 시간 측정
  - 메모리 사용량 비교
- [ ] **데이터베이스 인덱스 활용 확인**
- [ ] **페이지네이션 성능 테스트**

### 5. Redis 캐싱 테스트
- [ ] 조회수 증가 로직 (`incrementViewCount`)
- [ ] Redis 연결 실패 시 fallback 동작
- [ ] 캐시 일관성 검증
- [ ] 동시성 테스트 (여러 사용자가 동시 조회)

### 6. 에러 핸들링 테스트
- [ ] DB 연결 실패 시 graceful 처리
- [ ] 잘못된 ID/slug 입력 처리
- [ ] `notFound()` 호출 조건 검증
- [ ] Prisma 쿼리 에러 처리
- [ ] 타임아웃 처리

## 📊 Medium Priority (다음 주)

### 7. Integration 테스트
- [ ] 실제 데이터베이스와 연동 테스트
- [ ] Redis 실제 연결 테스트
- [ ] 세션 인증 통합 테스트

### 8. E2E 테스트
- [ ] 사용자 플로우 전체 테스트
- [ ] 페이지 간 이동 테스트
- [ ] 반응형 디자인 테스트

### 9. 성능 모니터링 테스트
- [ ] 메모리 누수 검사
- [ ] 장기간 실행 안정성
- [ ] 부하 테스트

## 🔧 테스트 환경 설정

### 필요한 도구들
- **Unit Testing**: Vitest (이미 설정됨)
- **DB Testing**: 테스트 데이터베이스 + Prisma
- **Redis Testing**: redis-memory-server 또는 테스트 Redis
- **Performance**: 벤치마크 도구
- **E2E**: Playwright (이미 설정됨)

### 테스트 데이터
- 모든 권한 시나리오를 커버하는 시드 데이터
- 성능 테스트를 위한 대용량 데이터
- Edge case 데이터 (null, 빈 문자열 등)

## 📝 테스트 실행 순서

1. **Unit Tests**: 개별 함수/컴포넌트 테스트
2. **Integration Tests**: DB + Redis 연동 테스트  
3. **Performance Tests**: 성능 및 최적화 검증
4. **E2E Tests**: 사용자 플로우 검증
5. **Load Tests**: 부하 및 안정성 테스트

## ✅ 성공 기준

- 모든 권한 시나리오에서 올바른 접근 제어
- N+1 쿼리 문제 0개
- 페이지 로딩 시간 < 1초 (로컬 DB)
- 메모리 누수 없음
- 에러 발생 시 적절한 fallback