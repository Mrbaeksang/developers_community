// Q&A 자동 응답 봇 시스템
import { openrouter, AI_MODELS } from './openrouter-client'
import { prisma } from '@/lib/core/prisma'
import type { MainPost, User, MainCategory } from '@prisma/client'
import type { ChatCompletion } from 'openai/resources/chat/completions'

// AI 봇 설정 상수
const AI_CONFIG = {
  BOT_USER_ID: process.env.AI_BOT_USER_ID || 'cmdri2tj90000u8vgtyir9upy',
  MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '8000'), // 대폭 증가: 8000 토큰 (약 6000~16000자)
  TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '60000'), // 60초로 증가
  API_WAIT_TIMEOUT_MS: 20000, // API 응답 대기 최대 20초로 증가
  BATCH_DELAY_MS: 2000, // 배치 처리 시 대기 시간
  MAX_BATCH_SIZE: 10, // 한 번에 처리할 최대 게시글 수
  MAX_COMMENT_LENGTH: 50000, // 댓글 최대 길이 50000자 (충분한 여유)
} as const

// HTML 특수 문자를 이스케이프하는 헬퍼 함수
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 마크다운을 TipTap 호환 HTML로 변환
function markdownToHTML(markdown: string): string {
  // 플레이스홀더를 사용하여 처리 중인 콘텐츠를 보호
  const placeholders = new Map<string, string>()
  let placeholderId = 0

  const addPlaceholder = (content: string): string => {
    const key = `__PLACEHOLDER_${placeholderId++}__`
    placeholders.set(key, content)
    return key
  }

  let html = markdown

  // 1. 코드 블록을 가장 먼저 보호 (가장 중요!)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = escapeHtml(code.trim())
    const language = lang || 'plaintext'
    const finalHtml = `<pre><code class="language-${language}" style="display: block; background-color: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.5; overflow-x: auto; margin: 16px 0;">${escapedCode}</code></pre>`
    return addPlaceholder(finalHtml)
  })

  // 2. 인라인 코드를 보호
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const escapedCode = escapeHtml(code)
    const finalHtml = `<code style="background-color: #f1f5f9; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">${escapedCode}</code>`
    return addPlaceholder(finalHtml)
  })

  // 3. GFM 테이블을 변환 (코드가 보호된 상태에서)
  html = html.replace(
    /^\|(.+)\|\s*\n\|[\s\-\|:]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm,
    (match, header, body) => {
      const headers = header
        .split('|')
        .slice(1, -1)
        .map((h: string) => h.trim())
      const rows = body
        .trim()
        .split('\n')
        .map((row: string) =>
          row
            .split('|')
            .slice(1, -1)
            .map((cell: string) => cell.trim())
        )

      let table =
        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><thead><tr>'
      headers.forEach(
        (h: string) =>
          (table += `<th style="border: 1px solid #e5e7eb; padding: 8px; background-color: #f9fafb; font-weight: bold; text-align: left;">${h}</th>`)
      )
      table += '</tr></thead><tbody>'
      rows.forEach((row: string[]) => {
        table += '<tr>'
        row.forEach(
          (cell: string) =>
            (table += `<td style="border: 1px solid #e5e7eb; padding: 8px;">${cell}</td>`)
        )
        table += '</tr>'
      })
      table += '</tbody></table>'
      return table
    }
  )

  // 4. 제목 처리 (코드 블록이 보호된 상태에서)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // 5. 블록 인용(blockquote) 처리
  html = html.replace(/^(> .+\n?)+/gm, (match) => {
    const content = match
      .split('\n')
      .map((line) => line.replace(/^> ?/, ''))
      .join('<br>')
    return `<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; color: #6b7280; font-style: italic;">${content}</blockquote>`
  })

  // 6. 굵은 글씨 (**텍스트**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 7. 기울임 (*텍스트*) - 목록과 충돌하지 않도록 처리
  html = html.replace(/(?<!^|\n|\*)\*([^*\n]+)\*/g, '<em>$1</em>')

  // 8. 링크 처리 ([텍스트](URL))
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">$1</a>'
  )

  // 9. 순서 없는 목록 (- 항목)
  const ulItems: string[] = []
  html = html.replace(/^[-*] (.+)$/gm, (match, content) => {
    ulItems.push(`<li>${content}</li>`)
    return `__UL_ITEM_${ulItems.length - 1}__`
  })

  // 10. 순서 있는 목록 (1. 2. 3.)
  const olItems: string[] = []
  html = html.replace(/^\d+\. (.+)$/gm, (match, content) => {
    olItems.push(`<li>${content}</li>`)
    return `__OL_ITEM_${olItems.length - 1}__`
  })

  // 11. 연속된 ul 항목들을 <ul>로 감싸기
  html = html.replace(/((?:__UL_ITEM_\d+__\n?)+)/g, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((item) => {
        const index = parseInt(item.match(/__UL_ITEM_(\d+)__/)?.[1] || '0')
        return ulItems[index]
      })
      .join('\n')
    return `<ul style="margin: 12px 0; padding-left: 24px; list-style-type: disc;">${items}</ul>`
  })

  // 12. 연속된 ol 항목들을 <ol>로 감싸기
  html = html.replace(/((?:__OL_ITEM_\d+__\n?)+)/g, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((item) => {
        const index = parseInt(item.match(/__OL_ITEM_(\d+)__/)?.[1] || '0')
        return olItems[index]
      })
      .join('\n')
    return `<ol style="margin: 12px 0; padding-left: 24px; list-style-type: decimal;">${items}</ol>`
  })

  // 13. 수평선 (---, ***)
  html = html.replace(
    /^[-*]{3,}$/gm,
    '<hr style="margin: 24px 0; border: 0; border-top: 1px solid #e5e7eb;">'
  )

  // 14. 문단 처리 - 빈 줄로 구분된 텍스트를 p 태그로 감싸기
  const paragraphs = html.split(/\n\n+/)
  html = paragraphs
    .map((para) => {
      para = para.trim()
      if (!para) return ''

      // 이미 HTML 태그로 시작하거나 플레이스홀더인 경우 p 태그로 감싸지 않음
      if (
        para.startsWith('<') ||
        para.startsWith('__PLACEHOLDER_') ||
        para.startsWith('__UL_ITEM_') ||
        para.startsWith('__OL_ITEM_')
      ) {
        return para
      }

      // 나머지 텍스트는 p 태그로 감싸고 내부 줄바꿈은 br로 변환
      return `<p style="margin: 12px 0; line-height: 1.6;">${para.replace(/\n/g, '<br>')}</p>`
    })
    .filter((p) => p) // 빈 문자열 제거
    .join('\n')

  // 15. 마지막으로 모든 플레이스홀더를 원래 HTML로 복원
  for (const [key, value] of placeholders.entries()) {
    html = html.split(key).join(value)
  }

  return html
}

// Q&A 카테고리 확인 함수
function isQACategory(category: MainCategory | null): boolean {
  if (!category) return false

  // Q&A 관련 카테고리 슬러그들
  const qaCategories = ['qa', 'qna', 'question', 'help', '질문답변', '문의']
  return qaCategories.some(
    (qa) =>
      category.slug.toLowerCase().includes(qa) ||
      category.name.toLowerCase().includes(qa)
  )
}

// 프롬프트 템플릿
function createPrompt(post: MainPost): string {
  // HTML 태그 제거 (TipTap 에디터에서 오는 HTML 컨텐츠 처리)
  const cleanContent = post.content
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ') // &nbsp; 공백으로 변환
    .replace(/&lt;/g, '<') // HTML 엔티티 디코딩
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()

  const cleanTitle = post.title.trim()

  // 영어로 프롬프트 작성 (한글 인코딩 문제 회피)

  return `You are an AI assistant for a Korean developer community. Please provide a helpful answer to the following question.

IMPORTANT RULES:
- Answer MUST be in Korean language
- Adjust answer length based on the question complexity:
  * Simple questions (예: "이것이 무엇인가요?") → 1-3 paragraphs
  * Technical questions → 5-8 paragraphs with code examples
  * Complex problems → Detailed explanation with multiple sections
- Use markdown formatting: **bold**, \`inline code\`, code blocks with triple backticks
- Include code examples when relevant to the question
- Be concise for simple questions, detailed for complex ones
- Focus on being helpful and accurate rather than lengthy
- Structure with headers (##, ###) only when the answer is long enough to need sections
- Provide practical examples when they add value
- Don't force lengthy answers for simple questions

Question Title: ${cleanTitle}
Question Content: ${cleanContent}

Please provide an appropriately sized answer in Korean based on the question's complexity:`
}

// AI 모델 호출 헬퍼 함수
async function callAIModel(
  model: string,
  prompt: string
): Promise<ChatCompletion> {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, AI_CONFIG.TIMEOUT_MS)

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant for a developer community. Provide helpful and professional answers in Korean.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      // @ts-expect-error - AbortController signal 지원
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return completion
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

// AI 응답 생성 함수
export async function generateAIResponse(
  post: MainPost & { category: MainCategory | null }
): Promise<string | null> {
  try {
    // Q&A 카테고리인지 확인
    if (!isQACategory(post.category)) {
      return null
    }

    const prompt = createPrompt(post)

    // AI 응답 생성 (1순위 모델 시도, 실패시 2순위)
    let completion
    try {
      completion = await callAIModel(AI_MODELS.PRIMARY, prompt)
    } catch {
      // 1순위 실패시 2순위 모델 시도
      completion = await callAIModel(AI_MODELS.SECONDARY, prompt)
    }

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return null
    }

    // AI 봇 응답은 검열 건너뛰기 (AI는 안전한 응답 생성)
    // 검열 시스템이 과도하게 차단하는 문제 (class, hello 등도 차단)

    // 마크다운 내용을 HTML로 변환
    const htmlContent = markdownToHTML(response)

    // HTML에서 태그를 제거하여 실제 텍스트 길이 확인
    const textLength = htmlContent.replace(/<[^>]*>/g, '').trim().length

    // 댓글 최소/최대 길이 검증 (AI는 더 긴 답변 허용)
    if (textLength < 1 || textLength > AI_CONFIG.MAX_COMMENT_LENGTH) {
      console.error(
        `AI 응답 길이가 유효하지 않음: ${textLength}자 (최대: ${AI_CONFIG.MAX_COMMENT_LENGTH}자)`
      )
      return null
    }

    return htmlContent
  } catch (error) {
    console.error('AI 응답 생성 중 오류:', error)
    return null
  }
}

// AI 봇 사용자 조회
export async function getAIBotUser(): Promise<User | null> {
  // 지정된 사용자 ID로 조회
  const user = await prisma.user.findUnique({
    where: { id: AI_CONFIG.BOT_USER_ID },
  })

  if (!user) {
    console.error(`AI 봇 사용자를 찾을 수 없음: ${AI_CONFIG.BOT_USER_ID}`)
  }

  return user
}

// Q&A 게시글에 AI 댓글 생성
export async function createAIComment(postId: string): Promise<void> {
  try {
    // 게시글 조회
    const post = await prisma.mainPost.findUnique({
      where: { id: postId },
      include: { category: true },
    })

    if (!post || post.status !== 'PUBLISHED') {
      return
    }

    // Q&A 카테고리 확인
    if (!isQACategory(post.category)) {
      return
    }

    // 이미 AI 댓글이 있는지 확인
    const existingAIComment = await prisma.mainComment.findFirst({
      where: {
        postId,
        authorId: AI_CONFIG.BOT_USER_ID,
      },
    })

    if (existingAIComment) {
      return
    }

    // AI 응답 생성
    const aiResponse = await generateAIResponse(post)
    if (!aiResponse) {
      return
    }

    // AI 봇 사용자 확인
    const aiBot = await getAIBotUser()
    if (!aiBot) {
      return
    }

    // 댓글 생성
    await prisma.mainComment.create({
      data: {
        content: aiResponse,
        postId,
        authorId: aiBot.id,
        authorRole: aiBot.globalRole, // 작성자 역할 저장
      },
    })

    // 게시글 댓글 수 업데이트
    await prisma.mainPost.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    })

    // Redis 캐시 무효화 - 댓글이 추가되었으므로 캐시 삭제
    const { redisCache, generateCacheKey } = await import('@/lib/cache/redis')
    await redisCache.del(generateCacheKey('main:post:comments', { postId }))
  } catch (error) {
    console.error('[AI Bot] AI 댓글 생성 중 오류:', error) // 오류만 남기기
  }
}

// 배치로 여러 Q&A 게시글에 AI 댓글 생성
export async function processQAPosts(): Promise<void> {
  try {
    // Q&A 카테고리 조회
    const qaCategories = await prisma.mainCategory.findMany({
      where: {
        OR: [
          { slug: { contains: 'qa' } },
          { slug: { contains: 'question' } },
          { name: { contains: '질문' } },
          { name: { contains: 'Q&A' } },
        ],
      },
    })

    if (qaCategories.length === 0) {
      // Q&A 카테고리가 없으면 스킵
      return
    }

    // 최근 24시간 내 AI 댓글이 없는 Q&A 게시글 조회
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const posts = await prisma.mainPost.findMany({
      where: {
        categoryId: {
          in: qaCategories.map((c) => c.id),
        },
        status: 'PUBLISHED',
        createdAt: {
          gte: yesterday,
        },
        comments: {
          none: {
            authorId: AI_CONFIG.BOT_USER_ID,
          },
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: AI_CONFIG.MAX_BATCH_SIZE,
    })

    // 각 게시글에 AI 댓글 생성
    for (const post of posts) {
      await createAIComment(post.id)
      // API 제한을 피하기 위해 잠시 대기
      await new Promise((resolve) =>
        setTimeout(resolve, AI_CONFIG.BATCH_DELAY_MS)
      )
    }
  } catch (error) {
    console.error('Q&A 게시글 처리 중 오류:', error)
  }
}
