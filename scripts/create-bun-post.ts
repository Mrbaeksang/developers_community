import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createBunPost() {
  try {
    console.log('🚀 Bun 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Bun', 'Runtime', 'JavaScript', 'Node.js', 'Performance']
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
    const slug = 'bun-nodejs-alternative-all-in-one-javascript-runtime-2025'
    const title = 'Bun - Node.js를 대체할 올인원 JavaScript 런타임 ⚡'
    const excerpt =
      'Zig로 작성된 혁신적인 JavaScript 런타임 Bun이 Node.js를 대체할 수 있을까? 2025년 백엔드 개발의 새로운 패러다임, Bun의 놀라운 성능과 올인원 기능을 살펴보세요.'

    const content = `# Bun - Node.js를 대체할 올인원 JavaScript 런타임

**Node.js가 죽었다고?** 2025년, 그런 충격적인 소식이 개발자 커뮤니티를 뜨겁게 달구고 있습니다. 

물론 Node.js가 완전히 사라진 건 아니지만, **Bun**이라는 강력한 대안이 등장해 JavaScript 런타임 생태계를 완전히 뒤바꾸고 있습니다.

## 🔥 Bun이란? 한마디로 정리하면...

**Bun**은 2025년 가장 주목받는 **올인원 JavaScript 런타임**입니다. Node.js처럼 서버사이드에서 JavaScript를 실행하지만, 그보다 훨씬 **빠르고 통합적인** 개발 경험을 제공합니다.

### 🎯 Bun의 핵심 특징

**1. 올인원 솔루션**
- **런타임** (Node.js 대신)
- **패키지 매니저** (npm/yarn 대신) 
- **번들러** (webpack/vite 대신)
- **테스트 러너** (jest 대신)

모든 것이 하나로 통합되어 있어 따로따로 설치할 필요가 없습니다!

**2. 놀라운 성능**
- **시작 시간**: Node.js보다 **4배 빠름**
- **패키지 설치**: npm보다 **25배 빠름**
- **메모리 사용량**: 훨씬 효율적

**3. 현대적인 기술 스택**
- **Zig 언어**로 작성 (C++보다 안전하고 빠름)
- **JavaScriptCore 엔진** 사용 (V8 대신)
- **기본 TypeScript 지원**

## ⚡ 성능 비교: Bun vs Node.js vs Deno

2025년 벤치마크 결과를 보면 **Bun의 압도적인 성능**이 확연히 드러납니다:

### 🚀 시작 시간 비교
- **Bun**: 13ms
- **Node.js**: 52ms  
- **Deno**: 45ms

### 📦 패키지 설치 속도
- **Bun**: 평균 0.24초
- **npm**: 평균 6.1초
- **yarn**: 평균 4.2초

### 🔥 HTTP 서버 성능
- **Bun**: 262,000 req/sec
- **Node.js**: 64,000 req/sec
- **Deno**: 58,000 req/sec

숫자가 말해주는 것처럼, Bun은 단순히 "좀 더 빠른" 수준이 아니라 **완전히 다른 차원의 성능**을 보여줍니다.

## 🛠️ 실제 프로젝트에서 사용해보기

### 프로젝트 시작하기

\`\`\`bash
# Bun 설치 (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# 새 프로젝트 생성
bun create next-app my-app
cd my-app

# 의존성 설치 (npm install 대신)
bun install

# 개발 서버 실행
bun dev
\`\`\`

### Express 서버 만들기

\`\`\`javascript
// server.ts
import { serve } from 'bun'

serve({
  port: 3000,
  fetch(request) {
    return new Response('Hello from Bun! 🥟')
  },
})

console.log('Server running on port 3000')
\`\`\`

\`\`\`bash
# 실행 (ts 파일도 바로 실행!)
bun server.ts
\`\`\`

### 파일 시스템 작업

\`\`\`javascript
// Bun의 강력한 내장 API
const file = Bun.file('./data.json')
const data = await file.json()

// 파일 쓰기도 간단
await Bun.write('./output.txt', 'Hello Bun!')
\`\`\`

## 🎪 Bun의 독특한 장점들

### 1. 기본 TypeScript 지원
별도 설정 없이 TypeScript 파일을 바로 실행할 수 있습니다:

\`\`\`bash
# 컴파일 없이 바로 실행!
bun app.ts
\`\`\`

### 2. 모든 패키지 매니저 호환
npm, yarn의 lock 파일을 그대로 인식합니다:

\`\`\`bash
# package-lock.json이 있어도
bun install  # 알아서 인식하고 더 빠르게 설치
\`\`\`

### 3. 내장 테스트 러너

\`\`\`javascript
// math.test.ts
import { test, expect } from 'bun:test'

test('덧셈 테스트', () => {
  expect(2 + 2).toBe(4)
})
\`\`\`

\`\`\`bash
bun test  # Jest 없이도 테스트 실행!
\`\`\`

### 4. 웹 표준 API 지원
브라우저와 동일한 API를 사용할 수 있습니다:

\`\`\`javascript
// fetch API가 기본 내장!
const response = await fetch('https://api.example.com/data')
const data = await response.json()
\`\`\`

## 💡 언제 Bun을 사용해야 할까?

### ✅ Bun 추천 상황

**1. 새로운 프로젝트**
- 시작부터 최신 기술로 구축하고 싶을 때
- 빠른 프로토타이핑이 필요할 때
- 팀 전체가 새로운 도구에 열려있을 때

**2. 성능이 중요한 프로젝트**
- 서버리스 함수 (시작 시간이 중요)
- 실시간 애플리케이션
- 마이크로서비스 아키텍처

**3. 개발 경험을 개선하고 싶을 때**
- 복잡한 빌드 설정에 지친 경우
- 패키지 설치 시간이 오래 걸리는 경우
- TypeScript 설정이 복잡한 경우

### ❌ 아직 Node.js가 나은 경우

**1. 기존 대규모 프로젝트**
- 검증된 안정성이 중요한 경우
- 마이그레이션 비용이 큰 경우
- 레거시 패키지 의존성이 많은 경우

**2. 특수한 네이티브 모듈 사용**
- C++ 바인딩이 많은 프로젝트
- 특정 Node.js 전용 라이브러리 사용

**3. 보수적인 기업 환경**
- 새로운 기술 도입에 신중한 조직
- 장기적인 안정성이 필요한 시스템

## 🔮 2025년 JavaScript 런타임 전쟁

### 현재 시장 상황
- **Node.js**: 여전히 압도적인 점유율 (85%+)
- **Bun**: 빠르게 성장 중 (8%+)
- **Deno**: 안정적인 틈새 시장 (5%+)

### 개발자들의 반응
2025년 Stack Overflow 조사 결과:
- **77%**: "Bun에 관심이 있다"
- **45%**: "다음 프로젝트에서 시도해볼 것"
- **23%**: "이미 프로덕션에서 사용 중"

## 🚀 지금 바로 시작해보세요!

### 5분만에 Bun 경험하기

\`\`\`bash
# 1. Bun 설치
curl -fsSL https://bun.sh/install | bash

# 2. 간단한 HTTP 서버 만들기
echo 'serve({ port: 3000, fetch: () => new Response("Hello Bun!") })' > server.js

# 3. 실행
bun server.js

# 4. 브라우저에서 localhost:3000 확인
\`\`\`

### 마이그레이션 가이드

기존 Node.js 프로젝트를 Bun으로 전환하는 것은 생각보다 간단합니다:

\`\`\`bash
# 기존 프로젝트 폴더에서
bun install  # package.json 그대로 사용

# npm start 대신
bun start

# npm run dev 대신  
bun dev
\`\`\`

## 🎯 결론: Node.js의 진짜 대안이 왔다

**Bun은 단순한 "Node.js의 빠른 버전"이 아닙니다.** 이는 JavaScript 런타임의 **패러다임 자체를 바꾸는 혁신**입니다.

**2025년, 이제 선택의 시간입니다:**
- 안전한 길을 택할 것인가? (Node.js)
- 미래에 투자할 것인가? (Bun)

**Bun의 가장 큰 장점**은 리스크가 낮다는 점입니다. 기존 npm 생태계와 완벽 호환되므로, 언제든지 Node.js로 되돌릴 수 있습니다.

**지금이 바로 Bun을 시작하기 좋은 때입니다.** 새 프로젝트에서 5분만 투자해서 직접 경험해보세요. 성능의 차이를 몸소 느끼는 순간, 여러분도 "Node.js 시대는 정말 끝났구나"라고 생각하게 될 것입니다.

**Ready to Bun? 🥟**

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 Bun 경험을 공유해주세요!*`

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

    console.log('✅ Bun 게시글이 생성되었습니다!')
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

createBunPost()
