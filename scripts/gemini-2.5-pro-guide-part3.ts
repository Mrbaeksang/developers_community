import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎯 [시리즈] GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드 - 3부

> **📌 이 글은 시리즈 연재물입니다**
> - **1부**: 무료 가입 및 시작하기 ✅
> - **2부**: 모델 설정 및 커스텀 세팅 가이드 ✅  
> - **3부**: 실제 활용법 및 고급 사용 팁 (현재 글)

## 🚀 드디어! 실전 활용편

2부에서 완벽한 설정을 마쳤다면, 이제 **진짜 놀라운 기능들**을 체험해보세요!

오늘 보여드릴 예시들을 보시면 **"정말 이게 무료야?"** 하고 놀라실 겁니다.

## 🍞 실전 예시 1: 빵 사진 → JSON 레시피 변환

### 📷 빵 사진 업로드

![빵 이미지](https://i.postimg.cc/nzRMswBW/image.png)

### 💬 사용한 프롬프트
\`\`\`
Given this image:

First, describe the image

Then, detail the recipe to bake this item in JSON format. Include item names and quantities for the recipe
\`\`\`

### 📊 놀라운 결과!

![JSON 레시피 결과](https://i.postimg.cc/gj8mHM14/image.png)

**와! 빵 사진 하나만으로**:
- ✅ 빵 종류 정확히 인식
- ✅ 완벽한 JSON 형식 레시피
- ✅ 재료와 분량까지 상세히!

### 🇰🇷 한국어로도 가능!

![한국어 결과](https://i.postimg.cc/c1zvMH55/image.png)

**팁**: 영어 질문이 퀄리티가 더 높지만, 한국어로 답변해달라고 요청하면 완벽한 한국어 답변을 받을 수 있어요!

## 📝 실전 예시 2: 음식 사진 → 블로그 글 작성

![블로그 글 작성 결과](https://i.postimg.cc/vHFw7wbd/image.png)

**음식 사진 하나로**:
- ✍️ 완전한 블로그 글 작성
- 🎨 매력적인 제목과 구성
- 📖 읽기 좋은 문체로 자동 생성

**이제 음식 블로거가 될 수 있어요!**

## 📰 실전 예시 3: 뉴스 기사 어조 변환

### 📋 요청 내용
**"CNN 기사를 차분하고 친근한 한국어 어조로 요약해줘"**

![뉴스 요약 결과](https://i.postimg.cc/RVVQDNM1/image.png)

**결과**:
- 📰 복잡한 해외 뉴스 → 이해하기 쉬운 한국어
- 🎯 핵심만 골라서 요약
- 💬 친근하고 차분한 어조로 변환

## 🌟 무궁무진한 가능성들

지금까지 본 것은 **빙산의 일각**입니다!

### 🎯 더 많은 활용 예시들
- 📊 **데이터 시각화**: 복잡한 수치를 그래프로
- 🔍 **문서 분석**: PDF 논문이나 보고서 요약
- 🎨 **창작 활동**: 소설, 시나리오, 마케팅 카피
- 📱 **업무 자동화**: 메일 작성, 보고서 정리
- 🌐 **번역**: 자연스러운 다국어 번역
- 🧮 **계산**: 복잡한 수학 문제 해결
- 📈 **분석**: 트렌드 분석, 시장 조사

## 💰 GPT, 클로드에 돈 쓸 이유가 없다!

**솔직히 말하면**:
- 💸 ChatGPT Plus: 월 20달러 (약 2만 8천원)
- 💸 Claude Pro: 월 20달러 (약 2만 8천원)
- 🆓 **Gemini 2.5 Pro: 완전 무료!**

**성능은 어떨까요?**
- 🏆 LMArena 1위 = **세계 최고 성능**
- 🚀 **무료로 최고급 AI 사용**
- 💡 똑같은 기능, 더 나은 성능

## 🤫 왜 일반인에게 잘 알려지지 않았을까?

**이유**:
- 🛠️ **개발자용 사이트**로 시작
- 📢 구글의 **적극적 홍보 부족**
- 🔒 **아는 사람들만** 조용히 사용

**하지만 이제 여러분도 알았으니까요!** 🎉

## 📚 더 잘 활용하고 싶다면?

AI에게 **제대로 질문하는 방법**이 중요합니다!

### 🎯 프롬프트 가이드 추천
더 자세한 프롬프트 작성법은 이 글을 참조하세요:
👉 **https://devcom.kr/main/posts/cmene9y4l0001u8wknikthlc3**

**좋은 프롬프트의 특징**:
- 🎯 **구체적인 요청**
- 📋 **단계별 지시**
- 🎨 **원하는 형식 명시**
- 💡 **예시 제공**

## 🎉 마무리: 이제 여러분 차례!

축하합니다! 이제 **세계 최고 AI를 무료로** 마스터했습니다!

### 🚀 오늘부터 실천해보세요
1. **일상 사진**을 업로드해서 분석받기
2. **업무 문서**를 요약하고 정리하기  
3. **창작 활동**에 AI 파트너 활용하기
4. **학습**에 AI 튜터 역할 시키기

### 💌 여러분의 후기가 궁금해요!
- 어떤 기능이 가장 유용했나요?
- 놀라운 결과물이 나왔다면 댓글로 공유해주세요!
- 다음엔 어떤 활용법이 궁금한지 알려주세요!

---

## 📚 시리즈 완결!

- **1부**: 무료 가입 및 시작하기 ✅
- **2부**: 모델 설정 및 커스텀 세팅 가이드 ✅
- **3부**: 실제 활용법 및 고급 사용 팁 ✅ (현재 글)

**🎊 모든 분들이 세계 최고 AI를 무료로 이용하시길 바랍니다!**

---

💡 **이 시리즈가 도움이 되셨다면**:
- 👍 좋아요와 저장으로 응원해 주세요!
- 🔄 주변 분들께도 공유해 주세요!
- 🔔 팔로우하시면 더 유용한 꿀팁들을 놓치지 않으실 거예요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: 'GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드 - 3부 (완결)',
        slug: 'gemini-2.5-pro-free-guide-part3',
        content,
        excerpt:
          '드디어 실전편! 빵 사진으로 JSON 레시피 만들고, 음식 사진으로 블로그 글 써주고, CNN 기사도 친근하게 요약해주는 놀라운 활용법들. "정말 이게 무료야?" 하실 겁니다. ChatGPT에 돈 쓸 이유가 정말 없네요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle:
          'GEMINI 2.5 Pro 실전 활용법 완벽 가이드 (무료로 이런 게 가능해?)',
        metaDescription:
          '빵 사진→JSON 레시피, 음식 사진→블로그 글, 뉴스→한국어 요약까지! 세계 1위 AI를 무료로 200% 활용하는 실전 가이드 완결편. 이제 유료 AI에 돈 쓸 이유가 없습니다.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: 'Gemini', slug: 'gemini', color: '#059669' },
      { name: '실전', slug: 'practical', color: '#dc2626' },
      { name: '활용법', slug: 'usage', color: '#f59e0b' },
      { name: '완결', slug: 'complete', color: '#059669' },
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

    console.log(`✅ GEMINI 2.5 Pro 가이드 3부 (완결편) 게시글 생성 완료!`)
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
