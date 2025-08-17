# 🚀 개발자 커뮤니티 플랫폼

**Next.js 15 + React 19 기반 엔터프라이즈급 개발자 커뮤니티**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.2.4-729B1B?style=flat-square&logo=vitest)](https://vitest.dev)

## 🚀 빠른 시작

```bash
# 1. 클론
git clone https://github.com/yourusername/project.git

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local

# 4. 데이터베이스 설정
npm run db:push

# 5. 개발 서버 실행
npm run dev
```

## 📚 문서

상세한 기술 문서는 `docs` 폴더를 참조하세요:

- 📐 [시스템 아키텍처](docs/ARCHITECTURE.md) - 2-tier 플랫폼 구조
- 🛠 [기술 스택](docs/TECH_STACK.md) - 최신 기술 상세 (Next.js 15, React 19)
- ⚡ [성능 최적화](docs/PERFORMANCE.md) - 1,276x 성능 개선 사례
- 🔒 [보안 구현](docs/SECURITY.md) - 엔터프라이즈급 보안 시스템
- 🗄 [데이터베이스](docs/DATABASE.md) - Prisma 6.13 + PostgreSQL 16
- 🧪 [테스트 전략](docs/TESTING.md) - Vitest 3.2.4 + Playwright
- 🔄 [실시간 기능](docs/REAL_TIME.md) - Vercel 최적화 Polling
- 🤖 [AI 기능](docs/AI_FEATURES.md) - Q&A 자동 답변 시스템
- 📡 [API 명세](docs/api/specification.yaml) - OpenAPI 3.0
  - 🌐 [API 문서 (Swagger UI)](https://htmlpreview.github.io/?https://github.com/yourusername/project/blob/main/docs/api/index.html)
- 🚀 [Vercel 배포](docs/deployment/VERCEL.md) - 배포 최적화
- 🔄 [CI/CD](docs/deployment/CI_CD.md) - GitHub Actions 자동화

## ✨ 주요 기능

- **2-tier 플랫폼**: 메인 사이트(승인제) + 커뮤니티(즉시 게시)
- **AI 자동 답변**: Q&A 게시글 AI 답변 생성 (GPT-4, Claude 3)
- **실시간 채팅**: Vercel 최적화 Polling 기반
- **24개 데이터 모델**: 복잡한 관계 관리
- **엔터프라이즈 보안**: Trust Score + 적응형 Rate Limiting


## 🛠️ 기술 스택

### 핵심 기술
- **Frontend**: Next.js 15.4.4, React 19.1.0, TypeScript 5.8
- **Styling**: Tailwind CSS v4, Radix UI
- **Database**: Prisma 6.13.0, PostgreSQL 16
- **Auth**: NextAuth v5 beta
- **Testing**: Vitest 3.2.4, Playwright 1.54.1
- **Real-time**: TanStack Query v5 (Polling)
- **AI**: OpenRouter (GPT-4, Claude 3)

## ⚡ 성능 최적화

- **서버 컴포넌트**: 1,276x 성능 향상 (127.6초 → 0.1초)
- **번들 크기**: 75% 감소 (2MB → 500KB)
- **Core Web Vitals**: LCP 44% 개선, FID 63% 개선, CLS 67% 개선

## 📝 개발 명령어

```bash
# 개발
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 실행

# 데이터베이스
npm run db:generate  # Prisma 클라이언트 생성
npm run db:push      # 스키마 동기화
npm run db:migrate   # 마이그레이션

# 테스트
npm run test         # 전체 테스트
npm run test:unit    # 단위 테스트
npm run test:e2e     # E2E 테스트

# 코드 품질
npm run lint         # ESLint
npm run type-check   # TypeScript 검사
npm run format       # Prettier 포맷
```

## 📄 라이선스

MIT License

---

<div align="center">
  <strong>Next.js 15 + React 19 + TypeScript로 구축된 최신 기술 플랫폼</strong>
</div>