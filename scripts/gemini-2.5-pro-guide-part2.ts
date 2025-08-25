import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🔧 [시리즈] GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드 - 2부

> **📌 이 글은 시리즈 연재물입니다**
> - **1부**: 무료 가입 및 시작하기 ✅
> - **2부**: 모델 설정 및 커스텀 세팅 가이드 (현재 글)  
> - **3부**: 실제 활용법 및 고급 사용 팁 (다음 글 예정)

## 🎯 이제 진짜 시작! 나만의 AI 환경 만들기

1부에서 무료로 가입하셨나요? 이제 **진짜 중요한 단계**입니다!

대부분 사람들이 **기본 설정 그대로** 사용하다가 "별로네?" 하고 포기합니다. 하지만 **제대로 설정**하면 완전히 다른 AI가 됩니다!

## 🚀 1단계: 모델 설정하기

![모델 설정 버튼](https://i.postimg.cc/BbDFrmc8/image.png)

**우측 상단에 있는 모델 설정 버튼**을 클릭하세요. 이 작은 버튼이 게임체인저입니다!

### 📊 모델 선택하기

![다양한 모델 선택](https://i.postimg.cc/sgFzfwPj/image.png)

여러 모델이 나타나지만, **GEMINI 2.5 Pro**를 선택하세요!

**왜 2.5 Pro를 써야 할까요?**
- 🏆 현재 세계 1위 성능
- 💪 복잡한 추론 능력 뛰어남
- 📚 긴 문맥도 완벽 이해
- 🎨 멀티모달 지원 (텍스트, 이미지, 동영상 등)

## 🌡️ 2단계: Temperature 설정 완벽 가이드

![Temperature 설정](https://i.postimg.cc/sDMSCDKF/image.png)

**Temperature란?** AI의 "창의성 온도"입니다!

### 📏 온도별 추천 용도

| 온도 | 특징 | 추천 용도 |
|------|------|----------|
| **0-0.3** | 매우 정확하고 일관된 답변 | 📊 데이터 분석, 번역, 요약 |
| **0.4-0.7** | 균형잡힌 창의성 | 💼 일반적인 업무, Q&A |
| **0.8-1.2** | 창의적이고 다양한 답변 | ✍️ 글쓰기, 브레인스토밍 |
| **1.3-2.0** | 매우 창의적, 예측 불가능 | 🎨 창작 활동, 실험적 아이디어 |

**💡 추천**: 처음엔 **0.7**로 설정해보세요!

## 🖼️ 3단계: 미디어 해상도 설정

![미디어 해상도 설정](https://i.postimg.cc/dQmNZnKQ/image.png)

**기본값을 Medium으로 변경**하세요!

**왜 Medium이 좋을까요?**
- 🔍 AI가 이미지를 더 정확하게 분석
- 📈 세밀한 부분까지 인식 가능
- ⚡ 속도와 정확성의 완벽한 균형

> 💡 **팁**: 3부에서 이미지 분석 실전 예시를 보여드릴 예정입니다!

## 🧠 4단계: Thinking Budget 설정 (핵심!)

![Thinking Budget 설정](https://i.postimg.cc/j5pFzdsG/image.png)

이건 **정말 중요한** 설정입니다!

### 🎯 설정 방법
1. **Thinking Budget 활성화** ✅
2. **Max Tokens로 설정** 📈

### 💪 왜 이렇게 해야 할까요?
- 🤔 AI가 **더 깊이 생각**합니다
- 🎯 **더 정확한 답변** 제공
- 📊 복잡한 문제도 **체계적으로 해결**
- ⭐ **품질이 확실히** 달라집니다!

## 🛠️ 5단계: Tools 설정 (3개 모두 켜세요!)

![Tools 설정](https://i.postimg.cc/503vbsXj/image.png)

**반드시 3개 모두 활성화**하세요!

### 🔧 각 도구별 기능

#### 1️⃣ **Code Execution** 💻
- AI가 **직접 코드를 실행**하면서 답변
- 계산, 데이터 분석, 프로그래밍 문제 해결
- **실시간으로 결과 확인** 가능

#### 2️⃣ **Grounding with Google Search** 🔍
- **최신 정보를 구글에서 검색**해서 답변
- 실시간 뉴스, 주가, 날씨 등
- **항상 정확하고 최신 정보** 보장

#### 3️⃣ **URL Context** 🌐
- 웹페이지 링크를 주면 **내용을 읽고 분석**
- 논문, 기사, 문서 요약
- **링크만 주면 끝!**

### 🚀 3개 모두 켜야 하는 이유
이 도구들이 **조합**되면 정말 강력해집니다!
- 검색 + 분석 + 실행 = **완벽한 AI 어시스턴트**

## 🎉 설정 완료! 이제 뭐가 다를까요?

축하합니다! 이제 **95%가 모르는 최적 설정**을 완료했습니다.

**일반 설정 vs 최적 설정 차이**:
- ❌ 일반: 그냥그런 답변, 부정확한 정보, 단순한 분석
- ✅ 최적: 깊이 있는 사고, 최신 정보, 실행까지 완료

## 📱 3부 미리보기

**3부**에서는 이 완벽한 설정으로:
- 📊 실제 데이터 분석해보기
- 🖼️ 이미지 완벽 분석 실전
- 💻 코드 작성 및 실행
- 🔍 최신 정보 검색 활용
- 🌐 웹페이지 분석 마스터

**실전 예시**들을 직접 보여드리겠습니다!

---

## 📚 시리즈 연재 안내

- **1부**: 무료 가입 및 시작하기 ✅
- **2부**: 모델 설정 및 커스텀 세팅 가이드 ✅ (현재 글)
- **3부**: 실제 활용법 및 고급 사용 팁 (다음 글 예정)

---

💡 **이 설정으로 AI 성능이 얼마나 달라졌는지 댓글로 알려주세요!**
- 👍 좋아요와 구독으로 응원해 주세요!
- 🔔 알림 설정하시면 3부 실전편도 놓치지 않으실 거예요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: 'GEMINI 2.5 Pro 무료로 쓰는법 완벽 가이드 - 2부',
        slug: 'gemini-2.5-pro-free-guide-part2',
        content,
        excerpt:
          '1부에서 가입은 했는데 "별로네?" 하고 포기하신 분들! 기본 설정 그대로 쓰면 당연히 별로죠. 제대로 설정하면 ChatGPT Plus보다 훨씬 강력해집니다. 95%가 모르는 최적 설정법을 공개합니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle: 'GEMINI 2.5 Pro 최적 설정법 (95%가 모르는 세팅)',
        metaDescription:
          'Temperature부터 Thinking Budget까지, GEMINI 2.5 Pro를 제대로 활용하는 완벽한 설정 가이드. 기본 설정과는 차원이 다른 성능을 경험해보세요.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: 'Gemini', slug: 'gemini', color: '#059669' },
      { name: '설정', slug: 'settings', color: '#06b6d4' },
      { name: '가이드', slug: 'guide', color: '#7c3aed' },
      { name: '최적화', slug: 'optimization', color: '#f59e0b' },
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

    console.log(`✅ GEMINI 2.5 Pro 가이드 2부 게시글 생성 완료!`)
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
