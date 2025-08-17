# 🤖 AI 에이전트를 위한 단일 게시글 생성 스크립트 지시문

## 🎯 작업 개요

AI 에이전트가 **고품질 단일 게시글 생성 스크립트**를 자동으로 작성할 수 있도록 하는 명확한 지시문입니다.

## 🚨 절대 준수 사항 (CRITICAL)

**처음 보는 AI 에이전트라도 100% 성공할 수 있도록 다음을 반드시 따르세요:**

1. **절대 추측하지 말 것** - 모든 정보는 아래 문서에서 정확히 복사
2. **순서대로 진행** - 단계를 건너뛰면 100% 실패
3. **스키마 필드 완전 활용** - MainPost 테이블의 모든 필드 사용

## ⚠️ 블로그 콘텐츠 작성 원칙 (중요!)

**코드 블록 사용 규칙:**
- ✅ **실제 실행 가능한 코드**만 코드 블록 사용
- ✅ **터미널 명령어**만 코드 블록 사용
- ❌ **개념 설명을 코드로 표현 금지** (인터페이스, 엔룸, JSON으로 일상 개념 설명 금지)
- ❌ **비유나 분류를 코드로 표현 금지**
- ❌ **추상적 아이디어를 코드로 표현 금지**

**올바른 콘텐츠 예시:**
```
✅ 좋은 예: "개발자는 크게 프론트엔드, 백엔드, 풀스택으로 나뉩니다."
❌ 나쁜 예: interface DeveloperType { frontend: string; backend: string; }
```

## 📋 필수 사전 작업 (단계별 실행)

**AI 에이전트는 스크립트 작성 전 반드시 다음 파일들을 순서대로 읽어야 합니다:**

### 1단계: 스키마 구조 파악
```bash
# 반드시 실행: prisma/schema.prisma 읽기
# MainPost 모델의 모든 필드 확인 필수!
```

### 2단계: 기존 패턴 학습  
```bash
# 반드시 실행: scripts/create-vibe-coding-post.ts 읽기
# 정확한 코드 구조와 패턴 학습
```

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

**⚠️ 중요: 아래 템플릿을 정확히 복사하고, MainPost 스키마의 모든 필드를 반드시 포함하세요!**

### MainPost 스키마 필수 필드 체크리스트:
```typescript
// 🚨 반드시 포함해야 할 MainPost 필드들:
✅ id (자동생성)           ✅ title              ✅ content
✅ excerpt                ✅ slug               ✅ status 
✅ isPinned               ✅ viewCount          ✅ likeCount
✅ commentCount           ✅ metaTitle          ✅ metaDescription
✅ approvedAt             ✅ approvedById       ✅ rejectedReason
✅ createdAt (자동)       ✅ updatedAt (자동)    ✅ authorRole
✅ authorId               ✅ categoryId
```

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

2025년, 우리는 더 이상 모든 코드를 손으로 작성하지 않습니다. GitHub Copilot X는 이제 단순한 자동완성을 넘어 전체 기능을 구현할 수 있고, Cursor AI는 자연어만으로 애플리케이션을 만들어냅니다. ChatGPT Code Interpreter는 실시간으로 코드를 실행하고 디버깅까지 도와주죠.

### 2. 바이브 코딩의 대중화

바이브 코딩(Vibe Coding)이라는 말 들어보셨나요? 2025년 가장 핫한 개발 방법론입니다. 자연어로 개발 요청을 하고, AI와 실시간으로 협업하며, 빠르게 프로토타입을 만들고 개선하는 방식이죠. 마치 페어 프로그래밍을 하는 것처럼, 하지만 상대는 24시간 일하는 AI입니다.

## 💡 실무 적용 팁

### AI와 효과적으로 협업하기

실제로 AI를 활용해 개발할 때는 명확한 요구사항 전달이 핵심입니다. 예를 들어:

\`\`\`javascript
// 명확한 요구사항으로 AI에게 요청
const prompt = "React와 TypeScript를 사용한 대시보드 컴포넌트를 만들어줘. JWT 인증과 로그아웃 기능을 포함해서."

// AI가 생성한 코드를 검토하고 개선
\`\`\`

### 개발 생산성 향상

정말 놀라운 변화가 일어나고 있습니다. 이제 프로토타이핑이 10배에서 50배까지 빨라졌고, 복잡한 비즈니스 로직도 순식간에 구현됩니다. 그동안 지겨웠던 CRUD 작업은 AI가 알아서 처리해주니 우리는 더 창의적인 일에 집중할 수 있게 되었죠.

## ⚡ 성능과 품질 관리

물론 AI가 생성한 코드를 그대로 쓸 수는 없습니다. 품질을 높이려면 몇 가지 원칙을 지켜야 해요.

첫째, 요구사항을 명확하게 정의하세요. AI는 마법사가 아니라 여러분의 생각을 코드로 옮기는 도구입니다.
둘째, 단계별로 검증하세요. 한 번에 모든 걸 만들려 하지 말고 작은 단위로 나누어 확인하세요.
셋째, 코드 리뷰와 테스트는 필수입니다. AI도 실수할 수 있으니까요.
넷째, 특히 보안 취약점은 꼼꼼히 검토하세요. AI는 보안 전문가가 아닙니다.

## 🔮 미래 전망

2025년 하반기에는 더 흥미로운 일들이 일어날 것 같습니다. 도메인별로 특화된 AI 모델이 등장할 것이고, 실시간으로 여러 개발자와 AI가 함께 협업하는 환경이 구축될 겁니다. AI가 알아서 코드를 최적화해주는 도구도 더욱 발전하겠죠.

## 🎯 결론

AI 개발 도구는 이제 선택이 아닌 필수가 되었습니다. 하지만 잊지 마세요. 기본적인 프로그래밍 지식과 문제 해결 능력은 여전히, 아니 오히려 더욱 중요해졌습니다.

성공적인 AI 협업 개발을 위해서는 명확한 커뮤니케이션 능력, 코드 품질에 대한 이해, 그리고 지속적인 학습 자세가 필요합니다. AI는 도구일 뿐, 개발자의 창의성과 판단력을 대체할 수는 없으니까요.

앞으로도 더 혁신적인 AI 개발 도구들이 등장할 것으로 기대됩니다! 여러분은 어떤 도구를 가장 기대하시나요? 🚀

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
        // 🚨 스키마 필드 완전 활용 (모든 필드 포함 필수)
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null, // 승인된 게시글이므로 null
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: getRandomViewCount(300, 500), // AI뉴스 카테고리 조회수 범위
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
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
- **본문**: 1500자 이상, 마크다운 형식
- **excerpt**: 150자 이내 요약
- **slug**: URL 친화적, 고유값 (날짜나 고유 키워드 포함)
- **viewCount**: 지정된 범위 내 랜덤값
- **태그**: 3-5개, 카테고리 관련 (**최대 5개 초과 금지**)

### 콘텐츠 작성 스타일
- **자연스러운 문체**: 대화하듯 편안하게 읽히는 문장
- **전문성**: 개발자가 흥미로워할 내용
- **실용성**: 실무에 도움되는 정보
- **최신성**: 2025년 현재 트렌드 반영
- **흥미성**: 지나칠 수 없는 매력적인 내용

### 코드 블록 사용 가이드
- **실제 코드만**: 실행 가능한 코드 예시만 코드 블록 사용
- **설명은 텍스트로**: 개념, 분류, 유형 등은 자연어로 설명
- **필요한 경우만**: 코드 없이 설명 가능하면 텍스트 우선
- **적절한 비율**: 전체 콘텐츠의 20-30%만 코드 블록

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

## 🚀 실행 명령어

**스크립트 생성 후 실행하는 방법:**

```bash
# AI 뉴스 게시글 생성 예시
cd /path/to/your/project
node scripts/create-single-ai-news-post.ts

# 성공 시 출력 예시:
✅ "게시글 제목" 게시글이 성공적으로 생성되었습니다!
📊 조회수: 456
📝 게시글 ID: cme5g52wi0001u8hsmy9bqwig
🔗 슬러그: unique-slug-name
🏷️ 4개의 태그가 연결되었습니다.
```

## ✅ AI 에이전트 체크리스트

**스크립트 생성 시 반드시 확인해야 할 항목:**

### 🚨 절대 실수하면 안 되는 것들:
- [ ] **스키마 필드 누락** - MainPost의 모든 필드 포함했는가?
- [ ] **상수값 정확성** - ADMIN_USER_ID, 카테고리 ID 정확한가?
- [ ] **랜덤 조회수** - getRandomViewCount 함수 사용했는가?
- [ ] **rejectedReason** - null로 명시적 설정했는가?

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
- [ ] **태그 개수 5개 이하 확인** (필수)

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

### ✅ DO (반드시 해야 할 것)
- ✅ **MCP 도구로 최신 정보 수집** 후 콘텐츠 작성 (추측 금지!)
- ✅ **기존 샘플 파일** (create-vibe-coding-post.ts)의 패턴 정확히 따르기
- ✅ **MainPost 스키마 모든 필드** 빠짐없이 포함
- ✅ **상수 정보** 위에서 정확히 복사해서 사용
- ✅ **전문 블로거 수준**의 흥미로운 제목 작성
- ✅ **실무 경험**이 녹아든 실용적 내용
- ✅ **자연스러운 한국어**로 편안하게 읽히는 문장
- ✅ **단일 게시글 집중**으로 품질 극대화

### ❌ DON'T (절대 하지 말 것)
- ❌ **MCP 없이 추측**으로 콘텐츠 작성
- ❌ **스키마 필드 누락**하고 스크립트 작성
- ❌ **상수값 임의 변경**하거나 잘못된 ID 사용
- ❌ **기존 패턴 무시**하고 임의로 구조 변경
- ❌ **평범하고 재미없는** 제목 사용
- ❌ **너무 이론적이고 추상적**인 내용
- ❌ **개념을 코드로 표현** (interface로 유형 분류 등)
- ❌ **불필요한 코드 블록 남발**
- ❌ **여러 게시글을 한 번에** 생성하려고 시도

### 🎯 처음 보는 AI를 위한 핵심 체크포인트:
1. **prisma/schema.prisma** 읽고 MainPost 필드 모두 확인
2. **create-vibe-coding-post.ts** 읽고 정확한 패턴 학습
3. **상수 정보** 위에서 복사해서 정확히 사용
4. **MCP 도구**로 최신 트렌드 수집 후 콘텐츠 작성
5. **모든 필드 포함**하여 스크립트 작성
6. **실행 테스트** 후 성공 메시지 확인

---

## 📞 결론

**이 지시문을 통해 처음 보는 AI 에이전트도 100% 성공률로 고품질의 단일 게시글 생성 스크립트를 작성할 수 있습니다.**

### 🤖 AI 에이전트 작업 플로우:

사용자가 **"○○ 카테고리 게시글 1개 생성해줘"**라고 요청하면:

#### 1️⃣ **필수 파일 읽기** (절대 생략 불가)
```bash
- prisma/schema.prisma (MainPost 모델 구조 파악)
- create-vibe-coding-post.ts (정확한 패턴 학습)
```

#### 2️⃣ **정보 수집** (추측 금지)
```bash
- MCP 도구로 최신 트렌드 수집
- 해당 카테고리 정보 확인 (ID, 조회수 범위)
- 상수값 정확히 복사
```

#### 3️⃣ **스크립트 생성** (템플릿 준수)
```bash
- 위 템플릿 구조 정확히 따라 작성
- MainPost 스키마 모든 필드 포함
- 상수값 정확히 사용
- 랜덤 조회수 함수 적용
```

#### 4️⃣ **콘텐츠 작성** (품질 보장)
```bash
- 흥미롭고 클릭유도적인 제목
- 실용적이고 전문적인 내용
- 코드 예시 포함
- 개발자 맞춤 정보
```

#### 5️⃣ **실행 테스트** (검증)
```bash
node scripts/create-single-xxx-post.ts
✅ 성공 메시지 확인
```

### 🎯 핵심 포인트:
- **절대 추측하지 말 것** - 모든 정보는 문서에서 정확히 복사
- **스키마 필드 완전 활용** - MainPost 모든 필드 포함 필수
- **순서 준수** - 단계 건너뛰면 100% 실패
- **품질 집중** - 단일 게시글에 모든 노력 투입

**처음 보는 AI 에이전트도 이 지시문만 따르면 완벽한 스크립트를 생성할 수 있습니다! 🚀**