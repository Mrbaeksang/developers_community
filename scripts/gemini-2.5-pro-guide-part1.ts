import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🚀 [시리즈] GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드 - 1부

> **📌 이 글은 시리즈 연재물입니다**
> - **1부**: 무료 가입 및 시작하기 (현재 글)  
> - **2부**: 모델 설정 및 커스텀 세팅 가이드 (다음 글 예정)

![GEMINI 2.5 Pro 메인 이미지](https://i.postimg.cc/3NPhzBrc/image.png)

## 🤔 AI 서비스, 어디서 결제해야 할지 모르겠죠?

요즘 AI 열풍이 불면서 ChatGPT, Claude, Gemini 등 수많은 AI 서비스들이 쏟아지고 있습니다. 그런데 정작 **어떤 걸 써야 할지, 어디서 결제해야 할지** 헷갈리시죠?

특히 한국에서는 결제가 막혀있거나, 복잡한 우회 방법을 써야 하는 경우가 많아서 더욱 어려움을 겪고 계실 겁니다.

## 🏆 LMArena에서 독보적 1등을 차지한 GEMINI 2.5 Pro

![LMArena 순위](https://i.postimg.cc/qMVMbJtM/image.png)

**LMArena**는 전 세계 AI 모델들의 성능을 객관적으로 평가하는 플랫폼입니다. 그리고 현재 **GEMINI 2.5 Pro**가 독보적인 1등을 차지하고 있습니다!

### 🎯 GEMINI 2.5 Pro의 특징
- **최고 수준의 추론 능력**
- **긴 컨텍스트 처리 가능** (최대 200만 토큰)
- **멀티모달 지원** (텍스트, 이미지, 비디오, 오디오)
- **실시간 대화형 처리**

## 🎁 그런데 이 최강 AI를 **무료로** 쓸 수 있다는 사실!

네, 맞습니다! GEMINI 2.5 Pro를 **완전 무료로** 사용할 수 있는 방법이 있습니다. 

하지만 **아는 사람들만 쓰고 있어요**. 왜냐하면 구글이 대대적으로 홍보하지 않고, 개발자들 위주로만 알려져 있기 때문입니다.

## 🚀 무료로 쓰는 방법 - 바로 시작하기

### 1단계: Google AI Studio 접속

먼저 아래 링크로 접속하세요:
👉 **https://aistudio.google.com/**

![Google AI Studio 홈페이지](https://i.postimg.cc/7Ly65xkW/image.png)

### 2단계: 구글 계정으로 로그인

- 구글 계정이 있다면 바로 로그인
- 없다면 구글 계정 먼저 생성 (gmail.com에서 가능)

### 3단계: 무료 사용 시작!

로그인하면 바로 GEMINI 2.5 Pro를 무료로 사용할 수 있습니다!

## 🎉 1부 마무리

이렇게 간단하게 세계 최고 성능의 AI인 GEMINI 2.5 Pro를 무료로 사용할 수 있습니다.

**하지만 잠깐!** 단순히 가입하는 것만으로는 진정한 활용이 어렵습니다. 

**2부**에서는:
- 모델 설정하는 방법
- Tools 설정 완벽 가이드
- 나만의 커스텀 세팅하는 법
- 개인화된 AI 환경 구축
- 고급 설정 활용 팁

을 자세히 알려드리겠습니다!

---

## 📚 시리즈 연재 안내

- **1부**: 무료 가입 및 시작하기 ✅ (현재 글)
- **2부**: 모델 설정 및 커스텀 세팅 가이드 (다음 글 예정)

---

💡 **이 글이 도움이 되셨나요?** 
- 👍 좋아요와 댓글로 응원해 주세요!
- 🔔 알림 설정하시면 2부도 놓치지 않으실 거예요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: 'GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드 - 1부',
        slug: 'gemini-2.5-pro-free-guide-part1',
        content,
        excerpt:
          '사실 처음 GEMINI 2.5 Pro 무료 사용법을 들었을 때는 "또 그런 거겠지" 싶었는데, 실제로 써보니까 ChatGPT Plus 결제할 이유가 없더라고요. 세계 1위 AI를 완전 무료로 쓸 수 있는 숨겨진 방법을 알려드립니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle: '무료로 GEMINI 2.5 Pro 쓰는 숨겨진 방법 (세계 1위 AI)',
        metaDescription:
          'ChatGPT Plus 월 2만원? GEMINI 2.5 Pro가 무료인데 왜 돈내고 써요? 개발자들만 아는 Google AI Studio 완벽 가이드와 무료 사용법을 솔직하게 공개합니다.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: 'Gemini', slug: 'gemini', color: '#059669' },
      { name: '무료', slug: 'free', color: '#059669' },
      { name: '가이드', slug: 'guide', color: '#7c3aed' },
      { name: '시리즈', slug: 'series', color: '#06b6d4' },
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

    console.log(`✅ GEMINI 2.5 Pro 가이드 1부 게시글 생성 완료!`)
    console.log(`📝 제목: ${post.title}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`👀 조회수: ${post.viewCount}`)
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
