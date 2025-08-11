import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createVite6Post() {
  try {
    console.log('🚀 Vite 6 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Vite', 'Bundle', 'Build', 'Rolldown', 'Performance']
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
    const slug = 'vite-6-next-generation-bundling-rolldown-rust-performance'
    const title = 'Vite 6 - 번들링의 미래, 체감 속도 10배 향상 🚀'
    const excerpt =
      '2025년 번들링 혁신의 중심, Vite 6와 Rolldown 출시! Rust 기반의 차세대 빌드 도구로 빌드 시간을 10배에서 50배까지 단축시키는 놀라운 성능 개선을 경험해보세요.'

    const content = `# Vite 6 - 번들링의 미래가 도착했습니다

**빌드 시간이 45초에서 2초로 줄어든다면 믿으시겠나요?** 

2025년, 프론트엔드 개발 생태계에서 가장 충격적인 소식이 전해졌습니다. **Vite 6**와 함께 등장한 **Rolldown**이 번들링의 패러다임을 완전히 바꿔놓았습니다.

## 🌟 Vite의 놀라운 성장

### 숫자가 말해주는 성공 스토리
- **주간 다운로드**: 750만 → 1,700만 (1년 새 2.3배 증가!)
- **생태계**: OpenAI, Google, Apple, Microsoft, NASA까지 사용
- **프레임워크 지원**: React, Vue, Svelte, Solid 등 모든 주요 프레임워크
- **커뮤니티**: 사상 최초로 Webpack 주간 다운로드 수 추월!

## ⚡ Rolldown: 게임을 바꾸는 혁신

### Rust의 힘으로 재탄생한 번들러

**Rolldown**은 단순한 업데이트가 아닙니다. Vite의 핵심을 **Rust**로 완전히 재작성한 차세대 번들러입니다.

### 🚀 실제 성능 개선 사례

실제 기업들이 경험한 놀라운 성능 개선:

- **GitLab**: 2분 30초 → 40초 (빌드 시간 75% 단축, 메모리 사용량 100배 감소!)
- **Excalidraw**: 22.9초 → 1.4초 (16배 개선)
- **PLAID Inc.**: 80초 → 5초 (16배 개선)
- **Appwrite**: 12분 → 3분 (4배 개선, 메모리 사용량 4배 감소)
- **Particl**: Vite 대비 10배, Next.js 대비 29배 빨라짐

## 🔧 기술적 혁신 포인트

### 1. esbuild에서 Oxc로의 전환
더 이상 esbuild에 의존하지 않습니다. **Oxc**가 모든 변환과 압축을 처리하여:
- 메모리 사용량 대폭 감소
- 더욱 빨라진 변환 속도
- 일관된 성능 보장

### 2. 드롭인 교체 가능
기존 Vite 프로젝트에서 즉시 사용할 수 있습니다:

\`\`\`json
{
  "dependencies": {
    "vite": "npm:rolldown-vite@latest"
  }
}
\`\`\`

또는 패키지 오버라이드 사용:

\`\`\`json
{
  "overrides": {
    "vite": "rolldown-vite"
  }
}
\`\`\`

### 3. Environment API의 진화
Vite 6는 **Environment API**를 더욱 발전시켜:
- 다중 환경 빌드 최적화
- 플러그인 간 협업 개선
- 더 나은 빌드 조정 기능

## 🎯 실무 활용 가이드

### 마이그레이션 체크리스트

**1단계: 호환성 확인**
대부분의 플러그인과 프레임워크가 호환되지만, 다음은 확인이 필요합니다:
- esbuild에 의존하는 플러그인
- 커스텀 Rollup 설정
- 특수한 변환 로직

**2단계: 점진적 도입**
\`\`\`bash
# 개발 환경에서 먼저 테스트
npm install rolldown-vite

# 빌드 성능 측정
npm run build -- --profile
\`\`\`

**3단계: 성능 모니터링**
\`\`\`javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 청크 분할 최적화
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
}
\`\`\`

## 🌐 생태계의 변화

### 새로운 프레임워크들의 합류
2025년에 Vite 생태계에 합류한 주목할 프레임워크들:
- **TanStack Start**: React Server Components 지원
- **One**: 풀스택 React 프레임워크
- **Ember**: 클래식 프레임워크의 현대적 재탄생

### ViteConf 2025: 실제 만나는 첫 번째 컨퍼런스
- **날짜**: 2025년 10월 9-10일
- **장소**: 암스테르담
- **특별 이벤트**: Vite+ 공개, Vite 다큐멘터리 세계 최초 공개

## 🔮 Vite+: 차세대 개발 경험

**Vite+**라는 신비로운 프로젝트가 ViteConf 2025에서 공개될 예정입니다. 현재까지 공개된 정보:
- 팀 개발 경험(DX) 개선에 중점
- 에이전트 기반 개발 환경
- 차세대 웹 개발 도구

## 💡 개발자를 위한 실용적 팁

### 성능 최적화 전략

**청크 분할 최적화**:
\`\`\`javascript
// 스마트 청크 분할로 초기 로딩 시간 단축
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom'],
          'vendor-ui': ['@mui/material', 'styled-components'],
          'vendor-utils': ['lodash', 'date-fns']
        }
      }
    }
  }
})
\`\`\`

**개발 서버 최적화**:
\`\`\`javascript
export default defineConfig({
  server: {
    warmup: {
      clientFiles: ['./src/components/**/*.tsx']
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
\`\`\`

## 🎪 왜 지금 Vite인가?

### 1. 검증된 안정성
- **Fortune 500 기업들의 선택**: NASA부터 OpenAI까지
- **활발한 커뮤니티**: 매주 1,700만 다운로드
- **지속적인 혁신**: VoidZero를 통한 장기 투자

### 2. 미래 지향적 설계
- **Rust 기반 성능**: 네이티브 수준의 빌드 속도
- **웹 표준 준수**: ESM, Web Workers, 최신 브라우저 API
- **프레임워크 중립**: 어떤 프론트엔드 프레임워크와도 완벽 호환

### 3. 개발 생산성
- **HMR의 진화**: 거의 즉시 반영되는 코드 변경사항
- **플러그인 생태계**: 수천 개의 검증된 플러그인
- **TypeScript 네이티브 지원**: 별도 설정 없이 바로 사용

## 🚀 시작해보세요!

\`\`\`bash
# 새 프로젝트 시작
npm create vite@latest my-app

# Rolldown 체험해보기
npm create vite@latest my-app -- --template react-rolldown

# 기존 프로젝트에 적용
npm install rolldown-vite
\`\`\`

## 🎯 결론: 번들링의 새로운 시대

**Vite 6**와 **Rolldown**의 등장은 단순한 도구 업데이트가 아닙니다. 이는 웹 개발 생산성의 **패러다임 시프트**입니다.

**더 이상 빌드를 기다리지 마세요.** 코드를 작성하는 시간보다 빌드 시간이 더 길다면, 지금이 바로 Vite로 전환할 때입니다.

2025년, **빌드 시간은 더 이상 제약이 아닙니다.** Vite 6와 함께라면 아이디어에서 배포까지의 시간을 극적으로 단축시킬 수 있습니다.

**지금 바로 시작해보세요.** 여러분의 개발 경험이 어떻게 변하는지 직접 확인해보세요! 🌟

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 Vite 경험을 공유해주세요!*`

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

    console.log('✅ Vite 6 게시글이 생성되었습니다!')
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

createVite6Post()
