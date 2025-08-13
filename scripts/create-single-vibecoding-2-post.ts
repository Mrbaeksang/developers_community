import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createSingleVibeCoding2Post() {
  const categoryId = 'cme5a5vyt0003u8ww9aoazx9f' // 바이브 코딩 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '⚠️ 바이브 코딩의 함정과 해결책! 실제 개발자들이 겪은 실패 사례와 대처법'

  const content = `# ⚠️ 바이브 코딩의 함정과 해결책! 실제 개발자들이 겪은 실패 사례와 대처법

## 🚨 바이브 코딩, 모든 게 장점만은 아니다

안녕하세요! 지난 포스트에서 바이브 코딩의 매력적인 면들을 소개해드렸는데, 오늘은 **현실적인 이야기**를 해보려고 합니다. 

바이브 코딩이 혁신적인 개발 방식인 것은 맞지만, 실제로 사용해보면서 많은 개발자들이 예상치 못한 문제들을 겪고 있어요. **2025년 8월 현재 6개월간 바이브 코딩을 실무에서 사용한 개발팀들의 솔직한 후기**를 바탕으로 주요 함정들과 해결책을 정리해봤습니다.

## 💥 실제로 발생한 바이브 코딩 참사들

### 🔥 사례 1: 데이터베이스 전체 삭제 사건

**2025년 7월, 스타트업 A사에서 발생한 실제 사건:**

\`\`\`
상황: 개발자가 "사용자 데이터를 정리해줘"라고 요청
AI 해석: "사용자 테이블을 깨끗하게 비워줘" 
결과: 전체 사용자 데이터 삭제 (30만 명의 회원 정보 손실)
복구: 6시간 후 백업으로 복구, 하지만 6시간치 데이터는 영구 손실
\`\`\`

**교훈**: AI는 "정리"를 "삭제"로 해석할 수 있습니다.

### 🏦 사례 2: 보안 취약점 대량 생산

**국내 핀테크 B사의 경험:**

\`\`\`javascript
// AI가 생성한 로그인 코드
function login(username, password) {
  // "간단하게 만들어줘"라는 요청에 따라
  const user = users.find(u => u.name === username)
  if (user && user.password === password) {
    return { success: true, token: user.id }
  }
  return { success: false }
}

// 문제점들:
// 1. 비밀번호 평문 비교
// 2. SQL Injection 방어 없음  
// 3. Rate Limiting 없음
// 4. JWT 토큰 대신 단순 ID 반환
\`\`\`

**결과**: 보안 감사에서 **47개의 취약점** 발견

### 🎮 사례 3: 성능 재앙

**게임 개발사 C사의 실패:**

\`\`\`
요청: "게임 캐릭터 1000명이 부드럽게 움직이게 해줘"

AI가 생성한 코드:
- 각 캐릭터마다 별도의 애니메이션 루프
- 메모리 최적화 전혀 없음
- GPU 가속 미사용

결과: 
- 메모리 사용량 4GB → 16GB
- FPS 60 → 3
- 게임 완전 멈춤
\`\`\`

## 🧠 바이브 코딩 실패의 주요 원인들

### 1. AI의 "추론" vs 개발자의 "의도"

**문제:**
AI는 제한된 컨텍스트에서 "최선"이라고 생각하는 코드를 생성하지만, 전체 시스템을 고려하지 못합니다.

**실제 예시:**
\`\`\`
개발자 의도: "빠른 프로토타입용 간단한 코드"
AI 해석: "완전히 단순화된 코드 (보안, 성능 무시)"

개발자 의도: "사용자 친화적인 인터페이스"  
AI 해석: "복잡한 기능을 모두 화면에 표시"
\`\`\`

### 2. 컨텍스트 부족 문제

**AI가 놓치는 중요한 컨텍스트들:**
- 기존 코드베이스의 아키텍처 패턴
- 회사의 보안 정책
- 성능 요구사항
- 유지보수 고려사항
- 팀의 코딩 컨벤션

### 3. "마법적 사고"의 함정

많은 개발자들이 AI를 "마법의 도구"로 여기면서 생기는 문제:

\`\`\`
위험한 사고방식:
"AI가 만든 코드니까 완벽할 거야"
"검토 없이 바로 배포해도 되겠지"
"AI가 보안도 알아서 챙겨줄 거야"

현실:
AI는 요청한 기능만 구현, 나머지는 고려 안 함
AI는 버그가 있는 코드도 자신있게 생성
AI는 최신 보안 패치 정보를 모를 수 있음
\`\`\`

## 🛡️ 바이브 코딩을 안전하게 사용하는 방법

### 레벨 1: 기초 안전 조치

**1. 절대 규칙들**
\`\`\`
❌ 절대 하지 말 것:
- AI 생성 코드를 검토 없이 프로덕션에 배포
- 데이터베이스 관련 작업을 AI에게 맡기기
- 보안이 중요한 기능을 AI로만 구현
- "빨리 만들어줘" 같은 압박성 요청

✅ 반드시 할 것:
- AI 생성 코드는 반드시 리뷰 후 사용
- 중요한 기능은 단계별로 요청
- 보안 체크리스트 별도 확인
- 테스트 코드 작성 필수
\`\`\`

**2. 프롬프트 작성 팁**
\`\`\`
나쁜 예시:
"로그인 기능 만들어줘"

좋은 예시:
"JWT 토큰 기반 로그인 API를 만들어줘. 
- bcrypt로 비밀번호 해싱
- Rate limiting 적용  
- 입력값 validation 포함
- 에러 핸들링 적용
- TypeScript 타입 정의 포함"
\`\`\`

### 레벨 2: 체계적 안전 관리

**3. 단계별 검증 프로세스**

\`\`\`
1단계: AI 코드 생성
   └─ 명확한 요구사항 전달
   
2단계: 코드 리뷰  
   └─ 로직 검증, 보안 점검
   
3단계: 테스트 작성
   └─ 단위/통합/E2E 테스트
   
4단계: 성능 검토
   └─ 메모리, 속도, 확장성 평가
   
5단계: 보안 감사
   └─ 취약점 스캔, 권한 검토
   
6단계: 배포 및 모니터링
   └─ 점진적 배포, 실시간 모니터링
\`\`\`

**4. 팀 차원의 가이드라인 예시**

\`\`\`typescript
// 우리 회사의 바이브 코딩 체크리스트

interface VibeCodeReview {
  // 기능성 체크
  functionality: {
    requirement_met: boolean;      // 요구사항 충족 여부
    edge_cases_handled: boolean;   // 예외상황 처리 여부  
    error_handling: boolean;       // 에러 핸들링 포함 여부
  };
  
  // 보안 체크  
  security: {
    input_validation: boolean;     // 입력값 검증
    auth_implemented: boolean;     // 인증/인가 구현
    sensitive_data_protected: boolean; // 민감데이터 보호
  };
  
  // 성능 체크
  performance: {
    memory_efficient: boolean;     // 메모리 효율성
    database_optimized: boolean;   // DB 쿼리 최적화
    scalability_considered: boolean; // 확장성 고려
  };
  
  // 유지보수 체크
  maintainability: {
    code_readable: boolean;        // 코드 가독성
    documentation_exists: boolean; // 문서화 여부
    testing_covered: boolean;      // 테스트 커버리지
  };
}
\`\`\`

### 레벨 3: 고급 안전 전략

**5. AI 권한 제한 시스템**

\`\`\`
// 실제 구현 예시: AI 작업 권한 제한
const AI_PERMISSIONS = {
  ALLOWED: [
    'UI 컴포넌트 생성',
    '데이터 조회 API',
    '유틸리티 함수',
    '테스트 코드'
  ],
  
  RESTRICTED: [
    '데이터베이스 스키마 변경',
    '사용자 권한 관리',
    '결제 시스템',
    '보안 설정'
  ],
  
  FORBIDDEN: [
    '데이터 삭제 작업',
    'Production DB 접근',
    '환경변수 설정',
    '배포 스크립트'
  ]
}
\`\`\`

**6. 실시간 모니터링 시스템**

성공적으로 바이브 코딩을 도입한 팀들의 모니터링 지표:

\`\`\`
📊 주요 모니터링 지표:

- AI 코드 사용률: 전체 코드의 몇 %가 AI 생성인지
- 버그 발생률: AI 코드 vs 수동 코드 버그 비교  
- 개발 속도: 기능당 개발 시간 측정
- 코드 품질: 정적 분석 도구 점수
- 보안 지표: 취약점 발견 빈도
\`\`\`

## 🏢 성공적인 바이브 코딩 도입 사례들

### 사례 1: 스타트업 D사 (20명 개발팀)

**도입 전략:**
- 3개월간 사이드 프로젝트에서만 실험
- 주니어 개발자에게는 시니어 멘토링 필수
- 매주 "AI 코드 리뷰데이" 운영

**성과:**
- 프로토타입 개발 속도 **300% 향상**
- 코드 품질 오히려 **20% 개선** (리뷰 강화 효과)
- 개발자 만족도 **85% 상승**

**핵심 성공 요인:**
\`\`\`
1. 점진적 도입 (한 번에 모든 영역에 적용 X)
2. 교육과 가이드라인 (2주간 집중 교육)
3. 문화 조성 (실패를 학습 기회로 인식)
\`\`\`

### 사례 2: 대기업 E사 (200명 개발조직)

**도입 과정:**
1. **파일럿 팀 운영** (3개 팀, 1개월)
2. **가이드라인 수립** (성공/실패 사례 문서화)
3. **교육 프로그램** (전 개발자 대상)
4. **단계적 확산** (분기별 10개 팀씩 확대)

**현재 성과 (6개월 후):**
- 개발 생산성 **40% 향상**
- 코드 리뷰 시간 **50% 단축** (AI 도구 활용)
- 신입 개발자 온보딩 속도 **60% 개선**

## 💡 실무자를 위한 바이브 코딩 체크리스트

### 개인 개발자용

\`\`\`
□ 도구 선택
  □ 예산에 맞는 AI 도구 선택 (Cursor, v0, GitHub Copilot)
  □ 무료 체험판으로 충분히 테스트
  
□ 기본 안전 조치
  □ AI 생성 코드는 반드시 검토 후 사용
  □ 중요한 기능은 단계별로 요청
  □ 백업 및 버전 관리 철저히
  
□ 학습 및 성장
  □ AI 생성 코드를 이해하려고 노력
  □ 문제 발생 시 원인 분석하는 습관
  □ 커뮤니티에서 경험 공유
\`\`\`

### 팀 리더용

\`\`\`
□ 도입 계획
  □ 파일럿 프로젝트로 시작
  □ 팀원 교육 프로그램 수립
  □ 코드 리뷰 프로세스 개선
  
□ 가이드라인 수립  
  □ 허용/금지 작업 명확히 정의
  □ 보안 체크리스트 작성
  □ 성능 기준 설정
  
□ 모니터링 시스템
  □ AI 코드 사용률 추적
  □ 버그 발생률 모니터링
  □ 개발자 피드백 정기 수집
\`\`\`

## 🔮 바이브 코딩의 미래와 대비책

### 2025년 하반기 예상 이슈들

**1. AI 의존성 증가**
- 개발자들의 기본 코딩 실력 저하
- AI 없이는 개발 불가능한 상황 발생
- 주니어 개발자 성장 경로 변화

**대비책:**
\`\`\`
- 주기적인 "AI 없이 코딩하기" 챌린지
- 기본기 교육 프로그램 강화  
- 코드 리뷰에서 원리 설명 의무화
\`\`\`

**2. 보안 취약점 대량 생산**
- AI가 학습한 오래된 보안 패턴 사용
- 새로운 공격 기법에 대한 방어 부족
- 개발자의 보안 감각 둔화

**대비책:**
\`\`\`
- AI 생성 코드 전용 보안 스캔 도구 도입
- 보안 전문가 코드 리뷰 필수화
- 정기적인 보안 교육 강화
\`\`\`

**3. 코드 품질 일관성 문제**
- 팀별로 다른 AI 도구 사용시 스타일 불일치
- AI 버전 업데이트에 따른 코드 패턴 변화
- 유지보수 복잡성 증가

**대비책:**
\`\`\`
- 팀 차원의 AI 도구 표준화
- 코드 스타일 가이드 자동 적용
- 정기적인 리팩토링 일정 수립
\`\`\`

## ⚡ 바이브 코딩, 이렇게 시작하세요!

### 안전한 첫걸음 가이드

**1주차: 도구 탐색**
- Replit, GitHub Copilot 무료 버전으로 시작
- 간단한 계산기, 투두리스트 만들어보기
- AI 생성 코드와 직접 작성 코드 비교 분석

**2주차: 실전 적용**  
- 개인 사이드 프로젝트에 부분 적용
- 매일 생성된 코드 검토하는 습관
- 문제점과 개선사항 기록

**3주차: 고급 활용**
- 복잡한 컴포넌트 생성 시도
- 성능과 보안 관점에서 코드 평가  
- 팀원들과 경험 공유

**4주차: 체계 구축**
- 개인만의 바이브 코딩 가이드라인 작성
- 즐겨 사용하는 프롬프트 패턴 정리
- 다음 단계 학습 계획 수립

## 🎯 마무리: 바이브 코딩은 도구일 뿐

바이브 코딩은 분명히 혁신적인 개발 방식이지만, **마법의 해결책은 아닙니다**. 

**핵심 메시지:**
- ✅ **도구로서는 매우 강력**하지만 완벽하지 않음
- ⚠️ **위험성을 인지**하고 안전 조치 필수  
- 🎯 **개발자의 역량**이 결국 성패를 좌우

바이브 코딩을 성공적으로 활용하려면:

1. **현실적인 기대치** 설정
2. **체계적인 안전 조치** 구축  
3. **지속적인 학습과 개선**

바이브 코딩은 개발자를 대체하는 것이 아니라 **더 나은 개발자가 되도록 돕는 도구**입니다. 올바르게 사용한다면 생산성은 향상시키면서도 코드 품질을 유지할 수 있어요.

여러분의 바이브 코딩 경험은 어떠신가요? 실패 사례나 성공 노하우가 있다면 댓글로 공유해주세요! 🚀

---

*안전한 바이브 코딩을 위한 추가 팁이나 질문이 있으시면 언제든 댓글로 남겨주세요. 함께 더 나은 개발 문화를 만들어가요!*`

  const excerpt =
    '바이브 코딩의 화려한 면만 보지 마세요! 실제 개발자들이 겪은 데이터베이스 삭제, 보안 취약점 대량 생산 등의 실패 사례와 이를 예방하는 구체적인 안전 조치들을 상세히 소개합니다.'

  const slug = 'vibe-coding-pitfalls-failures-safety-measures-2025'

  try {
    const post = await prisma.mainPost.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        status: PostStatus.PUBLISHED,
        isPinned: false,
        authorId,
        authorRole: GlobalRole.ADMIN,
        categoryId,
        // 스키마 필드 완전 활용 (모든 필드 포함 필수)
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null, // 승인된 게시글이므로 null
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: getRandomViewCount(90, 190), // 바이브 코딩 카테고리 조회수 범위
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
    const tags = [
      { name: '바이브 코딩 위험', slug: 'vibe-coding-risks', color: '#e74c3c' },
      { name: 'AI 안전', slug: 'ai-safety', color: '#f39c12' },
      { name: '코드 보안', slug: 'code-security', color: '#8e44ad' },
      { name: '개발 가이드라인', slug: 'dev-guidelines', color: '#2c3e50' },
      { name: '실패 사례', slug: 'failure-cases', color: '#95a5a6' },
    ]

    for (const tagData of tags) {
      const tag = await prisma.mainTag.upsert({
        where: { slug: tagData.slug },
        update: { postCount: { increment: 1 } },
        create: {
          ...tagData,
          postCount: 1,
        },
      })

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`✅ "${title}" 게시글이 성공적으로 생성되었습니다!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`👁️ 조회수: ${post.viewCount}`)
    console.log(`🏷️ ${tags.length}개의 태그가 연결되었습니다.`)

    return post
  } catch (error) {
    console.error('게시글 생성 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
createSingleVibeCoding2Post()
  .then(() => {
    console.log('🎉 바이브 코딩 두 번째 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
