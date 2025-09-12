import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN' as const

async function createGoogleAIModePost() {
  try {
    const content = `![Google AI Mode](https://i.postimg.cc/3x3DqcT4/image.png)

드디어 한국에도 Google AI 모드가 정식 출시되었습니다! 

2025년 9월 9일부터 한국어를 공식 지원하기 시작한 Google AI 모드는 기존 검색과는 차원이 다른 검색 경험을 제공합니다. 오늘은 제가 직접 사용해본 Google AI 모드의 모든 것을 알려드리겠습니다.

## Google AI 모드란?

Google AI 모드는 Gemini 2.5 커스텀 버전을 기반으로 한 차세대 AI 검색 기능입니다. 

기존 키워드 검색과 달리 복잡하고 긴 질문도 한 번에 이해하고, 마치 전문가와 대화하듯 자연스럽게 답변을 제공합니다.

### 핵심 기술: 쿼리 팬아웃(Query Fan-out)

Google AI 모드의 비밀 무기는 바로 '쿼리 팬아웃' 기술입니다. 

사용자의 질문을 여러 하위 주제로 분해하고, 동시에 수십 개의 검색 쿼리를 실행해서 훨씬 더 깊고 넓은 정보를 탐색합니다. 이게 바로 ChatGPT나 다른 AI와의 결정적 차이점이죠.

## 실제 사용 방법 (스크린샷 포함)

자, 이제 실제로 어떻게 사용하는지 단계별로 보여드릴게요.

### 1단계: Google AI 모드 접속

구글에 접속한 후 상단의 **AI 모드** 탭을 클릭합니다.

![AI 모드 탭](https://i.postimg.cc/gjp7RWCk/image.png)

### 2단계: AI 모드가 안 보이는 경우

만약 AI 모드 탭이 보이지 않으신다면, 상단의 플라스크 모양 아이콘을 클릭하세요.

![플라스크 아이콘](https://i.postimg.cc/tgVvMJy4/image.png)

그 다음 **AI 실험 사용**을 클릭하면 됩니다.

![AI 실험 사용 버튼](https://i.postimg.cc/fTJcKFMw/image.png)

## 실제 사용 예시

### 예시 1: 복잡한 표 생성 요청

"다양한 커피 추출 방식 비교표 만들어줘"라고 질문했을 때의 결과입니다.

![커피 추출 방식 비교표 결과](https://i.postimg.cc/tJfVwq99/image.png)

보시는 것처럼 에스프레소, 드립, 프렌치프레스 등 다양한 추출 방식을 체계적인 표로 정리해서 보여줍니다. 추출 시간, 온도, 맛의 특징까지 한눈에 비교할 수 있도록 스마트하게 답변을 제공하네요!

### 예시 2: 이미지 분석 (Google Lens 통합)

사진을 업로드하고 분석을 요청한 결과입니다.

![호랑이 사진 분석 결과](https://i.postimg.cc/CMtBFKVg/image.png)

"이 사진은 밤 또는 어두운 환경에서 숲길을 걷고 있는 호랑이를 촬영한 것입니다"

단순히 호랑이를 인식하는 것을 넘어서 촬영 환경(밤/어두운 환경), 배경(숲길), 동작(걷고 있는) 등을 정확하게 분석해냅니다. 이게 바로 멀티모달 AI의 힘입니다!

## Google AI 모드의 장점

### 1. 완전 무료
ChatGPT Plus는 월 $20, Claude Pro는 월 $20, Perplexity Pro는 월 $20인데, Google AI 모드는 **완전 무료**입니다!

### 2. 실시간 최신 정보
ChatGPT와 달리 실시간 웹 검색을 기반으로 하기 때문에 항상 최신 정보를 제공합니다.

### 3. 멀티모달 검색
- **텍스트**: 복잡한 질문도 OK
- **음성**: 마이크로 긴 질문 말하기
- **이미지**: 사진 찍어서 바로 질문

### 4. 한국어 최적화
한국어를 공식 지원하는 첫 번째 국가 중 하나로 선정되어, 한국어 질문 이해도와 답변 품질이 매우 뛰어납니다.

## ChatGPT, Perplexity와 비교

| 기능 | Google AI 모드 | ChatGPT | Perplexity |
|------|---------------|---------|------------|
| 가격 | 무료 | $20/월 | $20/월 |
| 실시간 검색 | ✅ 기본 지원 | ⚠️ 제한적 | ✅ 지원 |
| 출처 표시 | ✅ | ❌ | ✅ |
| 한국어 품질 | 매우 우수 | 우수 | 보통 |
| 이미지 분석 | ✅ 통합 | ✅ GPT-4V | ⚠️ 제한적 |
| Google 서비스 연동 | ✅ 완벽 | ❌ | ❌ |

## 활용 팁

### 1. 복잡한 질문일수록 강력해요
"서울에서 부산까지 기차로 가는데 중간에 들를만한 맛집 추천해주고, 각 역에서의 정차 시간도 알려줘"처럼 여러 정보가 필요한 질문에 탁월합니다.

### 2. 후속 질문 활용하기
첫 답변 후 "더 자세히 설명해줘", "다른 방법은?" 같은 후속 질문으로 대화를 이어갈 수 있습니다.

### 3. 이미지 + 텍스트 조합
메뉴판 사진 찍고 "이 중에서 매운 음식 추천해줘"처럼 이미지와 텍스트를 조합한 질문이 가능합니다.

## 주의사항

### 아직 실험 단계
Google Labs의 실험 기능이므로 가끔 오류가 발생하거나 답변이 완벽하지 않을 수 있습니다.

### 개인정보 주의
검색 기록이 Google 계정에 저장되므로 민감한 정보는 주의해서 검색하세요.

## 마치며

Google AI 모드는 검색의 패러다임을 완전히 바꿀 게임 체인저입니다.

특히 한국어 지원이 이렇게 빨리, 이렇게 완성도 높게 시작된 것은 정말 반가운 소식이네요. 무료인데다가 Google의 강력한 검색 인프라를 활용한다는 점에서 ChatGPT나 Perplexity보다 더 실용적일 수 있습니다.

여러분도 지금 바로 사용해보세요! 키워드 검색의 시대는 끝났습니다. 이제는 AI와 대화하며 검색하는 시대입니다. 🚀

---

## 🔗 관련 글 추천

- [😱 GPT-5보다 코딩 잘하는 AI가 무료라고? 🚨](https://devcom.kr/main/posts/cmfd58ggp0001u8mo40b24qvr)
- [이 프롬프트 하나면 내 사진이 인스타 갬성 무드보드로 변합니다](https://devcom.kr/main/posts/cmfdnjj7w0001u89cmqjc0go5)

#GoogleAI #AI모드 #Gemini #인공지능 #검색엔진 #무료AI #한국어지원`

    const post = await prisma.mainPost.create({
      data: {
        title:
          'Google AI 모드 한국 정식 출시! 사용법부터 ChatGPT 비교까지 완벽 정리',
        slug: 'google-ai-mode-korean-launch-2025-complete-guide',
        content,
        excerpt:
          'Google AI 모드가 드디어 한국어를 공식 지원합니다! 무료로 사용 가능한 Google AI 모드의 사용법과 실제 예시, ChatGPT와의 비교까지 완벽 정리했습니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스 카테고리
        viewCount: 0,
        metaTitle: 'Google AI 모드 한국 출시 - 무료 AI 검색의 새로운 시대',
        metaDescription:
          'Google AI 모드 한국어 지원 시작! Gemini 2.5 기반 무료 AI 검색 서비스의 사용법과 ChatGPT, Perplexity와의 비교 분석',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            globalRole: true,
          },
        },
        category: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    })

    // 태그 연결
    const tagNames = [
      'GoogleAI',
      'AI모드',
      'Gemini',
      '인공지능',
      '검색엔진',
      '무료AI',
      '한국어지원',
    ]

    for (const tagName of tagNames) {
      // slug 생성 (한글은 그대로 유지)
      const slug = tagName.toLowerCase().replace(/\s+/g, '-')

      // 태그 찾기 또는 생성
      const tag = await prisma.mainTag.upsert({
        where: { name: tagName },
        update: {},
        create: {
          name: tagName,
          slug: slug,
        },
      })

      // MainPostTag 연결 생성
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })

      // 태그의 postCount 증가
      await prisma.mainTag.update({
        where: { id: tag.id },
        data: {
          postCount: {
            increment: 1,
          },
        },
      })
    }

    console.log('✅ Google AI 모드 블로그 글이 성공적으로 생성되었습니다!')
    console.log('📝 글 제목:', post.title)
    console.log('🔗 URL: https://devcom.kr/main/posts/' + post.id)
    console.log('👤 작성자:', post.author.name)
    console.log('📂 카테고리:', post.category.name)
    console.log('🏷️ 태그:', tagNames.join(', '))
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createGoogleAIModePost()
