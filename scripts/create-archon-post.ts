import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// 바이브코딩 카테고리 ID
const VIBECODING_CATEGORY_ID = 'cme5a5vyt0003u8ww9aoazx9f'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎯 Archon: AI 코딩 어시스턴트를 위한 궁극의 지휘본부가 등장했다!

## 🎯 한 줄 요약
**Archon은 AI 코딩 어시스턴트들이 프로젝트 지식과 컨텍스트를 공유할 수 있게 해주는 MCP 서버로, Claude Code, Cursor, Windsurf 등을 하나로 연결하는 통합 플랫폼입니다!**

![Archon 메인 대시보드](https://github.com/coleam00/Archon/raw/main/archon-ui-main/public/archon-main-graphic.png)

## 🤔 이런 고민 해보셨나요?

AI 코딩 도구들을 사용하다 보면 이런 답답함을 느끼시죠?

- **"Claude Code에서 작업한 내용을 Cursor가 모르네..."** 😤
- **"매번 같은 프로젝트 컨텍스트를 다시 설명해야 해..."** 🔄
- **"여러 AI 도구를 쓰는데 지식이 파편화되어 있어..."** 📚
- **"팀원들과 AI 컨텍스트를 공유할 방법이 없네..."** 👥

**Archon이 이 모든 문제를 해결합니다!** 🚀

## 💡 Archon이 뭔가요?

### 🔥 AI 코딩 도구들의 "통합 지휘본부"

Archon은 여러분에게는 **세련된 웹 인터페이스**로, AI 어시스턴트들에게는 **MCP(Model Context Protocol) 서버**로 작동합니다.

**핵심 개념을 쉽게 설명하면:**
- 📚 **지식 저장소**: 프로젝트 문서, PDF, 웹사이트를 한 곳에 저장
- 🤖 **AI 통합 허브**: 모든 AI 도구가 같은 지식을 공유
- 📋 **작업 관리**: AI와 함께 태스크를 관리하고 추적
- 🔄 **실시간 동기화**: 한 곳에서 업데이트하면 모든 AI가 즉시 인지

### ⚡ 기존 방식 vs Archon

| 구분 | 기존 방식 😔 | Archon 방식 🎉 |
|------|------------|--------------|
| **컨텍스트 유지** | 세션마다 리셋 | 영구 보존 |
| **도구 간 연동** | 불가능 | 완벽 동기화 |
| **지식 관리** | 분산/중복 | 중앙 집중식 |
| **팀 협업** | 제한적 | 실시간 공유 |
| **설정 복잡도** | 도구별 설정 | 한 번만 설정 |

## 🎯 핵심 기능 살펴보기

### 🧠 지식 관리 시스템

**1. 스마트 웹 크롤링**
- 전체 문서 사이트 자동 크롤링
- 사이트맵 인식 및 처리
- 코드 예제 자동 추출 및 인덱싱

**2. 문서 처리**
- PDF, Word, Markdown 파일 업로드
- 지능형 청킹으로 최적화된 분할
- 벡터 검색으로 정확한 정보 검색

**3. 소스 관리**
- 소스별, 타입별, 태그별 구성
- 손쉬운 필터링과 검색

### 🤖 AI 통합 기능

**MCP 프로토콜 지원**
- Claude Code, Cursor, Windsurf 등 모든 MCP 호환 클라이언트 연결
- 10개의 강력한 MCP 도구 제공
- 실시간 스트리밍 응답

**멀티 LLM 지원**
- OpenAI GPT 시리즈
- Ollama (로컬 모델)
- Google Gemini
- 더 많은 모델 추가 예정!

### 📋 프로젝트 & 작업 관리

**계층적 구조**
\`\`\`
프로젝트
├── 기능 1
│   ├── 작업 1.1
│   └── 작업 1.2
└── 기능 2
    ├── 작업 2.1
    └── 작업 2.2
\`\`\`

**AI 지원 생성**
- 프로젝트 요구사항 자동 생성
- 태스크 분해 및 우선순위 설정
- 진행 상황 실시간 추적

## 🚀 5분 만에 시작하기

### 📌 필수 준비물
✅ Docker Desktop  
✅ Supabase 계정 (무료 가능)  
✅ OpenAI API 키 (또는 Gemini/Ollama)  

### Step 1: 클론 & 설정
\`\`\`bash
# 저장소 클론
git clone https://github.com/coleam00/archon.git
cd archon

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집하여 Supabase 정보 입력
\`\`\`

### Step 2: 데이터베이스 구성
Supabase SQL 에디터에서 \`migration/complete_setup.sql\` 실행

### Step 3: 서비스 시작
\`\`\`bash
docker-compose up --build -d
\`\`\`

### Step 4: API 키 설정
- http://localhost:3737 접속
- Settings → LLM 제공자 선택 → API 키 입력
- 완료! 🎉

## 📊 아키텍처 이해하기

### 마이크로서비스 구조
\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI (React)│◄──►│ Server API  │◄──►│ MCP Server  │◄──►│   Agents    │
│  Port 3737  │    │  Port 8181  │    │  Port 8051  │    │  Port 8052  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │                   │
        └───────────────────┼───────────────────┼───────────────────┘
                            │                   │
                    ┌───────────────┐           │
                    │   Supabase    │◄──────────┘
                    │  PostgreSQL   │
                    │   PGVector    │
                    └───────────────┘
\`\`\`

### 각 서비스 역할

| 서비스 | 포트 | 역할 |
|--------|------|------|
| **UI** | 3737 | 웹 대시보드 |
| **Server** | 8181 | 핵심 비즈니스 로직 |
| **MCP** | 8051 | AI 클라이언트 인터페이스 |
| **Agents** | 8052 | PydanticAI 에이전트 |

## ⚡ 실제 활용 사례

### 사례 1: 문서 기반 개발

**"Pydantic 문서를 크롤링하고 바로 코드 작성!"**
1. Archon에서 https://docs.pydantic.dev 크롤링
2. Claude Code에서 "Pydantic으로 검증 모델 만들어줘"
3. Archon이 정확한 문서 컨텍스트 제공
4. 완벽한 코드 생성! ✨

### 사례 2: 팀 협업

**"팀원 5명이 같은 AI 컨텍스트 공유!"**
- A 개발자가 아키텍처 문서 업로드
- B 개발자의 Cursor가 즉시 인지
- C 개발자가 태스크 생성
- 모든 AI 도구가 동일한 정보로 작업

## 🎮 고급 기능들

### RAG 전략 옵션
- **Hybrid Search**: 키워드 + 시맨틱 검색 조합
- **Contextual Embeddings**: 문맥 기반 임베딩
- **Result Reranking**: 결과 재순위 조정 (선택적)

### 커스텀 포트 설정
\`\`\`bash
# .env 파일에서 커스터마이징
ARCHON_UI_PORT=3737
ARCHON_SERVER_PORT=8181
ARCHON_MCP_PORT=8051
ARCHON_AGENTS_PORT=8052
HOST=localhost  # 또는 원격 접속용 IP
\`\`\`

### MCP 도구 목록
1. \`search_knowledge\` - 지식 베이스 검색
2. \`add_knowledge\` - 새 지식 추가
3. \`create_task\` - 태스크 생성
4. \`update_task\` - 태스크 업데이트
5. \`get_project_info\` - 프로젝트 정보 조회
6. 그 외 5개 추가 도구...

## ⚠️ 알아두면 좋은 점들

### ✅ 장점
- **무료 오픈소스**: MIT 라이선스
- **로컬 실행 가능**: 데이터 프라이버시 보장
- **확장 가능**: 마이크로서비스로 독립 확장
- **활발한 커뮤니티**: GitHub Discussions 활성화

### ⚠️ 현재 제한사항 (베타)
- 일부 기능 불안정 가능
- Agents 서비스 개발 진행 중
- 대용량 문서 처리 시 속도 이슈

## 💭 마무리 생각

**Archon은 AI 코딩의 미래를 보여주는 프로젝트입니다.**

더 이상 각각의 AI 도구가 고립된 섬처럼 작동하지 않습니다. Archon을 통해 모든 AI 어시스턴트가 하나의 팀처럼 협력하며, 여러분의 프로젝트를 깊이 이해하고 지원합니다.

마치 오케스트라의 지휘자처럼, Archon은 여러 AI 도구들이 조화롭게 연주하도록 이끕니다. 🎼

**지금 바로 Archon을 시작하고, AI 코딩의 새로운 차원을 경험해보세요!**

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

### 🔗 참고 자료
- [Archon GitHub Repository](https://github.com/coleam00/Archon)
- [Archon 소개 영상](https://youtu.be/8pRc_s2VQIo)
- [Dynamous AI Mastery 커뮤니티](https://dynamous.ai)
- [MCP 프로토콜 문서](https://modelcontextprotocol.io)`

  try {
    console.log('🎯 Archon 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title:
          '🎯 Archon: AI 코딩 어시스턴트를 위한 궁극의 지휘본부가 등장했다!',
        slug: 'archon-ai-coding-command-center-2025',
        content,
        excerpt:
          'Archon은 Claude Code, Cursor, Windsurf 등 모든 AI 코딩 도구가 프로젝트 지식과 컨텍스트를 공유할 수 있게 해주는 통합 MCP 서버입니다. 지식 관리, 작업 추적, 실시간 협업을 한 곳에서!',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: VIBECODING_CATEGORY_ID,
        viewCount: getRandomViewCount(300, 500),
        metaTitle: 'Archon - AI 코딩 어시스턴트 통합 플랫폼 | MCP 서버',
        metaDescription:
          'Archon으로 Claude Code, Cursor, Windsurf 등 모든 AI 코딩 도구를 하나로 연결하세요. 지식 관리, 작업 추적, 실시간 협업이 가능한 오픈소스 MCP 서버',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      'Archon',
      'MCP',
      'AI 코딩',
      'Claude Code',
      'Cursor',
      'Windsurf',
      '오픈소스',
      '개발 도구',
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagName of tagNames) {
      // 태그가 이미 존재하는지 확인
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagName },
      })

      // 태그가 없으면 생성
      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            postCount: 1,
          },
        })
      } else {
        // 기존 태그의 postCount 증가
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } },
        })
      }

      // 게시글-태그 연결
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`🏷️ 태그 처리 완료: ${tagNames.join(', ')}`)

    // 사이트 통계 업데이트
    await prisma.siteStats.upsert({
      where: { id: 'main' },
      update: {
        totalPosts: { increment: 1 },
      },
      create: {
        id: 'main',
        totalUsers: 0,
        totalPosts: 1,
        totalComments: 0,
        totalCommunities: 0,
        dailyActiveUsers: 0,
      },
    })

    console.log('📈 사이트 통계 업데이트 완료')
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류 발생:', error)
    throw error
  }
}

// 스크립트 실행
if (require.main === module) {
  createPost()
    .then(() => {
      console.log('🎉 Archon 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
