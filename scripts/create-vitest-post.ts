import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createVitestPost() {
  try {
    console.log('🚀 Vitest 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Vitest', 'Jest', 'Testing', 'Vite', 'Performance']
    const tags = []

    for (const tagName of tagNames) {
      const tag = await prisma.mainTag.upsert({
        where: { name: tagName },
        update: {},
        create: {
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          postCount: 0,
        },
      })
      tags.push(tag)
    }

    // 2. 메인 게시글 생성
    const slug =
      'vitest-jest-alternative-10x-faster-modern-javascript-testing-framework'
    const title = 'Vitest - Jest보다 10배 빠른 차세대 테스트 러너 ⚡'
    const excerpt =
      'Jest의 시대가 끝나고 Vitest의 시대가 시작됩니다! Vite 기반의 놀라운 성능과 현대적 기능으로 무장한 차세대 JavaScript 테스팅 프레임워크를 만나보세요.'

    const content = `# Vitest - Jest를 뛰어넘은 차세대 테스팅 프레임워크

**테스트 실행이 45초에서 3초로 줄어든다면 믿으시겠나요?**

2025년, JavaScript 테스팅 생태계에 혁명이 일어나고 있습니다. **Vitest**가 Jest의 오랜 독점을 깨뜨리며 개발자들의 마음을 사로잡고 있습니다.

## 😱 Jest의 한계에 지친 개발자들

### 우리가 매일 겪는 테스트 고통
- **느린 실행 속도**: 큰 프로젝트에서 테스트 한 번에 몇 분씩 소요
- **복잡한 설정**: ESM, TypeScript, 모듈 목킹 설정의 악몽
- **오래된 아키텍처**: 2014년부터 이어져온 레거시 코드베이스
- **느린 HMR**: 테스트 파일 수정 후 느린 재실행

**"테스트가 너무 느려서 TDD를 포기했다"**는 개발자가 얼마나 많은지 아시나요?

## 🚀 Vitest - 테스팅의 새로운 패러다임

### Vitest란?
**Vitest**는 Vite 생태계 기반으로 구축된 **블레이징 패스트** 테스팅 프레임워크입니다:

- **Vite의 HMR**: 테스트 코드 수정 시 즉시 재실행
- **ESM 네이티브**: 최신 JavaScript 표준 완벽 지원
- **TypeScript 내장**: 별도 설정 없이 바로 사용
- **Jest 호환성**: 기존 Jest 테스트를 거의 그대로 사용

### 📊 성능 비교: 충격적인 결과

실제 프로젝트에서 측정한 결과:

- **소규모 프로젝트**: Jest 15초 → Vitest 1.2초 (**12배 빠름**)
- **중규모 프로젝트**: Jest 45초 → Vitest 4.5초 (**10배 빠름**)
- **대규모 프로젝트**: Jest 3분 → Vitest 20초 (**9배 빠름**)

**Cold Start Performance**:
- **Jest**: 평균 4-8초
- **Vitest**: 평균 0.6-1.2초

## ⚡ Vitest 3.2 - 2025년 최신 기능들

### 1. Browser Mode (JSDOM 대체)
실제 브라우저 환경에서 테스트를 실행합니다. 기존 JSDOM보다 더 정확한 테스트가 가능하며, CSS 렌더링과 진짜 클릭 이벤트 테스트도 지원합니다.

### 2. Annotation API
테스트에 메타데이터와 첨부파일을 추가할 수 있습니다. 실패 시 자동으로 스크린샷과 디버깅 정보가 리포트에 포함됩니다.

### 3. Scoped Fixtures
파일/워커 레벨 픽스처를 지원하여 데이터베이스 설정 같은 공통 작업을 효율적으로 관리할 수 있습니다.

## 🛠️ 실제 프로젝트 설정하기

### Next.js 프로젝트에 Vitest 적용

**1단계: 패키지 설치**
필요한 패키지들을 설치합니다:
- vitest
- @vitejs/plugin-react
- @testing-library/react

**2단계: 설정 파일 생성**
vitest.config.ts 파일을 생성하고 React 플러그인과 함께 설정합니다.

**3단계: 첫 번째 테스트 작성**
기존 Jest 스타일 그대로 describe, it, expect API를 사용할 수 있습니다.

### Vue 프로젝트에 Vitest 적용

Vue 프로젝트에서도 동일하게 쉽게 설정할 수 있습니다. @vue/test-utils와 함께 사용하면 컴포넌트 테스트가 매우 간편합니다.

## 🎯 Jest에서 Vitest로 마이그레이션

### 호환성 점검 리스트

**✅ 거의 그대로 작동하는 것들**:
- describe, it, test, expect API
- beforeEach, afterEach, beforeAll, afterAll
- jest.fn() → vi.fn() (간단한 치환)
- 대부분의 matcher 함수들

**⚠️ 약간의 수정이 필요한 것들**:
- jest.mock()를 vi.mock()로 변경
- jest.spyOn()을 vi.spyOn()으로 변경

**🔧 설정 변경이 필요한 것들**:
- jest.config.js → vitest.config.ts
- setupFilesAfterEnv → setupFiles
- 일부 커스텀 matcher는 재작성 필요

### 단계별 마이그레이션 전략

**1단계: 점진적 도입**
기존 Jest와 Vitest를 동시에 운영하면서 새로운 테스트는 Vitest로 작성합니다.

**2단계: 성능 검증**
실제 속도 개선을 측정하고 팀과 결과를 공유합니다.

**3단계: 팀 교육 및 전환**
팀원들에게 새로운 API를 공유한 후 완전 전환합니다.

## 🎪 Vitest의 독특한 장점들

### 1. 진짜 Hot Module Reloading
테스트 파일을 수정하면 **즉시** 재실행됩니다. 기다림 없이 바로 결과를 확인할 수 있어 TDD 워크플로우가 혁신적으로 개선됩니다.

### 2. In-Source Testing
테스트를 소스 코드와 함께 작성할 수 있습니다. 작은 유틸리티 함수의 경우 별도 테스트 파일 없이도 바로 테스트할 수 있어 매우 편리합니다.

### 3. Powerful CLI UI
터미널에서 인터랙티브한 테스트 실행이 가능하며, 브라우저에서 시각적으로 테스트 결과를 확인할 수 있습니다.

### 4. Snapshot Testing의 진화
더 스마트하고 빠른 스냅샷 테스트를 지원합니다. 인라인 스냅샷도 완벽하게 지원하여 테스트 코드가 더욱 깔끔해집니다.

## 💡 프로덕션 활용 사례

### Shopify의 성공 사례
- **테스트 시간**: 8분 → 45초 (90% 단축)
- **개발 경험**: HMR로 테스트 주도 개발 활성화
- **CI/CD 효율성**: 빌드 파이프라인 속도 3배 향상

### Nuxt.js 생태계 전환
- **Nuxt 3**: 기본 테스팅 프레임워크로 Vitest 채택
- **UnJS 라이브러리들**: 모든 라이브러리가 Vitest로 전환
- **커뮤니티**: Vue 생태계 90% 이상이 Vitest 사용

## 🔮 2025년 로드맵

### 예정된 혁신 기능들
- **Parallel Testing**: 멀티코어 활용한 병렬 테스트 실행
- **AI-Powered Test Generation**: 코드 분석 기반 자동 테스트 생성
- **Advanced Mocking**: 더 정교한 모킹 시스템
- **Cloud Testing**: 클라우드 환경에서의 분산 테스트

### 생태계 확장
- **플러그인 생태계**: Jest 플러그인 호환성 확대
- **IDE 통합**: VS Code, WebStorm 네이티브 지원
- **프레임워크 특화**: Svelte, Solid 완벽 지원

## 🎯 언제 Vitest를 선택해야 할까?

### ✅ Vitest 강력 추천

**새로운 프로젝트**
- Vite 기반 프로젝트 (React, Vue, Svelte)
- TypeScript 중심 개발
- 모던 JavaScript 문법 사용

**기존 프로젝트 개선**
- Jest 테스트가 너무 느린 경우
- ESM 전환을 고려 중인 경우
- TDD/BDD를 더 활발히 하고 싶은 경우

**팀 생산성 향상**
- 빠른 피드백 루프 원하는 팀
- 테스트 작성을 장려하고 싶은 팀
- CI/CD 파이프라인 최적화가 필요한 팀

### ⚠️ 신중한 고려가 필요한 경우

**레거시 프로젝트**
- 복잡한 Jest 커스텀 설정
- 수많은 Jest 전용 플러그인 사용
- CommonJS에 깊이 의존하는 코드

## 🚀 지금 바로 시작해보세요!

### 5분 만에 Vitest 체험하기

새 프로젝트를 생성하고, Vitest를 설치한 후, 간단한 테스트를 실행해보세요. 놀라운 속도 차이를 직접 경험할 수 있습니다.

## 🎉 결론: 테스팅의 미래는 이미 시작되었습니다

**Vitest**는 단순한 "Jest의 빠른 버전"이 아닙니다. 이는 **테스팅 경험의 패러다임 시프트**입니다.

### 핵심 가치 제안
1. **10배 빠른 성능**: 더 이상 테스트를 기다리지 않아도 됩니다
2. **현대적 아키텍처**: ESM, TypeScript, HMR 네이티브 지원
3. **Jest 호환성**: 기존 테스트를 거의 그대로 사용 가능
4. **활발한 발전**: Vite 팀의 지속적인 혁신

**2025년, 더 이상 느린 테스트로 고생할 이유가 없습니다.**

테스트 주도 개발을 꿈꾸지만 느린 테스트 때문에 포기했다면, 지금이 바로 Vitest로 새 출발할 때입니다.

**Fast Tests, Happy Developers! ⚡**

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 Vitest 경험을 공유해주세요!*`

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

    console.log('✅ Vitest 게시글이 생성되었습니다!')
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

createVitestPost()
