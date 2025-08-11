# 프로덕션 배포 체크리스트

## 🚀 자동 검사 실행

```bash
# 프로덕션 배포 전 자동 검사
npx tsx scripts/check-production-ready.ts

# package.json에 스크립트 추가
"scripts": {
  "check:production": "tsx scripts/check-production-ready.ts",
  "verify": "npm run lint && npm run type-check && npm run check:production"
}
```

## 📋 수동 체크리스트

### 1. 코드 품질
- [ ] `npm run type-check` - TypeScript 오류 없음
- [ ] `npm run lint` - ESLint 오류 없음  
- [ ] `npm run format:check` - Prettier 포맷팅 완료
- [ ] `console.log` 제거 (console.error/warn만 허용)

### 2. API 라우트 최적화
- [ ] API 라우트에서 `fetch()` 사용 금지 → Prisma 직접 사용
- [ ] 서버 컴포넌트에서 `/api/*` 호출 금지 → Prisma 직접 사용
- [ ] `getApiUrl()` 사용 최소화

### 3. 데이터베이스
- [ ] 모든 마이그레이션 적용 완료
- [ ] Prisma 스키마와 DB 동기화
- [ ] 인덱스 최적화 확인
- [ ] 초기 데이터 시딩 완료

### 4. 환경 변수
- [ ] `.env.production` 모든 변수 설정
- [ ] NEXTAUTH_URL이 프로덕션 URL (https://)
- [ ] 모든 OAuth 콜백 URL 업데이트
- [ ] API 키 및 시크릿 설정

### 5. 보안
- [ ] Rate Limiting 활성화
- [ ] CSRF 보호 활성화
- [ ] XSS 방어 확인
- [ ] SQL Injection 방어 (Prisma 사용)
- [ ] 민감한 정보 노출 제거

### 6. 성능 최적화
- [ ] 이미지 최적화 (Next/Image 사용)
- [ ] 번들 크기 확인 (`npm run analyze`)
- [ ] 불필요한 의존성 제거
- [ ] React.memo 및 useMemo 적용
- [ ] 레이지 로딩 구현

### 7. 에러 처리
- [ ] 404 페이지 구현
- [ ] 500 에러 페이지 구현
- [ ] API 에러 응답 통일
- [ ] 사용자 친화적 에러 메시지

### 8. 테스트
- [ ] 주요 사용자 시나리오 테스트
- [ ] 모바일 반응형 테스트
- [ ] 크로스 브라우저 테스트
- [ ] API 엔드포인트 테스트

## 🔍 일반적인 프로덕션 이슈와 해결법

### 문제 1: API 라우트가 프로덕션에서 작동 안 함
**원인**: API 라우트에서 `fetch('/api/...')` 사용
**해결**: 
```typescript
// ❌ 잘못된 방법
const res = await fetch('/api/communities')

// ✅ 올바른 방법 (서버 컴포넌트)
import { prisma } from '@/lib/core/prisma'
const communities = await prisma.community.findMany()
```

### 문제 2: 환경 변수 인식 안 됨
**원인**: Vercel/프로덕션 환경 변수 미설정
**해결**: Vercel 대시보드에서 환경 변수 설정

### 문제 3: OAuth 로그인 실패
**원인**: 콜백 URL 불일치
**해결**: OAuth 제공자 설정에서 프로덕션 URL 추가

### 문제 4: 이미지 로드 실패
**원인**: next.config.js 이미지 도메인 미설정
**해결**:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'your-blob-domain.com' }
  ]
}
```

### 문제 5: 빌드 실패
**원인**: TypeScript 오류 또는 import 오류
**해결**: `npm run type-check` 및 `npm run build` 로컬 테스트

## 📊 모니터링

### 배포 후 확인사항
1. **Vercel Analytics** - 성능 메트릭 확인
2. **Error Tracking** - Sentry 또는 로그 확인
3. **Database** - 연결 풀 및 쿼리 성능
4. **API Response** - 응답 시간 모니터링
5. **User Feedback** - 실제 사용자 피드백

## 🛠️ 빠른 수정 스크립트

```bash
# 모든 console.log 찾기
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ components/ lib/

# API fetch 사용 찾기  
grep -r "fetch.*\/api\/" --include="*.ts" --include="*.tsx" app/

# 타입 체크 및 빌드
npm run type-check && npm run build

# 프로덕션 빌드 테스트
npm run build && npm run start
```

## 📝 배포 명령어

```bash
# Vercel 배포
vercel --prod

# 또는 Git push (자동 배포 설정된 경우)
git add .
git commit -m "feat: production ready"
git push origin main
```