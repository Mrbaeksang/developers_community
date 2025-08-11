import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createBiomePost() {
  try {
    console.log('🚀 Biome 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Biome', 'ESLint', 'Prettier', 'Linter', 'Formatter']
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
      'biome-unified-linter-formatter-35x-faster-eslint-prettier-alternative'
    const title = 'Biome - ESLint + Prettier를 합쳐서 35배 빠르게! 🚀'
    const excerpt =
      '2025년 가장 주목받는 JavaScript 도구, Biome! ESLint와 Prettier를 하나로 통합하고 35배 더 빠른 성능을 자랑하는 Rust 기반 올인원 툴체인을 소개합니다.'

    const content = `# Biome - ESLint + Prettier의 완벽한 대체제

**코드 포맷팅에 4초 걸리던 걸 0.1초로 줄일 수 있다면?**

2025년, 프론트엔드 개발자들이 가장 열광하는 도구가 하나 있습니다. 바로 **Biome**입니다. ESLint와 Prettier로 고생했던 모든 개발자들을 위한 구원자가 드디어 나타났습니다.

## 🚨 JavaScript 툴링의 문제점

### 현재 우리가 겪고 있는 고통
- **설정 지옥**: .eslintrc, .prettierrc, 수십 개의 플러그인 설정
- **느린 속도**: 대형 프로젝트에서 ESLint 4.2초, Prettier 추가로 몇 초 더
- **충돌 문제**: ESLint와 Prettier 규칙이 서로 충돌하는 악몽
- **복잡한 의존성**: 수십 개의 dev dependencies로 인한 node_modules 비대화

우리 모두 경험한 이런 상황들, 이제 끝낼 시간입니다.

## 🌟 Biome - 모든 문제의 해결책

### Biome이란?
**Biome**은 JavaScript와 TypeScript 프로젝트를 위한 **올인원 툴체인**입니다:

- **포매터** (Prettier 대체)
- **린터** (ESLint 대체) 
- **파서** (TypeScript 네이티브 지원)
- **임포트 정리** (자동 정렬 및 그룹화)

**가장 중요한 점**: 모든 기능이 **Rust**로 작성되어 엄청나게 빠릅니다!

### 📊 성능 비교: 숫자가 말하는 진실

실제 벤치마크 결과를 보면 충격적입니다:

- **포매팅**: Prettier 대비 **35배 빠름** ⚡
- **린팅**: ESLint 대비 **15배 빠름** 🏃‍♂️
- **전체 체크**: 4.2초 → 0.6초 (약 **7배 개선**)

대형 프로젝트에서는 차이가 더욱 극명합니다:
- **GitLab**: 린팅 시간 75% 단축, 메모리 사용량 100배 감소
- **대규모 React 프로젝트**: 45초 → 3초 (15배 개선)

## 🔧 Biome의 혁신적 특징

### 1. 통합된 툴체인
더 이상 여러 도구를 조합할 필요 없습니다:

\`\`\`bash
# Before (ESLint + Prettier)
npm install eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
# + 수십 개의 추가 플러그인들...

# After (Biome)
npm install --save-dev --save-exact @biomejs/biome
\`\`\`

### 2. 제로 설정 시작
복잡한 설정 파일 없이 바로 시작:

\`\`\`bash
npx @biomejs/biome init
\`\`\`

이 한 줄이면 끝! biome.json 파일이 자동 생성되고 바로 사용할 수 있습니다.

### 3. 스마트 마이그레이션
기존 ESLint와 Prettier 설정을 자동으로 변환:

\`\`\`bash
# ESLint 설정 자동 마이그레이션
npx @biomejs/biome migrate eslint --write

# Prettier 설정 자동 마이그레이션  
npx @biomejs/biome migrate prettier --write
\`\`\`

### 4. 강력한 293개 린팅 규칙
ESLint의 핵심 규칙들을 모두 지원하면서 더욱 빠르게:

- **코드 품질**: 버그 가능성 높은 패턴 감지
- **베스트 프랙티스**: 권장사항 자동 적용
- **TypeScript 지원**: 별도 플러그인 없이 완벽 지원
- **React 지원**: JSX 문법 완벽 처리

## 🚀 실제 사용해보기

### 프로젝트 설정
\`\`\`bash
# 설치
npm install --save-dev --save-exact @biomejs/biome

# 초기화 (biome.json 생성)
npx @biomejs/biome init

# 포매팅 (쓰기 모드)
npx @biomejs/biome format --write .

# 린팅 (수정 가능한 것들 자동 수정)
npx @biomejs/biome lint --write .

# 모든 체크를 한 번에
npx @biomejs/biome check --write .
\`\`\`

### package.json 스크립트
\`\`\`json
{
  "scripts": {
    "format": "biome format --write .",
    "lint": "biome lint --write .",
    "check": "biome check --write .",
    "ci": "biome ci ."
  }
}
\`\`\`

### VSCode 확장 설치
VSCode에서 **Biome** 확장을 설치하면:
- 파일 저장 시 자동 포매팅
- 실시간 린팅 오류 표시
- 코드 액션으로 자동 수정

## 📈 지원하는 언어와 형식

### 완전 지원
- **JavaScript** (ES2015+)
- **TypeScript** (네이티브 지원)
- **JSX/TSX** (React 완벽 호환)
- **JSON** (설정 파일 포매팅)
- **CSS** (스타일시트 포매팅)
- **GraphQL** (쿼리 포매팅)

### 제한사항 (아직 미지원)
- HTML 파일
- Markdown 파일  
- SCSS/Sass 파일
- Vue/Svelte (부분 지원)

이런 제한사항들은 2025년 하반기 로드맵에 포함되어 있어 곧 해결될 예정입니다.

## 🎯 언제 Biome을 사용해야 할까?

### ✅ Biome 추천 상황

**새로운 프로젝트**
- React, Next.js, Vue 프로젝트
- TypeScript 중심 개발
- 빠른 개발 속도가 중요한 경우

**기존 프로젝트 개선**
- ESLint/Prettier 설정이 복잡한 경우
- CI/CD 파이프라인이 느린 경우
- 대형 모노레포 관리

**팀 협업**
- 일관된 코드 스타일 필요
- 신입 개발자 온보딩 간소화
- 설정 관리 부담 줄이기

### ⚠️ 신중하게 고려할 경우

**레거시 프로젝트**
- 수많은 커스텀 ESLint 플러그인 사용 중
- HTML/Markdown 파일이 많은 프로젝트
- Vue/Svelte가 메인인 프로젝트

## 💡 실무 활용 팁

### 점진적 마이그레이션 전략

**1단계: 개발 환경에서 테스트**
\`\`\`bash
# 기존 설정은 그대로 두고 Biome만 추가
npm install --save-dev @biomejs/biome
npx @biomejs/biome init
\`\`\`

**2단계: 성능 측정**
\`\`\`bash
# 기존 방식
time npm run lint && npm run format

# Biome 방식  
time npx @biomejs/biome check --write .
\`\`\`

**3단계: 팀 합의 후 전환**
\`\`\`bash
# 기존 설정 제거
npm uninstall eslint prettier @typescript-eslint/parser
# + 관련 플러그인들 정리

# package.json에서 관련 scripts 업데이트
\`\`\`

### CI/CD 최적화
\`\`\`yaml
# GitHub Actions 예시
- name: Code Quality Check
  run: npx @biomejs/biome ci .
\`\`\`

Biome의 ci 명령어는 포매팅과 린팅을 한 번에 체크하고, 문제가 있으면 빌드를 실패시킵니다.

## 🔮 Biome의 미래

### 2025년 로드맵
- **플러그인 시스템**: 커스텀 규칙 지원
- **추가 언어 지원**: HTML, Markdown, SCSS
- **프레임워크 특화**: Vue, Svelte 완전 지원
- **IDE 통합 확대**: WebStorm, Neovim 등

### 커뮤니티 성장
- GitHub Stars: 20.5K+ (급속 성장 중)
- NPM 주간 다운로드: 200만+ 
- Discord 활발한 커뮤니티

## 🎉 결론: 더 이상 망설일 이유가 없다

**Biome**은 단순한 도구가 아닙니다. 이는 JavaScript 개발 생산성의 **게임 체인저**입니다.

### Biome을 선택해야 하는 이유
1. **압도적인 성능**: 35배 빠른 포매팅, 15배 빠른 린팅
2. **간단한 설정**: 복잡한 config 파일들과 작별
3. **안정적인 품질**: Rust의 메모리 안전성과 성능
4. **미래 지향적**: 지속적인 발전과 커뮤니티 성장

**더 이상 ESLint + Prettier 설정으로 시간을 낭비하지 마세요.** 

코드 작성에 집중하고 싶다면, 지금 바로 Biome으로 전환하세요. 몇 분의 설정만으로 몇 시간의 개발 시간을 절약할 수 있습니다.

**Ready to Biome? 🌱**

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 Biome 경험을 공유해주세요!*`

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

    console.log('✅ Biome 게시글이 생성되었습니다!')
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

createBiomePost()
