# 메인 사이트 게시글 생성 계획서

## 🎯 목표
개발자 커뮤니티 메인 사이트에 고품질 게시글을 자동 생성하여 초기 콘텐츠를 구축하고 사용자 참여를 유도한다.

## 📊 카테고리별 게시글 계획

### 🔥 바이브코딩 (cme5a5vyt0003u8ww9aoazx9f)
- **목표 게시글 수**: 20개
- **조회수 범위**: 300~500
- **작성자**: cmdri2tj90000u8vgtyir9upy (ADMIN)
- **주제**: AI 코딩, 바이브 코딩 방법론, AI 도구 활용법

### 🤖 AI 뉴스 (cme5a3ysr0002u8wwwmcbgc7z)  
- **목표 게시글 수**: 20개
- **조회수 범위**: 300~500
- **주제**: 최신 AI 기술 동향, AI 업계 뉴스, 혁신적인 AI 도구 소개

### 🎨 Frontend (cmdrfyb5f0000u8fsih05gxfk)
- **목표 게시글 수**: 10개
- **조회수 범위**: 100~250
- **주제**: React, Vue, TypeScript, UI/UX, 프론트엔드 최적화

### 🌟 오픈소스 (cme5a7but0004u8ww8neir3k3)
- **목표 게시글 수**: 10개
- **조회수 범위**: 100~250
- **주제**: 인기 오픈소스 프로젝트, 기여 방법, 라이센스 가이드

### ⚙️ Backend (cmdrfybll0002u8fseh2edmgf)
- **목표 게시글 수**: 10개
- **조회수 범위**: 100~250
- **주제**: API 설계, 서버 아키텍처, 성능 최적화, 보안

### 🚀 DevOps (cme5a1b510000u8ww82cxvzzv)
- **목표 게시글 수**: 5개
- **조회수 범위**: 50~150
- **주제**: CI/CD, Docker, Kubernetes, 인프라 자동화

### 💾 Database (cme5a2cf40001u8wwtm4yvrw0)
- **목표 게시글 수**: 5개
- **조회수 범위**: 50~150
- **주제**: SQL 최적화, NoSQL, 데이터베이스 설계, 성능 튜닝

## 🛠️ 구현 지침

### 스크립트 생성 패턴
각 카테고리별로 `create-[category-name]-posts.ts` 형태의 스크립트 생성:
```
scripts/
├── create-vibe-coding-posts.ts    (20개)
├── create-ai-news-posts.ts        (20개)
├── create-frontend-posts.ts        (10개)
├── create-opensource-posts.ts      (10개)
├── create-backend-posts.ts         (10개)
├── create-devops-posts.ts          (5개)
└── create-database-posts.ts        (5개)
```

### 공통 요구사항
1. **작성자**: 모든 게시글은 ADMIN 계정으로 생성
2. **상태**: `PUBLISHED` 상태로 즉시 공개
3. **승인**: 자동 승인 처리 (`approvedAt`, `approvedById` 설정)
4. **SEO**: `metaTitle`, `metaDescription` 자동 생성
5. **태그**: 카테고리별 관련 태그 자동 연결
6. **조회수**: 지정된 범위 내 랜덤 설정

### 콘텐츠 품질 기준
1. **제목**: 매력적이고 SEO 친화적
2. **본문**: 마크다운 형식, 최소 1500자 이상
3. **코드 블록**: 관련 코드 예시 포함
4. **구조**: 헤딩, 리스트, 인용구 적절히 활용
5. **실용성**: 실제 개발에 도움되는 내용

### 기술적 구현사항
1. **Prisma 연동**: MainPost, MainTag, MainPostTag 모델 활용
2. **중복 방지**: slug 기반 중복 게시글 방지
3. **태그 관리**: upsert를 통한 태그 생성/업데이트
4. **에러 처리**: 상세한 에러 로깅 및 복구
5. **트랜잭션**: 데이터 일관성 보장

## 📋 실행 계획

### Phase 1: 핵심 카테고리 (우선순위 높음)
```bash
npm run script:create-vibe-coding-posts    # 바이브코딩 20개
npm run script:create-ai-news-posts        # AI 뉴스 20개
```

### Phase 2: 개발 카테고리 (우선순위 중간)
```bash
npm run script:create-frontend-posts       # Frontend 10개
npm run script:create-backend-posts        # Backend 10개
npm run script:create-opensource-posts     # 오픈소스 10개
```

### Phase 3: 전문 카테고리 (우선순위 낮음)
```bash
npm run script:create-devops-posts         # DevOps 5개
npm run script:create-database-posts       # Database 5개
```

## 🎨 콘텐츠 아이디어

### 바이브코딩 시리즈
1. "바이브 코딩이란? 완전 가이드"
2. "Cursor vs GitHub Copilot 비교"
3. "AI 코딩 도구 활용 팁 10가지"
4. "바이브 코딩으로 Next.js 프로젝트 만들기"
5. "AI와 함께하는 코드 리뷰"

### AI 뉴스 시리즈
1. "2025년 AI 개발 동향"
2. "ChatGPT-5 출시 소식"
3. "Claude 3.5 Sonnet 활용법"
4. "AI 코딩 도구 신규 출시"
5. "오픈소스 AI 모델 동향"

### Frontend 시리즈
1. "React 19 새로운 기능들"
2. "TypeScript 5.0 마이그레이션"
3. "Next.js 15 성능 최적화"
4. "Tailwind CSS 최신 트렌드"
5. "모던 CSS 기법 2025"

## 📈 성공 지표
1. **콘텐츠 품질**: 평균 읽기 시간 3분 이상
2. **사용자 참여**: 게시글당 평균 댓글 2개 이상
3. **SEO 성과**: 검색 트래픽 20% 이상
4. **커뮤니티 활성화**: 신규 회원가입 증가

## ⚠️ 주의사항
1. **저작권**: 모든 콘텐츠는 오리지널 작성
2. **정확성**: 기술 정보의 정확성 검증 필요
3. **업데이트**: 최신 기술 동향 반영
4. **다양성**: 초보자부터 고급자까지 다양한 난이도

## 🚀 다음 단계
1. 각 카테고리별 스크립트 작성
2. 콘텐츠 생성 및 검토
3. 단계별 배포 실행
4. 사용자 반응 모니터링
5. 필요시 콘텐츠 보완

---

*이 계획서를 바탕으로 개발자 커뮤니티의 초기 콘텐츠를 구축하여 활발한 커뮤니티를 만들어보세요!*