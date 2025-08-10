# 🤖 AI 에이전트를 위한 단일 게시글 생성 스크립트 지시문

## 🎯 작업 개요

AI 에이전트가 **고품질 단일 게시글 생성 스크립트**를 자동으로 작성할 수 있도록 하는 명확한 지시문입니다.

## 📋 필수 사전 작업

**AI 에이전트는 스크립트 작성 전 반드시 다음 파일들을 순서대로 읽어야 합니다:**

1. **prisma/schema.prisma** - MainPost, MainTag, MainPostTag 모델 구조 확인
2. **scripts/create-vibe-coding-post.ts** - 단일 게시글 생성 패턴 참고 (필수!)

## 🔑 필수 상수 정보

**모든 스크립트에서 사용할 상수 (복사해서 사용):**

```typescript
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'  // 관리자 ID
const ADMIN_ROLE = 'ADMIN'                         // GlobalRole.ADMIN

// 랜덤 조회수 생성 함수
const getRandomViewCount = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min
```

**카테고리별 ID 매핑:**

```typescript
const CATEGORIES = {
  '바이브코딩': {
    id: 'cme5a5vyt0003u8ww9aoazx9f',
    viewRange: { min: 300, max: 500 }
  },
  'AI뉴스': {
    id: 'cme5a3ysr0002u8wwwmcbgc7z',
    viewRange: { min: 300, max: 500 }
  },
  'Frontend': {
    id: 'cmdrfyb5f0000u8fsih05gxfk',
    viewRange: { min: 100, max: 250 }
  },
  '오픈소스': {
    id: 'cme5a7but0004u8ww8neir3k3',
    viewRange: { min: 100, max: 250 }
  },
  'Backend': {
    id: 'cmdrfybll0002u8fseh2edmgf',
    viewRange: { min: 100, max: 250 }
  },
  'DevOps': {
    id: 'cme5a1b510000u8ww82cxvzzv',
    viewRange: { min: 50, max: 150 }
  },
  'Database': {
    id: 'cme5a2cf40001u8wwtm4yvrw0',
    viewRange: { min: 50, max: 150 }
  }
}
```

## 🤖 AI 에이전트 실행 명령어

### 사용자가 다음과 같이 요청하면:

**"AI 뉴스 게시글 1개 생성해줘"** 또는 **"AI 뉴스 카테고리 게시글 생성해줘"**

**AI 에이전트는 즉시 다음을 수행:**

1. **필수 파일 2개를 먼저 읽기** (prisma/schema.prisma, create-vibe-coding-post.ts)
2. **scripts/create-single-ai-news-post.ts 파일 생성**
3. **AI뉴스 카테고리 정보 사용**: ID `cme5a3ysr0002u8wwwmcbgc7z`, 조회수 300-500
4. **MCP 도구를 사용해서 최신 AI 뉴스 트렌드 수집** (필수!)
5. **흥미롭고 클릭유도적인 게시글 1개 생성**

## 📝 단일 게시글 스크립트 생성 템플릿

**AI 에이전트는 반드시 이 구조를 따라 생성하세요:**

```typescript
import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createSingleAINewsPost() {
  const categoryId = 'cme5a3ysr0002u8wwwmcbgc7z' // AI뉴스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy'   // 관리자 사용자

  const title = '2025년 AI 개발 트렌드: 무엇이 바뀌고 있나?'
  const content = `# 2025년 AI 개발 트렌드: 무엇이 바뀌고 있나?

## 🚀 2025년 AI 개발의 새로운 패러다임

2025년 AI 개발 분야는 그 어느 때보다 빠르게 변화하고 있습니다. 특히 생성형 AI의 발전과 함께 개발자들의 워크플로우가 근본적으로 바뀌고 있죠.

## 🎯 주요 트렌드 분석

### 1. AI 기반 코드 생성의 진화
- **GitHub Copilot X**: 단순한 자동완성을 넘어선 전체 기능 구현
- **Cursor AI**: 자연어로 전체 애플리케이션 개발
- **ChatGPT Code Interpreter**: 실시간 코드 실행 및 디버깅

### 2. 바이브 코딩의 대중화
바이브 코딩(Vibe Coding)은 2025년 가장 주목받는 개발 방법론입니다:
- 자연어 기반 개발 요청
- AI와의 실시간 협업
- 빠른 프로토타이핑과 반복 개선

## 💡 실무 적용 팁

### AI 도구 활용법
\`\`\`javascript
// AI에게 효과적으로 요청하는 방법
const request = "React와 TypeScript를 사용해서 사용자 인증이 있는 대시보드를 만들어줘. JWT 토큰 관리와 로그아웃 기능도 포함해서."

// 결과: 완전한 기능을 가진 컴포넌트 생성
\`\`\`

### 개발 생산성 향상
- **10-50배 빠른 프로토타이핑** 가능
- 복잡한 비즈니스 로직 구현 시간 단축
- 반복적인 CRUD 작업 자동화

## ⚡ 성능과 품질 관리

AI 생성 코드의 품질을 높이는 방법:
1. **명확한 요구사항 정의**
2. **단계별 검증 과정**
3. **코드 리뷰 및 테스트 자동화**
4. **보안 취약점 검토**

## 🔮 미래 전망

2025년 하반기 예상되는 변화:
- 도메인별 특화 AI 모델 등장
- 실시간 협업 개발 환경 구축
- AI 기반 코드 최적화 도구 발전

## 🎯 결론

AI 개발 도구는 더 이상 선택이 아닌 필수가 되었습니다. 하지만 기본적인 프로그래밍 지식과 문제 해결 능력은 여전히 중요합니다.

성공적인 AI 협업 개발을 위해서는:
- 명확한 커뮤니케이션 능력
- 코드 품질에 대한 이해
- 지속적인 학습 자세

앞으로도 더 혁신적인 AI 개발 도구들이 등장할 것으로 기대됩니다! 🚀

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 AI 개발 경험을 공유해주세요!*`

  const excerpt = '2025년 AI 개발 분야의 주요 트렌드와 변화를 심층 분석합니다. 바이브 코딩부터 AI 기반 코드 생성까지, 개발자가 알아야 할 최신 동향을 소개합니다.'

  const slug = '2025-ai-development-trends-analysis'

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
        approvedAt: new Date(),
        approvedById: authorId,
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: Math.floor(Math.random() * 201) + 300, // 300-500
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
      { name: '트렌드', slug: 'trend', color: '#f59e0b' },
      { name: '바이브 코딩', slug: 'vibe-coding', color: '#06b6d4' },
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
createSingleAINewsPost()
  .then(() => {
    console.log('🎉 AI 뉴스 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
```

## 📋 게시글 콘텐츠 요구사항

**AI 에이전트는 반드시 다음을 준수하세요:**

### 필수 품질 기준
- **제목**: 50자 이내, SEO 최적화, 클릭 유도적
- **본문**: 1500자 이상, 마크다운 형식, 코드 예시 포함
- **excerpt**: 150자 이내 요약
- **slug**: URL 친화적, 고유값 (날짜나 고유 키워드 포함)
- **viewCount**: 지정된 범위 내 랜덤값
- **태그**: 3-5개, 카테고리 관련

### 콘텐츠 스타일
- **전문성**: 개발자가 흥미로워할 내용
- **실용성**: 실무에 도움되는 정보
- **최신성**: 2025년 현재 트렌드 반영
- **흥미성**: 지나칠 수 없는 매력적인 내용

## 🔄 다른 카테고리 요청 처리

### Frontend 카테고리 요청
**"Frontend 게시글 1개 생성해줘"**
- 파일: `scripts/create-single-frontend-post.ts`
- 카테고리 ID: `cmdrfyb5f0000u8fsih05gxfk`
- 조회수: 100-250

### Backend 카테고리 요청
**"Backend 게시글 1개 생성해줘"**
- 파일: `scripts/create-single-backend-post.ts`
- 카테고리 ID: `cmdrfybll0002u8fseh2edmgf`
- 조회수: 100-250

### 오픈소스 카테고리 요청
**"오픈소스 게시글 1개 생성해줘"**
- 파일: `scripts/create-single-opensource-post.ts`
- 카테고리 ID: `cme5a7but0004u8ww8neir3k3`
- 조회수: 100-250

### DevOps 카테고리 요청
**"DevOps 게시글 1개 생성해줘"**
- 파일: `scripts/create-single-devops-post.ts`
- 카테고리 ID: `cme5a1b510000u8ww82cxvzzv`
- 조회수: 50-150

### Database 카테고리 요청
**"Database 게시글 1개 생성해줘"**
- 파일: `scripts/create-single-database-post.ts`
- 카테고리 ID: `cme5a2cf40001u8wwtm4yvrw0`
- 조회수: 50-150

### 바이브 코딩 카테고리 요청
**"바이브 코딩 게시글 1개 생성해줘"**
- 파일: `scripts/create-single-vibe-coding-post.ts`
- 카테고리 ID: `cme5a5vyt0003u8ww9aoazx9f`
- 조회수: 300-500

## ✅ AI 에이전트 체크리스트

**스크립트 생성 시 반드시 확인해야 할 항목:**

### 1. 기술적 정확성
- [ ] PrismaClient import 올바름
- [ ] PostStatus, GlobalRole enum 사용
- [ ] async/await 올바른 사용
- [ ] try-catch 에러 처리
- [ ] prisma.$disconnect() 포함

### 2. 데이터 품질
- [ ] 게시글 1500자 이상
- [ ] 마크다운 문법 정확
- [ ] 코드 블록 올바른 이스케이프 (`\`\`\``)
- [ ] slug 고유성 보장
- [ ] 카테고리 ID 정확

### 3. 콘텐츠 품질
- [ ] 제목이 흥미롭고 클릭유도적
- [ ] 본문이 전문적이고 실용적
- [ ] 최신 트렌드 반영
- [ ] 개발자에게 유용한 정보

### 4. 태그 및 메타데이터
- [ ] upsert로 태그 처리
- [ ] postCount 정확히 증가
- [ ] MainPostTag 관계 생성
- [ ] SEO 메타데이터 설정

### 5. 사용자 경험
- [ ] 성공/실패 메시지 출력
- [ ] 진행상황 로깅
- [ ] 적절한 에러 처리

## 🚀 MCP 도구 활용 지시사항

**AI 에이전트는 반드시 MCP 도구를 사용해서:**

1. **최신 트렌드 조사**: 해당 카테고리의 2025년 최신 트렌드
2. **실제 데이터 수집**: 실제 도구, 라이브러리, 기술 정보
3. **흥미로운 주제 발굴**: 개발자들이 관심 가질만한 주제
4. **실용적 정보 포함**: 실무에 바로 적용 가능한 내용

## 💡 성공적인 스크립트 생성을 위한 팁

### DO (해야 할 것)
- ✅ MCP로 최신 정보 수집 후 콘텐츠 작성
- ✅ 기존 샘플 파일(create-vibe-coding-post.ts)의 패턴 정확히 따르기
- ✅ 전문 블로거 수준의 흥미로운 제목 작성
- ✅ 실무 경험이 녹아든 실용적 내용
- ✅ 코드 예시와 구체적인 팁 포함
- ✅ 단일 게시글 집중으로 품질 극대화

### DON'T (하지 말 것)
- ❌ MCP 없이 추측으로 콘텐츠 작성
- ❌ 기존 패턴 무시하고 임의로 구조 변경
- ❌ 평범하고 재미없는 제목 사용
- ❌ 너무 이론적이고 추상적인 내용
- ❌ 코드 예시 없는 설명 위주 콘텐츠
- ❌ 여러 게시글을 한 번에 생성하려고 시도

---

## 📞 결론

**이 지시문을 통해 새로운 AI 에이전트도 즉시 고품질의 단일 게시글 생성 스크립트를 작성할 수 있습니다.**

사용자가 "○○ 카테고리 게시글 1개 생성해줘"라고 요청하면:
1. 필수 파일들 읽기 (schema.prisma, create-vibe-coding-post.ts)
2. MCP로 최신 트렌드 수집  
3. 해당 카테고리 정보 확인
4. 템플릿 구조 따라 스크립트 생성
5. 흥미롭고 실용적인 고품질 콘텐츠 작성

**품질에 집중한 단일 게시글 스크립트가 생성됩니다! 🚀**