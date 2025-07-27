# Development Guide

## Windows에서의 lint-staged 이슈

Windows 환경에서 lint-staged 실행 시 다음과 같은 에러가 발생할 수 있습니다:

```
No files matching the pattern were found: "^^^--write^^^"
```

이는 Windows 명령줄의 이스케이프 문자(^) 처리 방식 때문입니다.

### 해결 방법

1. **직접 prettier 실행** (권장)
   ```bash
   npm run format      # 모든 파일 포맷팅
   npm run format:check # 포맷 검사만
   ```

2. **커밋 시 훅 우회**
   ```bash
   git commit --no-verify -m "커밋 메시지"
   ```

3. **CI에서 검증**
   - GitHub Actions에서 자동으로 코드 포맷과 린트를 검사합니다
   - PR 생성 시 CI가 통과해야 머지 가능

### 개발 워크플로우

1. 코드 작성
2. `npm run format` 실행하여 포맷팅
3. `npm run lint:fix` 실행하여 린트 이슈 수정
4. 커밋 (`git commit --no-verify` 사용 가능)
5. 푸시 후 CI 확인

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 자동 수정
- `npm run format` - Prettier 포맷팅
- `npm run format:check` - Prettier 검사
- `npm run type-check` - TypeScript 타입 체크
- `npm run verify` - 모든 검증 실행 (린트, 포맷, 타입체크)