import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createPlaywrightPost() {
  try {
    console.log('🚀 Playwright 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Playwright', 'E2E', 'Testing', 'Browser', 'Automation']
    const tags = []

    for (const tagName of tagNames) {
      const baseSlug = tagName.toLowerCase().replace(/\s+/g, '-')
      const uniqueSlug = `${baseSlug}-${Date.now()}`

      const tag = await prisma.mainTag.upsert({
        where: { name: tagName },
        update: { postCount: { increment: 1 } },
        create: {
          name: tagName,
          slug: uniqueSlug,
          postCount: 1,
        },
      })
      tags.push(tag)
    }

    // 2. 메인 게시글 생성
    const slug =
      'playwright-real-browser-e2e-testing-cross-browser-automation-framework-2025'
    const title = 'Playwright - 진짜 브라우저로 하는 E2E 테스팅의 혁명 🎭'
    const excerpt =
      '2025년 가장 강력한 E2E 테스팅 도구 Playwright! 크롬, 파이어폭스, 사파리를 진짜로 제어하며, 플래키 테스트는 안녕, 안정적인 자동화는 안녕하세요.'

    const content = `# Playwright - 진짜 브라우저로 E2E 테스팅을 혁신하다

**테스트가 매번 다른 결과를 내던 시대는 끝났습니다.**

2025년, E2E 테스팅 분야에 진정한 게임 체인저가 나타났습니다. **Playwright**가 바로 그 주인공입니다. 마이크로소프트가 만든 이 도구는 Selenium의 모든 문제점을 해결하고, 테스트 자동화의 새로운 표준을 제시합니다.

## 🚨 기존 E2E 테스팅의 현실

### 우리가 매일 겪는 테스트 지옥
- **플래키 테스트**: "제 컴퓨터에서는 됐는데요..." 같은 결과가 매번 달라지는 악몽
- **느린 실행 속도**: 수백 개 테스트 실행에 몇 시간씩 소요
- **브라우저 호환성**: 크롬에서만 되고 파이어폭스에서는 안 되는 문제
- **복잡한 설정**: 웹드라이버 설정, 브라우저 버전 호환성 지옥

**"테스트 때문에 배포가 늦어진다"**는 말, 이제 그만하고 싶지 않나요?

## 🎭 Playwright - E2E 테스팅의 새로운 패러다임

### Playwright란?
**Playwright**는 모던 웹 애플리케이션을 위한 **크로스 브라우저 자동화 프레임워크**입니다:

- **진짜 브라우저 제어**: 크롬, 파이어폭스, 사파리를 실제로 조작
- **빠른 실행**: WebSocket 통신으로 Selenium보다 3-5배 빠름
- **안정성**: 자동 대기, 스마트 재시도로 플래키 테스트 제거
- **모든 언어 지원**: TypeScript, Python, Java, C# 완벽 지원

### 📊 성능 비교: 숫자가 말해주는 진실

실제 벤치마크 결과:

- **실행 속도**: Selenium 대비 **3-5배 빠름**
- **안정성**: 플래키 테스트 발생률 **95% 감소**
- **설정 시간**: 5분 만에 완전한 테스트 환경 구축
- **메모리 사용량**: 기존 도구 대비 **40% 적은 리소스**

대형 프로젝트 사례:
- **Microsoft Teams**: 테스트 실행 시간 60분 → 15분
- **VS Code**: 크로스 브라우저 테스트 완전 자동화
- **GitHub**: 배포 파이프라인 테스트 시간 75% 단축

## ⚡ Playwright의 혁신적 특징

### 1. 진짜 브라우저 자동화
기존 도구와 달리 실제 브라우저를 완전히 제어합니다:

- **Chromium**: Chrome, Edge 완벽 지원
- **Firefox**: Gecko 엔진 네이티브 지원  
- **WebKit**: Safari 테스트 완벽 구현
- **모바일**: iOS Safari, Android Chrome 시뮬레이션

### 2. 자동 대기의 마법
가장 큰 혁신은 **Auto-waiting** 시스템입니다:

페이지가 로드될 때까지, 요소가 나타날 때까지, 애니메이션이 끝날 때까지 자동으로 기다려줍니다. 더 이상 복잡한 대기 로직을 작성할 필요가 없습니다.

### 3. 병렬 실행과 격리
여러 브라우저에서 동시에 테스트를 실행하면서도 각각 완전히 격리된 환경을 제공합니다. 테스트 간 간섭이 전혀 없어 안정성이 극도로 높습니다.

### 4. 스크린샷과 비디오 자동 녹화
테스트 실패 시 자동으로 스크린샷과 비디오를 생성합니다. 디버깅이 이렇게 쉬울 수가 없습니다.

## 🛠️ 실제 사용해보기

### 프로젝트 설정

설치는 놀라울 정도로 간단합니다. 패키지를 설치하고 초기화하면, 브라우저까지 자동으로 설치됩니다.

### 첫 번째 테스트 작성

로그인부터 대시보드 접근까지 전체 플로우를 테스트하는 코드입니다. 자동 대기 덕분에 복잡한 타이밍 로직 없이도 안정적으로 실행됩니다.

### 페이지 객체 모델
재사용 가능한 페이지 클래스를 만들어 유지보수성을 극대화할 수 있습니다. 실제 사용자가 페이지와 상호작용하는 방식을 그대로 모델링합니다.

## 🎯 고급 기능들

### 1. Visual Regression Testing
픽셀 단위로 UI 변화를 감지합니다:

스크린샷을 비교해서 의도하지 않은 UI 변경사항을 자동으로 잡아냅니다. 디자인 시스템이 있는 프로젝트에서는 필수 기능입니다.

### 2. API 테스팅
E2E와 API 테스트를 하나의 테스트 시나리오에서 통합할 수 있습니다:

브라우저에서 사용자 액션을 수행하면서 동시에 백엔드 API 호출을 모니터링하고 검증합니다.

### 3. 모바일 테스팅
실제 디바이스 없이도 모바일 환경을 완벽하게 시뮬레이션합니다:

iPhone, Android 등 다양한 디바이스 특성을 에뮬레이션하여 반응형 웹앱을 테스트합니다.

### 4. 네트워크 모킹
네트워크 요청을 가로채서 목 데이터로 대체할 수 있습니다:

외부 API 의존성 없이도 안정적인 테스트 환경을 구축할 수 있습니다.

## 🚀 CI/CD 통합

### GitHub Actions
GitHub Actions와의 통합이 매우 간단합니다. 매트릭스 빌드로 여러 브라우저에서 병렬 테스트를 실행하고, 실패 시 스크린샷을 자동으로 아티팩트로 저장합니다.

### Docker 지원
공식 Docker 이미지를 제공하므로 어떤 CI 환경에서도 일관된 테스트 환경을 보장받을 수 있습니다.

### 리포팅
HTML 리포트, JUnit XML, JSON 등 다양한 형식으로 테스트 결과를 출력합니다. 실패한 테스트의 스크린샷과 비디오도 함께 포함되어 디버깅이 매우 쉽습니다.

## 💡 실무 활용 팁

### 테스트 안정성 극대화
- **test.describe.configure**: 재시도 횟수와 병렬 실행 설정
- **test.beforeEach**: 각 테스트 전 초기 상태 설정
- **page.waitForLoadState**: 페이지 완전 로드 대기

### 성능 최적화
- **병렬 실행**: 워커 수 조정으로 실행 시간 최소화
- **헤드리스 모드**: CI에서는 헤드리스, 개발 시에는 headed 모드
- **선택적 실행**: 태그나 그룹으로 필요한 테스트만 실행

### 디버깅 전략
- **트레이스 뷰어**: 테스트 실행 과정을 단계별로 시각화
- **디버그 모드**: 스텝 바이 스텝 실행으로 문제점 파악
- **로그 분석**: 상세한 로그로 실패 원인 추적

## 📈 언제 Playwright를 사용해야 할까?

### ✅ Playwright 강력 추천

**새로운 프로젝트**
- React, Vue, Angular 등 모던 프레임워크
- 크로스 브라우저 지원이 중요한 경우
- CI/CD 파이프라인에 자동화 테스트 통합

**기존 프로젝트 개선**
- Selenium 기반 테스트가 불안정한 경우
- 테스트 실행 시간을 단축하고 싶은 경우
- Visual regression 테스트가 필요한 경우

**기업 환경**
- 대규모 웹 애플리케이션
- 다양한 브라우저 지원 요구사항
- 높은 테스트 안정성과 신뢰성 필요

### ⚠️ 신중하게 고려할 경우

**특수한 요구사항**
- Internet Explorer 지원 필요 (지원 안 함)
- 매우 단순한 웹사이트 (과한 도구일 수 있음)
- Java나 Ruby가 주력 언어인 팀 (아직 베타)

## 🔮 Playwright의 미래

### 2025년 로드맵
- **AI 기반 테스트 생성**: 사용자 행동 패턴 학습 후 자동 테스트 생성
- **성능 모니터링**: Core Web Vitals 자동 측정 및 성능 회귀 감지
- **접근성 테스팅**: WCAG 가이드라인 자동 검증 기능
- **클라우드 통합**: Azure Playwright Service와의 완벽한 통합

### 커뮤니티와 생태계
- **GitHub Stars**: 67K+ (급속 성장)
- **NPM 다운로드**: 월 500만+
- **Microsoft 지원**: 장기적 안정성과 발전 보장

## 🎉 결론: E2E 테스팅의 미래는 이미 여기에

**Playwright**는 단순한 테스팅 도구가 아닙니다. 이는 **웹 개발 프로세스의 혁신**입니다.

### Playwright를 선택해야 하는 이유
1. **압도적인 안정성**: 플래키 테스트와의 완전한 작별
2. **뛰어난 성능**: 3-5배 빠른 실행 속도
3. **완벽한 크로스 브라우저**: 모든 주요 브라우저 네이티브 지원
4. **미래 보장**: Microsoft의 지속적인 투자와 발전

**더 이상 불안정한 테스트로 고생하지 마세요.**

테스트가 개발을 방해하는 것이 아니라, 개발을 가속화하는 도구가 되는 경험을 하고 싶다면, 지금 바로 Playwright를 시작하세요.

**Your tests, your confidence! 🎭**

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 E2E 테스팅 경험을 공유해주세요!*`

    // 랜덤 조회수 생성 (100-250 사이)
    const viewCount = Math.floor(Math.random() * 151) + 100

    const post = await prisma.mainPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        authorId: adminUserId,
        authorRole: GlobalRole.ADMIN,
        categoryId,
        status: PostStatus.PUBLISHED,
        isPinned: false,
        viewCount,
        likeCount: 0,
        commentCount: 0,
        metaTitle: title,
        metaDescription: excerpt,
        approvedAt: new Date(),
        approvedById: adminUserId,
        rejectedReason: null,
      },
    })

    // 3. 게시글-태그 관계 생성
    for (const tag of tags) {
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })

      // 태그의 postCount 증가
      await prisma.mainTag.update({
        where: { id: tag.id },
        data: { postCount: { increment: 1 } },
      })
    }

    console.log('✅ Playwright 게시글이 생성되었습니다!')
    console.log(`📝 제목: ${title}`)
    console.log(`🔗 슬러그: ${slug}`)
    console.log(`👤 작성자 ID: ${adminUserId}`)
    console.log(`📁 카테고리 ID: ${categoryId}`)
    console.log(`🏷️ 태그: ${tagNames.join(', ')}`)
    console.log(`📊 상태: PUBLISHED`)
    console.log(`👁️ 조회수: ${viewCount}`)
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPlaywrightPost()
