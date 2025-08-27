import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `![나노바나나 썸네일](https://i.postimg.cc/pLgMvhNp/image.png)

# 🍌 화제의 모델 나노바나나 무료로 쓰는법 총정리 !!

사실 처음 나노바나나(nanobananaPie) 얘기 들었을 때는 '또 그런 AI 도구겠지' 싶었어요.


그런데 실제로 써보니까 이게 진짜 대박이더라고요.

## 🤖 나노바나나가 뭐길래 이렇게 화제일까요?

AI 이미지 합성 도구 써보신 분들이라면 이런 상황 겪어보셨을 거예요:

- 복잡한 프롬프트 작성법 공부하느라 시간 보내고
- 원하는 결과 안 나와서 몇 번씩 다시 시도하고  
- 유료 결제해야 제대로 된 퀄리티 나오고...


그런데 나노바나나는 좀 다른 접근을 하더라고요.

## 💡 실제로는 어떤 성능인지

### 제미나이 홈페이지에서 먼저 체험해보기

기존에 우리가 이미지 합성할 때 보통 이랬잖아요:


1. 복잡한 프롬프트 작성법 공부하고
2. 여러 번 시행착오 거치면서 결과 확인하고
3. 결국 원하는 퀄리티 나오려면 돈 내고...


그런데 나노바나나로는 정말 달라집니다.


**실제로 테스트해보니:**
- 유재석님 사진과 막대사탕 사진을 "합성해달라"고 간단히 요청
- 몇 초 만에 자연스럽게 합성된 결과물 완성
- 별도 프롬프트 공부 없이도 직관적으로 사용 가능


![유재석님 사진](https://i.postimg.cc/kGyptGhF/image.png)

![막대사탕 사진](https://i.postimg.cc/7Yxcr1fB/image.png)

![제미나이 합성 결과](https://i.postimg.cc/7ZhWfx10/image.png)

### 제미나이의 놀라운 성능, 하지만...

[제미나이 공식 홈페이지](https://gemini.google.com/)에서 사용해보면 성능이 정말 인상적이에요.


사실 이런 류의 무료 AI 도구들이 보통 한계가 명확하거든요.


그런데 생각보다 이런 부분들이 잘 해결되어 있더라고요.


물론 완벽하지는 않아요.


### 아직 아쉬운 부분들

**제미나이 홈페이지 한계:**
- 사용량 제한이 있어서 많이 못 씀 - 하루에 몇 번만 써도 막힘
- 가끔 홈페이지 폭주하면 느려짐 - 특히 저녁 시간대에 답답함  
- 홈페이지에서만 사용 가능 - 다른 환경에서는 접근 불가

## 🚀 오픈라우터로 무제한 사용하는 법

### 가장 간단한 시작 방법

복잡한 준비 필요 없고, 이렇게 하시면 됩니다.

**1단계:** [openrouter.ai](https://openrouter.ai) 접속해서 오른쪽 위 'Sign in' 클릭

![오픈라우터 가입](https://i.postimg.cc/PxQ4Sczd/image.png)

**2단계:** 가입 완료 후 [https://openrouter.ai/chat](https://openrouter.ai/chat) 으로 이동  

**3단계:** 왼쪽 위 'Add model' 선택

![애드모델 선택](https://i.postimg.cc/5twqtGr8/image.png)

**4단계:** 'Gemini 2.5 Flash Image Preview (free)' 선택

![Gemini 2.5 Flash 선택](https://i.postimg.cc/dQWRDG5N/image.png)

### 실제 사용해보니

강호동 이미지를 피규어화 시켜달라고 했을 때:

![강호동 원본 이미지](https://i.postimg.cc/sDQWXqQ1/image.png)

![오픈라우터 결과](https://i.postimg.cc/L47qrDCS/image.png)

**Before:** 제미나이 홈페이지에서 몇 번 시도 후 사용량 제한
**After:** 오픈라우터에서 무제한으로 여러 번 재시도 가능


응답이 마음에 안 들면 'Retry' 버튼 누르기만 하면 끝.

![Retry 버튼](https://i.postimg.cc/pTSTMVBC/image.png)

### 좋았던 점들

**확실히 개선된 부분:**
- 사용량 제한 없음 - 하루 종일 써도 막히지 않음
- 여러 번 재시도 가능 - 마음에 들 때까지 계속 도전
- 안정적인 접속 - 홈페이지 폭주 상관없이 쭉 사용 가능


### 주의할 점들

처음 시도하시는 분들이 자주 실수하는 부분들이 있어요.

- 모델 선택 실수 - 반드시 'Gemini 2.5 Flash Image Preview (free)' 선택해야 함
- 이미지 업로드 방법 - 드래그앤드롭이 가장 편함

## 🎨 더 완성도 높은 결과를 원한다면

이미지 프롬프트 제대로 작성하는 방법이 궁금하시다면, [🎨 AI 이미지 완성도를 200% 끌어올리는 프롬프트 3단계 트릭](https://devcom.kr/main/posts/cmep068hz0001u8hghwutr5cq) 글도 참고해보세요.

## 🤔 결론적으로는...

개인적으로는 제미나이 성능 자체는 정말 만족스러워요.


완벽한 해답은 아니지만, 이미지 합성이나 편집 작업하시는 분들에게는 확실히 도움이 될 것 같네요.

특히 사용량 제한 때문에 답답했던 분들에게는 오픈라우터 활용법 한 번 시도해볼 만하다고 생각합니다.


여러분은 어떻게 보시나요? 비슷한 경험 있으시거나 궁금한 점 있으시면 댓글로 얘기해봐요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: '🍌 화제의 모델 나노바나나 무료로 쓰는법 총정리 !!',
        slug: 'nanobanan-free-usage-guide-viral-2025',
        content,
        excerpt:
          '제미나이 홈페이지 사용량 제한 때문에 답답했다면? 오픈라우터로 나노바나나 무제한 사용하는 완벽 가이드를 알려드릴게요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle: '🍌 화제의 모델 나노바나나 무료로 쓰는법 총정리 !!',
        metaDescription:
          '제미나이 홈페이지 사용량 제한이 답답하다면? 오픈라우터 활용해서 나노바나나 무제한으로 사용하는 완벽 가이드. 간단한 설정으로 AI 이미지 합성 마음껏 이용하세요.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: '튜토리얼', slug: 'tutorial', color: '#8b5cf6' },
      { name: '가이드', slug: 'guide', color: '#7c3aed' },
      { name: 'Gemini', slug: 'gemini', color: '#059669' },
    ]

    for (const tagData of tags) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagData.name },
      })

      if (!tag) {
        // slug로도 중복 체크
        const existingTagBySlug = await prisma.mainTag.findUnique({
          where: { slug: tagData.slug },
        })

        if (existingTagBySlug) {
          tag = existingTagBySlug
          await prisma.mainTag.update({
            where: { id: tag.id },
            data: { postCount: { increment: 1 } },
          })
        } else {
          tag = await prisma.mainTag.create({
            data: {
              name: tagData.name,
              slug: tagData.slug,
              color: tagData.color,
              postCount: 1,
            },
          })
        }
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

    console.error('나노바나나 무료 사용법 가이드 게시글 생성 완료:', post.id)
  } catch (error) {
    console.error('게시글 생성 오류:', error)
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
