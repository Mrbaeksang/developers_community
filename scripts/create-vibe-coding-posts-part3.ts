import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createVibeCodingPosts() {
  // 바이브 코딩 카테고리 ID (POST.md에서 확인)
  const vibeCodingCategoryId = 'cme5a5vyt0003u8ww9aoazx9f'

  // 관리자 계정 찾기
  const adminUser = await prisma.user.findFirst({
    where: { globalRole: 'ADMIN' },
  })

  if (!adminUser) {
    console.error('❌ 관리자 계정을 찾을 수 없습니다!')
    return
  }

  // 태그 생성 또는 찾기
  const tagData = [
    { name: 'github-copilot', slug: 'github-copilot' },
    { name: 'agent-mode', slug: 'agent-mode' },
    { name: 'autonomous-coding', slug: 'autonomous-coding' },
    { name: 'project-padawan', slug: 'project-padawan' },
    { name: 'mcp-protocol', slug: 'mcp-protocol' },
    { name: 'model-context', slug: 'model-context' },
    { name: 'ide-integration', slug: 'ide-integration' },
    { name: 'ai-extensions', slug: 'ai-extensions' },
    { name: 'productivity', slug: 'productivity' },
    { name: 'pair-programming', slug: 'pair-programming' },
    { name: 'prompt-engineering', slug: 'prompt-engineering' },
    { name: 'vibe-coding', slug: 'vibe-coding' },
  ]

  const tags = await Promise.all(
    tagData.map(async ({ name, slug }) => {
      return await prisma.mainTag.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          description: `${name} 관련 콘텐츠`,
          postCount: 0,
        },
      })
    })
  )

  // 새로운 포스트 데이터 (2025년 1월 최신 정보 기반)
  const posts = [
    {
      title: 'GitHub Copilot Agent Mode 완벽 정복: 자율 주행 코딩의 시대',
      slug: 'github-copilot-agent-mode-mastery-autonomous-coding-era',
      content: `
# GitHub Copilot Agent Mode 완벽 정복: 자율 주행 코딩의 시대 🚀

2025년 2월, GitHub가 드디어 **Agent Mode**를 공개했습니다. 이제 Copilot은 단순한 코드 제안을 넘어 **완전 자율 코딩 에이전트**로 진화했습니다. Project Padawan과 함께 개발 패러다임이 완전히 바뀌고 있습니다.

## 1. Agent Mode vs 기존 Copilot: 뭐가 다른가? 🤖

### 기존 Copilot (Pair Programming)
- 개발자가 주도하고 AI가 보조
- 코드 제안과 자동 완성 중심
- 수동적인 도구

### 새로운 Agent Mode (Peer Programming)
- AI가 독립적으로 작업 수행
- 오류 자동 감지 및 수정
- 터미널 명령어 실행
- 연관 작업 자동 추론

\`\`\`javascript
// Agent Mode 활성화 (VS Code Insiders)
{
  "github.copilot.chat.agent.enabled": true
}
\`\`\`

## 2. Agent Mode 실전 활용법 💡

### 자율 디버깅 (Self-Healing)
Agent Mode는 코드를 실행하고, 오류를 감지하며, 자동으로 수정합니다.

\`\`\`typescript
// 당신: "이 함수가 왜 실패하는지 찾아서 고쳐줘"
// Agent Mode:
// 1. 코드 분석
// 2. 테스트 실행
// 3. 오류 패턴 인식
// 4. 수정 사항 적용
// 5. 재테스트로 검증

async function processData(input: unknown) {
  // Agent가 자동으로 타입 가드 추가
  if (!isValidInput(input)) {
    throw new Error('Invalid input format')
  }
  
  // null 체크 자동 추가
  const result = await fetchData(input.id)
  if (!result) {
    return handleEmptyResult()
  }
  
  return transformData(result)
}
\`\`\`

### 암묵적 작업 추론
명시하지 않은 필수 작업들을 AI가 알아서 처리합니다.

\`\`\`bash
# 당신: "React 컴포넌트를 Next.js 14로 마이그레이션해줘"

# Agent Mode가 자동으로 수행하는 작업:
- package.json 업데이트
- use client 디렉티브 추가
- 서버 컴포넌트 최적화
- App Router 구조로 변환
- 타입 정의 업데이트
- 테스트 코드 수정
\`\`\`

## 3. Project Padawan: 완전 자율 개발 🎯

GitHub의 야심작 Project Padawan은 이슈를 직접 받아 해결하는 AI 개발자입니다.

### 작동 방식
1. **이슈 할당**: GitHub 이슈를 Copilot에게 직접 할당
2. **자율 개발**: 코드 작성, 테스트, 문서화 자동 수행
3. **PR 생성**: 완성된 코드로 Pull Request 생성
4. **리뷰 요청**: 인간 개발자에게 리뷰 요청

\`\`\`yaml
# .github/copilot-padawan.yml
padawan:
  enabled: true
  auto_assign:
    labels: ['good-first-issue', 'enhancement']
  capabilities:
    - code_generation
    - test_writing
    - documentation
    - dependency_management
  review:
    required: true
    auto_merge: false
\`\`\`

## 4. Vision 기능: 스크린샷으로 코딩하기 📸

이미지를 업로드하면 AI가 분석하고 코드를 생성합니다.

### 활용 사례
- **에러 스크린샷** → 자동 디버깅
- **디자인 목업** → UI 컴포넌트 생성
- **화이트보드 사진** → 아키텍처 코드 구현

\`\`\`typescript
// Figma 디자인을 드래그 앤 드롭하면
// AI가 자동으로 생성하는 코드:

export const DashboardCard = ({ 
  title, 
  metric, 
  trend 
}: DashboardCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <CardHeader className="flex justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <TrendIndicator value={trend} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{metric}</div>
        <Chart data={historicalData} />
      </CardContent>
    </Card>
  )
}
\`\`\`

## 5. 실전 팁: Agent Mode 200% 활용하기 🔥

### 1. 컨텍스트 최적화
\`\`\`javascript
// ❌ 나쁜 예: 모호한 요청
"버그 좀 고쳐줘"

// ✅ 좋은 예: 구체적인 컨텍스트
"UserProfile 컴포넌트에서 infinite re-render 문제 해결해줘. 
useEffect 의존성 배열을 확인하고 React.memo로 최적화해줘."
\`\`\`

### 2. 반복 작업 자동화
\`\`\`bash
# Agent Mode에게 패턴 학습시키기
"이 CRUD 패턴을 User, Product, Order 엔티티에 적용해줘"

# AI가 자동으로:
- 각 엔티티별 Controller 생성
- Service 레이어 구현
- Repository 패턴 적용
- 테스트 코드 작성
- API 문서 생성
\`\`\`

### 3. 멀티모델 활용
\`\`\`javascript
// settings.json
{
  "github.copilot.chat.models": {
    "default": "gpt-4o",        // 일반 코딩
    "complex": "o3-mini",        // 복잡한 로직
    "fast": "gemini-2.0-flash"  // 빠른 응답
  }
}
\`\`\`

## 6. 주의사항과 베스트 프랙티스 ⚠️

### 보안 검토는 필수
\`\`\`typescript
// Agent Mode가 생성한 코드도 반드시 검토
// 특히 다음 영역:
- 인증/인가 로직
- 데이터 검증
- SQL 쿼리
- 환경 변수 처리
- API 키 관리
\`\`\`

### 점진적 도입
1. **Phase 1**: 단위 테스트 작성에 활용
2. **Phase 2**: 리팩토링과 코드 개선
3. **Phase 3**: 새 기능 개발
4. **Phase 4**: 전체 프로젝트 자동화

## 7. 2025년 로드맵: 뭐가 더 나올까? 🚀

- **Q1 2025**: VS Code Stable 버전 출시
- **Q2 2025**: 웹 기반 Agent Mode
- **Q3 2025**: 팀 협업 기능 (Multi-Agent)
- **Q4 2025**: 프로덕션 배포 자동화

## 마무리: Peer Programming의 시대 🎯

Agent Mode는 단순한 기능 업데이트가 아닙니다. **개발 패러다임의 전환**입니다. 이제 AI는 주니어 개발자가 아닌 동료 개발자로서 함께 일합니다.

**핵심 포인트:**
- 🤖 AI가 독립적으로 작업 수행
- 🔄 자동 오류 수정과 개선
- 📈 생산성 55% 향상 검증
- 🎯 인간은 아키텍처와 비즈니스 로직에 집중

지금 바로 VS Code Insiders를 설치하고 Agent Mode를 경험해보세요!

---

*💡 Pro Tip: Agent Mode는 현재 VS Code Insiders에서만 사용 가능합니다. 정식 버전은 2025년 3월 출시 예정!*
      `,
      excerpt:
        'GitHub Copilot의 혁명적인 Agent Mode와 Project Padawan으로 완전 자율 코딩 시대를 여는 방법',
      tags: [
        'github-copilot',
        'agent-mode',
        'autonomous-coding',
        'project-padawan',
        'vibe-coding',
      ],
      metaTitle: 'GitHub Copilot Agent Mode 완벽 가이드 - 자율 코딩 AI 활용법',
      metaDescription:
        '2025년 최신 GitHub Copilot Agent Mode와 Project Padawan으로 AI가 독립적으로 코딩하는 방법을 알아보세요. 생산성 55% 향상 실전 팁 포함.',
    },
    {
      title: 'MCP로 AI 코딩 도구 연결하기: IDE의 USB-C 시대',
      slug: 'mcp-protocol-ai-coding-tools-ide-integration',
      content: `
# MCP로 AI 코딩 도구 연결하기: IDE의 USB-C 시대 🔌

Model Context Protocol(MCP)이 AI 개발 도구의 판도를 바꾸고 있습니다. 2024년 11월 Anthropic이 공개한 이 프로토콜은 **"AI 앱의 USB-C 포트"**로 불리며, 2025년 1월 기준 이미 1,000개 이상의 커뮤니티 서버가 구축되었습니다.

## 1. MCP가 뭐고, 왜 중요한가? 🎯

### 기존의 문제: M×N 지옥
각 AI 도구(M개)가 각 데이터 소스(N개)와 연결하려면 M×N개의 커스텀 통합이 필요했습니다.

\`\`\`
기존: Claude + GitHub + Slack + Jira + MongoDB = 5개 별도 통합
MCP: Claude → MCP → 모든 도구 = 1개 표준 프로토콜
\`\`\`

### MCP의 해결책: M+N
하나의 표준 프로토콜로 모든 연결을 통합합니다.

\`\`\`typescript
// MCP 서버 설정 예시
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx"
      }
    },
    "database": {
      "command": "mcp-server-postgres",
      "args": ["--connection-string", "postgresql://..."]
    },
    "slack": {
      "command": "mcp-server-slack",
      "args": ["--workspace", "your-workspace"]
    }
  }
}
\`\`\`

## 2. MCP 실전 구축: 30분 만에 시작하기 ⚡

### Step 1: MCP 서버 생성
\`\`\`typescript
// mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'

const server = new Server({
  name: 'my-project-server',
  version: '1.0.0'
})

// 프로젝트 컨텍스트 제공
server.setRequestHandler('resources/list', async () => {
  return {
    resources: [
      {
        uri: 'project://architecture',
        name: '프로젝트 아키텍처',
        mimeType: 'text/plain'
      },
      {
        uri: 'project://database-schema',
        name: 'DB 스키마',
        mimeType: 'application/json'
      }
    ]
  }
})

// 도구 제공
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'run_tests',
        description: '테스트 실행',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: { type: 'string' }
          }
        }
      }
    ]
  }
})

// 서버 시작
const transport = new StdioServerTransport()
await server.connect(transport)
\`\`\`

### Step 2: IDE 통합 (Claude Desktop)
\`\`\`json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "my-project": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "cwd": "/path/to/project"
    }
  }
}
\`\`\`

### Step 3: 실시간 데이터 연동
\`\`\`typescript
// 실시간 프로젝트 정보 제공
server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params
  
  if (uri === 'project://current-errors') {
    // 실시간 에러 로그 전달
    const errors = await getLatestErrors()
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(errors)
      }]
    }
  }
  
  if (uri === 'project://performance-metrics') {
    // 실시간 성능 메트릭
    const metrics = await getPerformanceMetrics()
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(metrics)
      }]
    }
  }
})
\`\`\`

## 3. 강력한 MCP 활용 패턴 🚀

### 패턴 1: 멀티 소스 컨텍스트 집계
\`\`\`typescript
// AI가 여러 소스에서 정보를 자동으로 수집
const projectContext = new MCPContext()

// GitHub에서 최근 이슈
projectContext.add('github://issues/recent')

// Sentry에서 에러 리포트
projectContext.add('sentry://errors/last-24h')

// 프로덕션 메트릭
projectContext.add('datadog://metrics/api-latency')

// AI에게 종합 분석 요청
const analysis = await ai.analyze(projectContext, 
  "이 데이터를 기반으로 가장 시급한 문제 3개를 찾아줘"
)
\`\`\`

### 패턴 2: 자동화된 코드 리뷰
\`\`\`typescript
// MCP를 통한 PR 자동 리뷰
server.setRequestHandler('tools/execute', async (request) => {
  if (request.params.name === 'review_pr') {
    const { prNumber } = request.params.arguments
    
    // 1. PR 변경사항 가져오기
    const changes = await github.getPRChanges(prNumber)
    
    // 2. 테스트 실행
    const testResults = await runTests(changes.affectedFiles)
    
    // 3. 성능 영향 분석
    const perfImpact = await analyzePerformance(changes)
    
    // 4. 보안 스캔
    const securityIssues = await scanSecurity(changes)
    
    // 5. AI 리뷰 생성
    return {
      result: {
        testsPassed: testResults.passed,
        performanceImpact: perfImpact.summary,
        securityIssues: securityIssues.critical,
        suggestion: generateReviewComment(...)
      }
    }
  }
})
\`\`\`

### 패턴 3: 지능형 디버깅 어시스턴트
\`\`\`typescript
// 에러 발생 시 자동으로 관련 정보 수집
class MCPDebugAssistant {
  async investigateError(error: Error) {
    const context = {
      // 에러 스택 트레이스
      stack: error.stack,
      
      // 관련 소스 코드
      sourceCode: await this.getSourceCode(error),
      
      // 최근 커밋
      recentCommits: await this.getRecentCommits(),
      
      // 유사한 과거 이슈
      similarIssues: await this.findSimilarIssues(error),
      
      // 현재 시스템 상태
      systemState: await this.getSystemMetrics()
    }
    
    // AI가 종합 분석
    return await this.ai.analyze(context, 
      "이 에러의 원인과 해결 방법을 제시해줘"
    )
  }
}
\`\`\`

## 4. 고급 MCP 테크닉 🎨

### 동적 리소스 생성
\`\`\`typescript
// 프로젝트 상태에 따라 동적으로 리소스 생성
server.setRequestHandler('resources/list', async () => {
  const resources = []
  
  // CI/CD 상태에 따른 리소스
  if (await isDeploymentRunning()) {
    resources.push({
      uri: 'deployment://current',
      name: '진행 중인 배포',
      mimeType: 'application/json'
    })
  }
  
  // 활성 브랜치별 리소스
  const branches = await getActiveBranches()
  branches.forEach(branch => {
    resources.push({
      uri: \`branch://\${branch.name}\`,
      name: \`브랜치: \${branch.name}\`,
      mimeType: 'text/plain'
    })
  })
  
  return { resources }
})
\`\`\`

### 프롬프트 템플릿 시스템
\`\`\`typescript
// 재사용 가능한 프롬프트 템플릿 제공
server.setRequestHandler('prompts/list', async () => {
  return {
    prompts: [
      {
        name: 'optimize_query',
        description: 'SQL 쿼리 최적화',
        arguments: [
          { name: 'query', description: 'SQL 쿼리' },
          { name: 'schema', description: '테이블 스키마' }
        ]
      },
      {
        name: 'generate_tests',
        description: '테스트 코드 생성',
        arguments: [
          { name: 'function', description: '테스트할 함수' },
          { name: 'coverage', description: '목표 커버리지' }
        ]
      }
    ]
  }
})
\`\`\`

## 5. MCP 생태계와 인기 서버들 🌐

### 필수 MCP 서버 Top 5
1. **MCP-TypeScript**: TypeScript 프로젝트 분석
2. **MCP-Git**: Git 히스토리와 통합
3. **MCP-Docker**: 컨테이너 관리
4. **MCP-AWS**: AWS 리소스 접근
5. **MCP-Postgres**: DB 직접 쿼리

### 커뮤니티 서버 설치
\`\`\`bash
# npm으로 설치
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-filesystem

# 설정 파일에 추가
echo '{"mcpServers": {...}}' > ~/.mcp/config.json
\`\`\`

## 6. 트러블슈팅과 최적화 🔧

### 컨텍스트 윈도우 관리
\`\`\`typescript
// 큰 프로젝트를 위한 청킹 전략
class MCPContextManager {
  private maxTokens = 100000
  
  async optimizeContext(resources: Resource[]) {
    // 우선순위 기반 필터링
    const prioritized = resources
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
    
    // 토큰 수 계산
    const tokenCounts = await this.estimateTokens(prioritized)
    
    // 한도 내에서 최적화
    return this.fitWithinLimit(prioritized, tokenCounts)
  }
}
\`\`\`

### 성능 모니터링
\`\`\`typescript
// MCP 서버 성능 추적
const metrics = {
  requestCount: 0,
  avgResponseTime: 0,
  errorRate: 0
}

server.use(async (request, next) => {
  const start = Date.now()
  try {
    const result = await next(request)
    metrics.avgResponseTime = 
      (metrics.avgResponseTime * metrics.requestCount + 
       (Date.now() - start)) / (metrics.requestCount + 1)
    metrics.requestCount++
    return result
  } catch (error) {
    metrics.errorRate++
    throw error
  }
})
\`\`\`

## 마무리: MCP가 가져올 미래 🚀

MCP는 단순한 프로토콜이 아닙니다. **AI 개발 도구의 표준**이 되고 있습니다.

**핵심 이점:**
- 🔌 한 번 구축, 모든 AI와 연결
- 📊 실시간 데이터 접근
- 🔄 도구 간 원활한 전환
- 🚀 생산성 대폭 향상

**2025년 전망:**
- OpenAI, Google 등 주요 플레이어 참여
- 1만개 이상의 MCP 서버 예상
- IDE 기본 탑재 표준화
- 엔터프라이즈 도입 가속화

지금 바로 MCP를 도입하고 AI 개발의 미래를 경험하세요!

---

*💡 Pro Tip: MCP는 오픈소스입니다. GitHub에서 직접 기여하거나 자신만의 서버를 만들어보세요!*
      `,
      excerpt:
        'Model Context Protocol(MCP)로 AI 코딩 도구를 통합하고 IDE를 강화하는 최신 방법론과 실전 구현 가이드',
      tags: [
        'mcp-protocol',
        'model-context',
        'ide-integration',
        'ai-extensions',
        'productivity',
        'vibe-coding',
      ],
      metaTitle: 'MCP Protocol 완벽 가이드 - AI 코딩 도구 통합의 새로운 표준',
      metaDescription:
        '2025년 최신 Model Context Protocol(MCP)로 Claude, GitHub Copilot 등 AI 도구를 IDE와 완벽 통합하는 방법. 실전 코드와 1000+ 커뮤니티 서버 활용법.',
    },
  ]

  // 포스트 생성
  for (const postData of posts) {
    const existingPost = await prisma.mainPost.findUnique({
      where: { slug: postData.slug },
    })

    if (existingPost) {
      console.log(`⏭️  이미 존재하는 포스트: ${postData.title}`)
      continue
    }

    // 포스트 생성
    const post = await prisma.mainPost.create({
      data: {
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        excerpt: postData.excerpt,
        status: 'PUBLISHED',
        metaTitle: postData.metaTitle,
        metaDescription: postData.metaDescription,
        viewCount: Math.floor(Math.random() * 500) + 300,
        authorId: adminUser.id,
        authorRole: adminUser.globalRole,
        categoryId: vibeCodingCategoryId,
        approvedAt: new Date(),
        approvedById: adminUser.id,
      },
    })

    // 태그 연결
    const postTags = postData.tags
      .map((tagName) => {
        const tag = tags.find((t) => t.name === tagName)
        return tag ? { postId: post.id, tagId: tag.id } : null
      })
      .filter(Boolean) as { postId: string; tagId: string }[]

    if (postTags.length > 0) {
      await prisma.mainPostTag.createMany({
        data: postTags,
      })

      // 태그 사용 횟수 업데이트
      for (const postTag of postTags) {
        await prisma.mainTag.update({
          where: { id: postTag.tagId },
          data: { postCount: { increment: 1 } },
        })
      }
    }

    console.log(`✅ 포스트 생성 완료: ${postData.title}`)
  }

  console.log('\n🎉 바이브 코딩 Part 3 포스트 생성 완료!')
}

// 스크립트 실행
createVibeCodingPosts()
  .catch((error) => {
    console.error('❌ 오류 발생:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
