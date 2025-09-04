import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# GPT 허언증 100% 해결하는 숨겨진 방법들

![GPT 허언증 100% 해결하는 숨겨진 방법들](https://i.postimg.cc/vHFT14C2/image.png)

솔직히 ChatGPT 쓰면서 가장 답답한 순간이 언제인가요?

저는 "염소 꼬리 흔들기 춤이 한국에서 유행한다던데 이유가 뭐야?"라는 말도 안 되는 질문을 던졌을 때였어요.

그런데 GPT가 대답한 건... "네, 맞습니다! 염소 꼬리 흔들기 춤이 틱톡에서 큰 인기를 끌고 있어서..."

![GPT 허언증 예시](https://i.postimg.cc/HnCmLyjQ/image.png)

아니, 뭘 맞다는 거야? 그런 춤 자체가 없는데?


## 🤔 왜 GPT는 이렇게 거짓말을 할까?

사실 GPT가 의도적으로 거짓말을 하는 건 아니에요.

문제는 GPT의 작동 방식에 있습니다. 이전에 학습한 데이터를 바탕으로 "그럴싸한" 답변을 생성하는 거거든요.

없는 정보도 마치 있는 것처럼 포장해서 내놓는 게 바로 이 때문이죠.


아무리 "거짓말 하지 마"라고 해봤자 소용없어요. 애초에 거짓말이라는 개념 자체를 모르니까요.

## 💡 해결법 1: GPT 웹검색 기능 활성화

가장 간단한 방법부터 시작해보죠.

ChatGPT에서 웹검색 기능을 켜면 실시간 정보를 바탕으로 답변을 해줍니다.

![GPT 웹검색 활성화 방법](https://i.postimg.cc/wTVJ55Xb/image.png)

**설정 방법:**
1. ChatGPT 설정으로 들어가기
2. "웹 검색" 옵션 활성화
3. 이제 질문하면 인터넷에서 정보를 찾아서 답변


확실히 정확도가 많이 올라가더라고요. 다만 검색하는 시간 때문에 답변이 좀 느려지긴 해요.

## 🚀 해결법 2: 숨겨진 고수용 도구 lmarena.ai 활용

개인적으로 이 방법이 가장 인상적이었습니다.

일반 사용자들은 잘 모르는 곳인데, 개발자들 사이에서는 이미 유명한 플랫폼이에요.

**lmarena.ai 사용법:**

### 1단계: Direct Chat 모드

lmarena.ai에 접속해서 왼쪽 상단의 "Direct Chat"을 클릭합니다.

![Direct Chat 선택](https://i.postimg.cc/02Wj2Vdx/image.png)

### 2단계: 검색 모델 선택

가운데 지구본 모양 아이콘을 클릭한 후, "o3-search" 모델을 선택해요.

![지구본 아이콘 클릭](https://i.postimg.cc/Bnb8xrQX/image.png)

![o3-search 모델 선택](https://i.postimg.cc/9FnXjrCQ/image.png)

이게 현재 검색 능력 랭킹 1위 모델입니다. 일반인들은 잘 모르는데, 성능이 정말 뛰어나더라고요.

![검색 랭킹 1위](https://i.postimg.cc/VsHPJpT7/image.png)

### 3단계: 실제 테스트

"오늘 한국 이슈 및 키워드 알려줘"라고 물어봤는데...

![정확한 답변 결과](https://i.postimg.cc/DyMGYvNq/image.png)

시간은 좀 걸렸지만 정말 자세하고 정확한 정보를 가져와 줍니다. GPT 허언증과는 차원이 다른 수준이에요.

## 📊 실제로 써본 후기

**Direct Chat의 장점:**
- 검색 정확도가 압도적으로 높음
- 실시간 정보 업데이트가 빠름
- 출처까지 같이 제공해줌

**단점:**
- 하루 사용 횟수 제한 있음 (무료 계정 기준)
- 답변 속도가 좀 느림

## 🎯 무제한 사용 꿀팁

횟수 제한 때문에 답답하시다고요?

그럼 "Battle" 모드를 써보세요. 익명의 두 모델이 동시에 답변해주는 방식인데, 여기서는 무제한으로 사용할 수 있어요.

**Battle 모드 활용법:**
- 같은 질문을 두 모델이 동시에 답변
- 더 나은 답변을 선택하면서 학습
- 무제한 이용 가능 (이게 핵심!)

## 🤔 결론적으로는...

개인적으로 GPT 허언증 때문에 스트레스받았던 분들에게는 확실히 도움이 될 것 같네요.

특히 정확한 정보가 중요한 업무나 학습을 하시는 분들이라면 lmarena.ai 한 번 써보시길 추천합니다.

완벽한 해답은 아니지만, 기존 GPT의 한계를 많이 극복할 수 있거든요.

여러분은 GPT 허언증 때문에 곤란했던 경험 있으시나요? 댓글로 공유해봐요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: 'GPT 허언증 100% 해결하는 숨겨진 방법들',
        slug: 'gpt-hallucination-solution-methods',
        content,
        excerpt:
          '솔직히 ChatGPT 허언증 때문에 답답했던 적 있으시죠? lmarena.ai의 o3-search 모델과 웹검색 활용법으로 이 문제를 완전히 해결할 수 있어요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle: 'GPT 허언증 해결하는 숨겨진 방법 2가지 (lmarena.ai 활용법)',
        metaDescription:
          'ChatGPT가 자꾸 거짓 정보를 제공해서 답답하셨나요? 웹검색 활용법과 lmarena.ai의 o3-search 모델로 GPT 허언증을 완전히 해결하는 실전 방법을 알려드려요.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: '허언증', slug: 'hallucination', color: '#dc2626' },
      { name: 'lmarena', slug: 'lmarena', color: '#059669' },
      { name: '팁', slug: 'tips', color: '#059669' },
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

    console.error('✅ GPT 허언증 해결 방법 게시글이 성공적으로 생성되었습니다!')
    console.error(`📝 게시글 ID: ${post.id}`)
    console.error(`🔗 URL: /main/posts/${post.id}`)
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
