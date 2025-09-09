import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

async function createPost() {
  const content = `# ChatGPT Plus 월 2만원 결제 중단해야 하는 충격적인 이유

솔직히 말씀드리면, 저도 최근까지 ChatGPT Plus를 결제해서 쓰고 있었습니다.

그런데 최신 AI 벤치마크를 확인해보니까 충격적인 순위가 나왔더라구요.

![코딩 성능 비교](https://i.postimg.cc/cJGywXMb/image.png)

현재 코딩 성능에서 Claude Opus 4.1 바로 아래 순위에 있는 모델이 바로 **Qwen3 Max Preview**입니다.

더 놀라운 건, GPT-5 High, Gemini 2.5 Pro, Claude Opus 4보다도 높은 순위라는 점이에요.

![순위 비교](https://i.postimg.cc/15yKn6qr/image.png)

## 사실 ChatGPT가 최고는 아니다

많은 분들이 ChatGPT를 결제해서 쓰고 계시죠. 저도 그랬고요.

하지만 이제는 상황이 많이 달라졌습니다. ChatGPT가 선발주자로서 접근성이 좋았을 뿐, 성능 면에서는 이미 여러 모델에게 밀린 상태예요.

특히 코딩 작업에서는 더욱 그렇습니다.

## Qwen3 Max 무료로 사용하기

가장 중요한 부분입니다. 이 성능 좋은 모델을 **거의 완전 무료**로 쓸 수 있다는 것.

[Qwen Chat](https://chat.qwen.ai/)에서 바로 사용 가능합니다.

![Qwen Chat 인터페이스](https://i.postimg.cc/LXbMYRyz/image.png)

## 실제 사용량과 기능

제가 직접 써보니까 무료 사용량이 상당히 넉넉했습니다.

**지원하는 주요 기능들:**
- 이미지 편집 및 분석
- 웹 개발 (프론트엔드/백엔드 모두)
- 심층 리서치 작업
- 이미지 생성 (DALL-E 급)
- 비디오 생성
- 코딩 에이전트 기능

특히 코딩 에이전트 기능이 인상적이었는데, 복잡한 리팩토링이나 디버깅 작업도 꽤 잘 처리하더라구요.

## 내가 실제로 써본 후기

**장점:**
- GPT-4o보다 코드 이해도가 높음
- 응답 속도가 빠름 (거의 실시간 수준)
- 한국어 이해도 우수
- 무료 사용량이 하루 기준 충분함

### 실제 테스트 1: 이미지 생성

"교복을 입은 어린 소녀가 교실에 서서 칠판에 글을 쓰고 있습니다"라고 요청했을 때:

![이미지 생성 결과](https://i.postimg.cc/KvrQYfpN/image.png)

프롬프트를 정확하게 이해하고 자연스러운 이미지를 생성했습니다.

### 실제 테스트 2: UI 컴포넌트 생성

"사용자의 이름, 이메일, 문제 유형 및 메시지를 포함하는 의미론적 '지원 요청' 양식을 생성합니다. 양식 요소는 수직으로 쌓이고 카드 안에 배치되어야 합니다."라고 요청했을 때:

![UI 컴포넌트 생성](https://i.postimg.cc/Hxy9197b/image.png)

여기서 정말 놀랐던 건, **실시간 미리보기**를 지원한다는 점이었습니다.

![배포 기능](https://i.postimg.cc/qqHXJ68S/image.png)

더 충격적인 건 **'배포'** 버튼이 있어서, 1초 만에 실제로 배포하고 링크로 다른 사람과 공유할 수 있다는 점!

### 실제 테스트 3: 코딩 도움

"자바에서 정렬 알고리즘을 구현하는 것을 도와주세요"라고 요청했을 때:

![코딩 도움](https://i.postimg.cc/7YVM46bt/image.png)

단순히 코드만 제공하는 게 아니라, 각 알고리즘의 시간복잡도와 사용 케이스까지 설명해줬습니다.

### 실제 테스트 4: 이미지 편집

"이 곰은 다채로운 그림판과 붓을 들고 그림판 앞에 서서 그림을 그리고 있습니다"라고 요청했을 때:

![이미지 편집](https://i.postimg.cc/2jdnd6dj/image.png)

기존 이미지를 자연스럽게 편집하는 능력도 상당했습니다.

## 다른 무료 대안들

사실 Qwen3 Max 외에도 좋은 무료 옵션들이 있습니다.

Gemini 2.5 Pro도 무료로 사용할 수 있는데, 이건 제가 이전에 작성한 가이드를 참고하시면 도움이 될 것 같네요.
[GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드](https://devcom.kr/main/posts/cmeqzoi540001u8ukrwa1gdpm)

## 결론

개인적으로는 코딩 작업이 많으신 분들께는 Qwen3 Max를 강력 추천합니다.

특히 ChatGPT Plus 월 20달러가 부담스러우셨던 분들이라면, 한 번쯤 시도해보실 만한 가치가 충분히 있어요.

물론 ChatGPT만의 장점도 분명 있습니다. 플러그인 생태계나 사용자 경험 면에서는 여전히 앞서있죠.

하지만 순수 성능, 특히 코딩 성능만 놓고 본다면? Qwen3 Max가 더 나은 선택일 수 있습니다.

여러분은 어떤 AI 모델을 주로 사용하시나요?`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: 'ChatGPT Plus 월 2만원 결제 중단해야 하는 충격적인 이유',
        slug: 'why-cancel-chatgpt-plus-qwen3-max',
        content,
        excerpt:
          'ChatGPT Plus 월 2만원 결제 중이신가요? 더 뛰어난 성능의 AI를 완전 무료로 사용할 수 있는 충격적인 방법을 공개합니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: 0,
        metaTitle: 'ChatGPT Plus 해지해야 하는 이유 - 무료 AI Qwen3 Max',
        metaDescription:
          'ChatGPT Plus보다 뛰어난 코딩 성능의 Qwen3 Max를 완전 무료로 사용하는 방법. 월 2만원 아끼고 더 좋은 AI 쓰기.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: 'Qwen', slug: 'qwen', color: '#06b6d4' },
      { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
      { name: '무료AI', slug: 'free-ai', color: '#059669' },
      { name: '코딩', slug: 'coding', color: '#f59e0b' },
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
    console.error(`🔗 슬러그: ${post.slug}`)
    console.error(`📊 조회수: ${post.viewCount}`)
    console.error(`🏷️ 태그: ${tags.map((t) => t.name).join(', ')}`)
  } catch (error) {
    console.error('❌ 게시글 생성 오류:', error)
    throw error
  }
}

if (require.main === module) {
  createPost()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
