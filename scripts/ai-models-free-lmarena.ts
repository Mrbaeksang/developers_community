import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 월 200달러짜리 AI 코딩 모델들 공짜로 쓰는 방법 (합법)

사실 저도 처음엔 Claude Pro 결제하려고 카드 들고 있었습니다.


월 20달러면 나름 괜찮은 가격이라고 생각했거든요.


그런데 GPT Plus도 20달러, Gemini Advanced도 20달러... 이것저것 구독하면 월 100달러는 훌쩍 넘어가더라고요.


그러던 중 발견한 게 있습니다.


## 🔥 현재 AI 코딩 모델 랭킹 1위부터 10위까지

LMArena라는 곳에서 실시간으로 AI 모델들을 경쟁시켜서 랭킹을 매기는데요.


**현재 Top 10 (2025년 기준):**
- 🥇 **claude-opus-4-1-20250805-thinking-16k** - Anthropic의 최신 플래그십
- 🥈 **qwen3-235b-a22b-instruct-2507** - Alibaba의 235B 파라미터 괴물
- 🥉 **gpt-5-high** - OpenAI의 아직 공개 안 된 모델
- 4위: gemini-2.5-pro - Google의 최신작
- 5위: o3-2025-04-16 - OpenAI의 추론 특화 모델
- 6위: deepseek-r1-0528 - DeepSeek의 오픈소스 강자
- 7위: grok-4-0709 - xAI (일론 머스크)
- 8위: mistral-medium-2508 - 프랑스발 AI
- 9위: glm-4.5 - 중국 Zhipu AI
- 10위: qwen3-coder-480b - 코딩 특화 480B 모델


이 모델들 개별로 구독하면 월 200달러는 가볍게 넘어갑니다.


그런데 이걸 전부 무료로 쓸 수 있는 방법이 있다면?


## 💡 LMArena에서 프리미엄 모델 무료로 쓰는 법

사실 너무 간단해서 허무할 정도입니다.


### Step 1: LMArena 접속하기

먼저 https://lmarena.ai/ 에 접속합니다.


### Step 2: Side by Side 모드 선택

![Side by Side 모드 선택](https://i.postimg.cc/NMGv6Sqv/image.png)

화면 상단 중앙에 'Battle'이 기본값인데, 클릭해서 'Side by Side'를 선택합니다.


이제 원하는 모델 2개를 동시에 비교하면서 쓸 수 있습니다.


### Step 3: 최강 모델 조합 선택

![모델 선택 화면](https://i.postimg.cc/tRMG6BB8/image.png)

제가 추천하는 조합은:
- **claude-opus-4-1-20250805-thinking-16k** (현재 1위)
- **qwen3-235b-a22b-instruct-2507** (현재 2위)


두 모델의 답변을 동시에 받아볼 수 있어서 더 좋은 답변을 선택할 수 있습니다.


## 🚀 실제 성능은 어떨까? (레벨 5 문제로 테스트)

궁금해서 프로그래머스 레벨 5 문제로 테스트해봤습니다.


**2023 현대모비스 알고리즘 경진대회 본선 문제** (정답률 0%)를 던져봤어요.


![문제 화면](https://i.postimg.cc/28Nyvjcs/image.png)


### Claude Opus 4.1의 결과

![Opus 4.1 결과](https://i.postimg.cc/QCQXS54R/image.png)

놀랍게도 단 한 번의 답변으로 4개 중 2개 테스트케이스 통과!


### Qwen3-235B의 결과  

![Qwen3 결과](https://i.postimg.cc/y6krMcKH/image.png)

마찬가지로 2개 통과. 시간 초과로 나머지는 실패했습니다.


### 추가 질문으로 완벽 해결

시간 초과 문제를 Ask followup으로 물어보니:

![후속 질문](https://i.postimg.cc/NjfXn7h8/image.png)


단 두 번의 대화만으로 레벨 5 문제를 거의 완벽하게 해결!

![최종 결과](https://i.postimg.cc/3NT4F2Cv/image.png)


프로그래머스 레벨 5는 정말 어려운 문제인데, 이 정도 성능이면 실무에서도 충분합니다.


## 📊 실제로 써본 솔직한 후기

### 👍 좋았던 점

**확실히 개선된 부분:**
- 완전 무료 (신용카드 등록도 필요 없음)
- 최신 모델들 바로바로 사용 가능
- Side by Side로 답변 비교 가능
- 익명 사용 가능 (로그인 불필요)


### 😅 아쉬운 점

**개선이 필요한 점:**
- 가끔 대기 시간이 있음 (사람 많을 때)
- 세션이 끊기면 대화 내용 사라짐
- API 제공 안 함 (웹에서만 사용)
- 파일 업로드 기능 없음


## 🎯 이런 분들에게 추천

솔직히 이런 분들은 꼭 써보세요:

- AI 구독료가 부담스러운 개발자
- 여러 모델 성능을 비교하고 싶은 분
- 최신 모델 먼저 써보고 싶은 얼리어답터
- 학습 목적으로 AI 활용하는 학생


## 💎 보너스 팁: Gemini 2.5 Pro도 무료로!

코딩 특화는 아니지만 전체적인 텍스트 생성에서 1등인 Gemini 2.5 Pro를 무료로 쓰고 싶으신 분들은 제가 이전에 작성한 가이드를 참고하세요.


(Google AI Studio를 통한 무료 사용법 정리해둠)


## 🤔 결론

개인적으로는 유료 구독하기 전에 LMArena에서 충분히 테스트해보는 걸 추천합니다.


생각보다 무료 버전으로도 충분한 경우가 많더라고요.


특히 Side by Side 모드로 여러 모델 답변을 비교하면서 쓰면, 오히려 유료 구독보다 더 좋은 결과를 얻을 수도 있습니다.


물론 API가 필요하거나 대용량 파일 처리가 필요하면 유료 구독이 낫겠지만, 일반적인 코딩 도움 정도는 이걸로 충분해요.


여러분은 어떤 AI 모델 쓰고 계신가요? LMArena 써보신 분 있으면 댓글로 경험 공유해주세요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: '월 200달러짜리 AI 코딩 모델들 공짜로 쓰는 방법 (합법)',
        slug: 'free-ai-coding-models-lmarena-guide',
        content,
        excerpt:
          'Claude Opus 4.1, GPT-5, Qwen3-235B 등 최신 AI 코딩 모델들을 LMArena에서 완전 무료로 사용하는 방법을 소개합니다. 실제 레벨 5 알고리즘 문제로 테스트한 결과까지!',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(400, 600),
        metaTitle: '월 200달러 AI 모델 무료 사용법 - LMArena 완벽 가이드',
        metaDescription:
          'Claude Opus 4.1, GPT-5, Qwen3 등 프리미엄 AI 코딩 모델을 완전 무료로 사용하는 방법. LMArena 활용법과 실제 성능 테스트 결과 공개.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: 'Claude', slug: 'claude', color: '#d97706' },
      { name: 'GPT-5', slug: 'gpt5', color: '#10a37f' },
      { name: 'Qwen', slug: 'qwen', color: '#059669' },
      { name: 'LMArena', slug: 'lmarena', color: '#dc2626' },
      { name: '무료', slug: 'free', color: '#059669' },
      { name: '팁', slug: 'tip', color: '#06b6d4' },
      { name: '가이드', slug: 'guide', color: '#7c3aed' },
    ]

    for (const tagData of tags) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagData.name },
      })

      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            color: tagData.color,
            postCount: 1,
          },
        })
      } else {
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } },
        })
      }

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.error('✅ 게시글이 성공적으로 생성되었습니다!')
    console.error(`📝 제목: ${post.title}`)
    console.error(`🔗 URL: /main/posts/${post.id}`)
    console.error(`📊 조회수: ${post.viewCount}`)
  } catch (error) {
    console.error('❌ 게시글 생성 오류:', error)
    throw error
  }
}

if (require.main === module) {
  createPost()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
