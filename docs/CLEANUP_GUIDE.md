# 🧹 코드 정리 가이드

## 📋 제거 대상 파일 목록

### 1. 중복 파일 (즉시 제거)
```bash
# 중복된 debounce 훅 제거
rm hooks/useDebounce.ts  # camelCase 버전 제거 (use-debounce.ts 유지)
```

### 2. 빈 디렉토리 (즉시 제거)
```bash
# 구현되지 않은 빈 API 디렉토리들
rm -rf app/api/cron/update-view-counts/
rm -rf app/api/home/categories/
rm -rf app/api/home/trending/
rm -rf app/api/test/notifications/

# 빈 feature 디렉토리
rm -rf components/feature/
```

### 3. 미사용 훅 (검토 후 제거)
```bash
# 사용되지 않는 훅들
rm hooks/useImageUpload.ts      # 이미지 업로드 미사용
rm hooks/useFormValidation.ts   # 폼 검증 미사용
```

### 4. 미사용 유틸리티 함수

#### color-utils.ts 정리
```typescript
// lib/color-utils.ts
// 다음 함수들 제거:
// - adjustColorBrightness()
// - colorWithOpacity()
// - rgbToHex()

// 유지할 함수:
// - hexToRgb()
// - getLuminance()
// - getTextColor()
```

#### unsplash-utils.ts 정리
```typescript
// lib/unsplash-utils.ts
// 다음 제거:
// - getUnsplashImageUrl()
// - getRandomRecommendedImage()
// - getRecommendedImageById()
// - SEARCH_KEYWORDS

// 유지:
// - RECOMMENDED_BANNER_IMAGES
```

#### post-format-utils.ts 정리
```typescript
// lib/post-format-utils.ts
// calculateReadingTime() 함수 제거
```

### 5. 미사용 전체 파일 (검토 후 제거)
```bash
# Redis 캐싱 클래스 (미사용)
rm lib/redis-cache.ts

# 디바운스 유틸 (훅으로 대체됨)
rm lib/debounce.ts
```

---

## 🔍 정리 전 확인 사항

### 1. 의존성 검사
```bash
# 제거하려는 파일이 import되는지 확인
grep -r "useDebounce" --include="*.ts" --include="*.tsx" .
grep -r "useImageUpload" --include="*.ts" --include="*.tsx" .
grep -r "useFormValidation" --include="*.ts" --include="*.tsx" .
grep -r "redis-cache" --include="*.ts" --include="*.tsx" .
```

### 2. 테스트 실행
```bash
# 타입 체크
npm run type-check

# 린트 실행
npm run lint

# 빌드 테스트
npm run build
```

---

## 🚀 정리 스크립트

### cleanup.sh 생성
```bash
#!/bin/bash
# cleanup.sh - 미사용 코드 정리 스크립트

echo "🧹 미사용 코드 정리 시작..."

# 1. 중복 파일 제거
echo "📁 중복 파일 제거 중..."
rm -f hooks/useDebounce.ts

# 2. 빈 디렉토리 제거
echo "📁 빈 디렉토리 제거 중..."
rm -rf app/api/cron/update-view-counts/
rm -rf app/api/home/categories/
rm -rf app/api/home/trending/
rm -rf app/api/test/notifications/
rm -rf components/feature/

# 3. 미사용 훅 제거
echo "🪝 미사용 훅 제거 중..."
rm -f hooks/useImageUpload.ts
rm -f hooks/useFormValidation.ts

# 4. 미사용 유틸 제거
echo "🔧 미사용 유틸 제거 중..."
rm -f lib/redis-cache.ts
rm -f lib/debounce.ts

echo "✅ 정리 완료!"
echo "📊 다음 단계: npm run type-check && npm run lint"
```

---

## 📊 정리 효과

### 번들 크기 감소
- **예상 감소량**: 15-20KB
- **파일 수 감소**: 10-12개
- **코드 라인 감소**: ~500줄

### 유지보수성 향상
- 중복 코드 제거
- 명확한 프로젝트 구조
- 혼란 방지

---

## ⚠️ 주의사항

1. **백업 먼저**: 제거 전 git commit
2. **단계별 진행**: 한 번에 모두 제거하지 말 것
3. **테스트 필수**: 각 단계마다 빌드 테스트
4. **팀 공유**: 제거 계획 팀원과 공유

---

## 🔄 정리 후 작업

### 1. 문서 업데이트
```markdown
# README.md에 추가
## 프로젝트 구조
- 2024-01-XX: 미사용 코드 정리 완료
- 중복 훅 제거
- 빈 디렉토리 정리
```

### 2. 패키지 정리
```bash
# 미사용 패키지 확인
npx depcheck

# 발견된 미사용 패키지 제거
npm uninstall [unused-packages]
```

### 3. Git 정리
```bash
# 정리 커밋
git add -A
git commit -m "chore: 미사용 코드 및 중복 파일 제거

- 중복 useDebounce 훅 제거
- 빈 API 디렉토리 4개 제거  
- 미사용 훅 3개 제거
- 미사용 유틸리티 함수 정리
- 번들 크기 15-20KB 감소"
```

---

## 📅 정리 일정

| 단계 | 작업 | 예상 시간 | 위험도 |
|-----|------|----------|--------|
| 1 | 중복 파일 제거 | 5분 | 낮음 |
| 2 | 빈 디렉토리 제거 | 5분 | 없음 |
| 3 | 미사용 훅 제거 | 10분 | 중간 |
| 4 | 유틸 함수 정리 | 15분 | 중간 |
| 5 | 테스트 및 검증 | 10분 | - |

**총 예상 시간**: 45분

정리 작업은 코드 품질을 높이고 유지보수를 쉽게 만드는 중요한 과정입니다.