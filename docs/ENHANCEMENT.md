# 🎯 프로젝트 개선 작업 목록

## ✅ 완료된 작업
1. 프로젝트 네이밍 변경
2. 캐싱 정책 수정 (revalidate = 300)
3. React Query v5 전체 적용
4. 모든 주요 버그 수정
5. Next.js 15 파라미터 async 처리 (52개 API 라우트)
6. 이미지 최적화 (placeholder 적용)
7. Redis 캐싱 구축
8. serverMinification: false 설정
9. Rate Limiting 구현 (Redis 기반)
10. CSRF 보호 구현 (Double Submit Cookie)

## 🔄 진행 중
11. Input Validation 강화 - 모든 API 엔드포인트에 적용

## 📋 할 일 목록
12. **긴급** 성능 개선 - FCP 5.2초 → 2초, LCP 5.22초 → 2.5초
13. Sentry 에러 모니터링 설정
14. CSP 헤더 추가 (XSS 방지)
15. 데이터베이스 느린 쿼리 최적화
16. 백업 Export 스크립트 작성
17. 테스트 코드 작성 (핵심 기능만)
18. UX 개선 (로딩 상태, 에러 처리)
19. Zustand 상태 관리 부분 도입
20. useApiMutation → React Query 마이그레이션

## 💡 참고사항
- **환경**: Vercel + Neon PostgreSQL + Redis Cloud + Vercel Blob
- **현재 성능**: Desktop RES 62점 (Poor) - 긴급 개선 필요
- **Vercel 자동 제공**: CDN, HTTPS, 모니터링, Edge Functions
- **Neon 자동 제공**: 백업, 커넥션 풀링, Autoscaling