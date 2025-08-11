import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createZodPost() {
  try {
    console.log('🚀 Zod 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Zod', 'TypeScript', 'Validation', 'Runtime', 'Schema']
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
      'zod-typescript-runtime-validation-schema-first-data-validation-library-2025'
    const title = 'Zod - TypeScript만으론 부족해, 런타임 타입 검증 🛡️'
    const excerpt =
      '컴파일 타임 안전성은 기본, 런타임 검증까지! OpenAI와 Vercel이 선택한 Zod로 완벽한 데이터 안전성을 보장하세요. AI 시대의 필수 라이브러리를 만나보세요.'

    const content = `# Zod - 런타임에서도 안전한 TypeScript

**컴파일은 성공했는데 프로덕션에서 터진다고?**

TypeScript의 타입 시스템은 강력하지만 한계가 있습니다. 컴파일 타임에만 존재하는 타입들은 런타임에서 외부 API나 사용자 입력을 만날 때 무력해집니다. 2025년, **Zod**가 이 문제를 완벽하게 해결합니다.

## 🚨 TypeScript의 숨겨진 함정

### 우리가 매일 마주하는 런타임 에러들
- **API 응답 변경**: 백엔드가 필드를 바꿨는데 프론트엔드는 모르는 상황
- **사용자 입력 검증**: Form 데이터가 예상과 다른 타입으로 들어오는 경우
- **환경 변수**: .env 파일의 값이 예상한 형식과 다른 문제
- **외부 라이브러리**: Third-party API 응답의 예측 불가능한 구조

\`\`\`
// TypeScript는 이런 걸 못 잡아요 😱
interface User {
  id: number;
  name: string;
  email: string;
}

// API에서 받아온 데이터라고 가정
const userData = await fetch('/api/user').then(r => r.json());
const user: User = userData; // 🚨 런타임에 터질 가능성 100%

// id가 문자열로 오거나, email이 없거나, 추가 필드가 있을 수도...
\`\`\`

**"타입스크립트를 쓰는데 왜 여전히 런타임 에러가?"** 이 질문의 답이 바로 Zod입니다.

## 🛡️ Zod - 런타임 타입 안전성의 혁명

### Zod란?
**Zod**는 **TypeScript-first 스키마 검증 라이브러리**입니다:

- **스키마 정의**: 데이터 구조를 명확하게 선언
- **런타임 검증**: 실제 데이터가 스키마와 일치하는지 확인
- **타입 추론**: 스키마에서 TypeScript 타입을 자동 생성
- **변환 기능**: 데이터를 원하는 형태로 자동 변환

### 📊 업계 채택 현황: 모든 거대 기업이 사용하는 이유

**OpenAI부터 Vercel까지**, 2025년 가장 많이 사용되는 검증 라이브러리:

- **OpenAI**: GPT API 응답 검증에 사용
- **Vercel**: Next.js 프로젝트의 표준 검증 도구
- **tRPC**: 엔드투엔드 타입 안전성의 핵심 기술
- **Supabase**: 데이터베이스 스키마 검증에 활용

**GitHub 통계**:
- **Stars**: 33K+ (급속 성장)
- **NPM 다운로드**: 월 700만+
- **대기업 도입률**: 90% 이상

## ⚡ Zod의 핵심 기능들

### 1. 스키마부터 타입까지 한 번에
기존 방식과 Zod 방식을 비교해보세요:

기존의 번거로운 방식과 달리, Zod는 한 번의 스키마 정의로 검증과 타입을 모두 해결합니다.

### 2. 똑똑한 에러 처리
Zod는 정확히 어디서 무엇이 잘못되었는지 알려줍니다:

에러 위치와 이유를 정확히 알려주므로 디버깅이 매우 쉽습니다.

### 3. 데이터 변환의 마법
단순 검증을 넘어 데이터를 원하는 형태로 변환할 수 있습니다:

문자열을 숫자로, 날짜 문자열을 Date 객체로 자동 변환합니다.

### 4. 복잡한 스키마도 쉽게
중첩된 객체, 배열, 선택적 필드까지 모든 것을 표현할 수 있습니다:

실제 애플리케이션에서 사용하는 복잡한 데이터 구조도 쉽게 정의하고 검증할 수 있습니다.

## 🛠️ 실제 사용 시나리오

### API 응답 검증
외부 API를 안전하게 사용하는 방법:

API 응답을 받을 때마다 자동으로 검증하여 예상치 못한 에러를 방지합니다.

### Form 데이터 검증
사용자 입력을 안전하게 처리하는 방법:

React Hook Form, Formik 등 모든 form 라이브러리와 완벽하게 통합됩니다.

### 환경 변수 검증
애플리케이션 시작 시 환경 설정을 안전하게 검증:

앱이 시작될 때 필수 환경 변수가 모두 올바른 형태인지 확인할 수 있습니다.

## 🎯 고급 활용법

### 1. 커스텀 검증 규칙
비즈니스 로직에 특화된 검증을 만들 수 있습니다:

복잡한 비즈니스 규칙도 깔끔하게 검증 로직으로 구현할 수 있습니다.

### 2. 스키마 조합과 확장
기존 스키마를 재사용하고 확장할 수 있습니다:

코드 중복 없이 스키마를 조합하고 확장할 수 있어 유지보수성이 뛰어납니다.

### 3. 비동기 검증
데이터베이스나 API 호출이 필요한 검증도 가능합니다:

중복 이메일 체크, 외부 API 검증 등 실무에서 필요한 모든 검증을 구현할 수 있습니다.

### 4. 스키마 합성
여러 스키마를 조합하여 복잡한 데이터 구조를 만들 수 있습니다:

유연하고 재사용 가능한 스키마 구조를 만들 수 있습니다.

## 🚀 실무 통합 패턴

### Next.js API Routes
Next.js에서 API 엔드포인트를 안전하게 만드는 방법:

모든 API 요청과 응답을 자동으로 검증하여 런타임 에러를 완전히 방지합니다.

### React Query와 함께
데이터 페칭 라이브러리와의 완벽한 조합:

API 데이터를 안전하게 캐싱하고 상태 관리할 수 있습니다.

### tRPC 통합
엔드투엔드 타입 안전성의 완성:

프론트엔드부터 백엔드까지 완전한 타입 안전성을 보장받을 수 있습니다.

## 💡 성능과 번들 크기

### 최적화된 성능
Zod는 성능도 뛰어납니다:

- **파싱 속도**: JSON.parse와 비슷한 수준
- **메모리 사용량**: 최소한의 오버헤드
- **번들 크기**: Tree-shaking으로 사용한 부분만 번들에 포함
- **Zero Dependencies**: 외부 의존성 없이 깔끔한 설치

### 개발 경험
개발자 친화적인 설계:

- **IntelliSense 지원**: VS Code에서 완벽한 자동완성
- **에러 메시지**: 이해하기 쉬운 상세한 오류 설명
- **문서화**: 훌륭한 공식 문서와 예제들
- **생태계**: 수많은 헬퍼 라이브러리들

## 🌟 언제 Zod를 사용해야 할까?

### ✅ Zod 강력 추천

**모든 TypeScript 프로젝트**
- API를 사용하는 모든 애플리케이션
- 사용자 입력이 있는 모든 폼
- 환경 변수나 설정을 사용하는 프로젝트

**특히 중요한 경우**
- 외부 API 의존성이 높은 프로젝트
- 사용자 데이터가 중요한 애플리케이션
- 팀 프로젝트에서 API 계약 보장이 필요한 경우

**AI/ML 프로젝트**
- OpenAI API 응답 검증
- 복잡한 JSON 구조 파싱
- 모델 출력 데이터 검증

### ⚠️ 고려해볼 대안이 있는 경우

**매우 단순한 프로젝트**
- 외부 데이터 소스가 전혀 없는 경우
- 정적 데이터만 다루는 간단한 사이트
- 프로토타이핑 단계의 프로젝트

## 🔮 Zod의 미래와 로드맵

### 2025년 계획된 기능들
- **성능 개선**: 더 빠른 파싱 알고리즘
- **에러 개선**: 더 직관적인 에러 메시지
- **생태계 확장**: 더 많은 프레임워크 통합
- **개발자 도구**: 더 나은 디버깅 도구

### 커뮤니티와 생태계
활발한 오픈소스 생태계:

- **zod-to-json-schema**: OpenAPI 스키마 생성
- **zod-prisma**: Prisma 스키마와 동기화
- **zod-mock**: 테스트용 목 데이터 생성
- **@hookform/resolvers**: React Hook Form 통합

## 🎉 결론: 더 안전한 코드, 더 빠른 개발

**Zod**는 단순한 검증 라이브러리가 아닙니다. 이는 **TypeScript 개발의 패러다임 시프트**입니다.

### Zod가 가져다주는 가치
1. **런타임 안전성**: 컴파일 타임을 넘어선 완전한 타입 안전성
2. **개발 생산성**: 한 번 정의로 검증과 타입을 모두 해결
3. **코드 품질**: 명확한 데이터 계약과 에러 처리
4. **팀 협업**: API 변경사항을 즉시 감지하고 대응

**더 이상 "잘 될 거야"라는 희망에 의존하지 마세요.**

런타임에서도 안전하고, 팀워크가 향상되고, 사용자 경험이 개선되는 코드를 원한다면, 지금 바로 Zod를 시작하세요.

**Safe at compile time, safer at runtime! 🛡️**

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 Zod 활용 경험을 공유해주세요!*`

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

    console.log('✅ Zod 게시글이 생성되었습니다!')
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

createZodPost()
