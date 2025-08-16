import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 필수 상수 (POST_ENHANCED.md에서 복사)
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// 카테고리 정보
const AI_NEWS_CATEGORY = {
  id: 'cme5a3ysr0002u8wwwmcbgc7z',
  viewRange: { min: 300, max: 500 },
}

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

// 게시글 콘텐츠
const content = `# 📸 구글이 AI로 당신을 프로 사진작가로 만들어준다고? Pixel 10의 충격적인 신기능!

## 🎯 한 줄 요약
8월 20일 공개 예정인 Google Pixel 10의 AI 카메라 코치가 실시간으로 사진 촬영을 도와주는 개인 사진 선생님이 된다!

![Google Pixel 10 AI 카메라](https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&h=600)

## 🤔 이런 고민 있으신가요?

- "사진은 찍고 싶은데 구도를 어떻게 잡아야 할지 모르겠어요"
- "조명이 맘에 안 드는데 어떻게 조절해야 할지..."
- "인스타 감성 사진 찍고 싶은데 너무 어려워요!"

여러분, 혹시 여행가서 멋진 풍경을 눈앞에 두고도 제대로 담지 못해 아쉬웠던 적 있으신가요?

이제 그런 걱정은 끝! Google이 당신의 주머니 속에 AI 사진 선생님을 넣어드립니다.

![AI가 도와주는 사진 촬영](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600)

## 💡 Pixel 10의 혁신적인 AI 카메라 코치 기능

### 1. 실시간 촬영 가이드 with Gemini AI

**이렇게 동작합니다:**
- 카메라를 켜면 AI가 현재 장면을 분석
- "조금 더 왼쪽으로 이동하세요" 같은 실시간 조언
- 최적의 구도와 각도를 화면에 표시

![실시간 가이드 데모](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600)

### 2. 대화형 사진 편집 - 말로 하는 포토샵!

일반적으로 우리가 사진 편집을 할 때는 이랬죠:

**Before (기존 방식):**
> "포토샵 켜고... 도구 선택하고... 유튜브 보면서 따라하고... 2시간 후 포기"

**After (Pixel 10 방식):**
> "하늘을 더 파랗게 만들어줘" → 3초 만에 완성!

![대화형 편집 비교](https://picsum.photos/1200/600?random=pixel10edit)

## 🎯 실제 활용 사례

### 사례 1: 여행 사진의 혁명

김모씨(32세, 직장인)의 경험담:
"파리 에펠탑 앞에서 사진 찍는데, AI가 '황금 시간대까지 10분 남았어요. 저녁 노을과 함께 찍으면 더 멋질 거예요'라고 알려주더라고요. 진짜 인생샷 건졌어요!"

![여행 사진 예시](https://picsum.photos/id/318/1200/600)

### 사례 2: 음식 사진 전문가 되기

이모씨(28세, 푸드 블로거):
"AI가 '접시를 45도 각도로 찍으면 더 맛있어 보여요'라고 조언해줘서 팔로워가 2배로 늘었어요!"

## ⚡ 장단점 정리

### ✅ 장점
- **즉각적인 피드백**: 전문가 조언을 실시간으로
- **학습 곡선 제로**: 복잡한 기능 익힐 필요 없음  
- **무료 AI 코치**: 추가 비용 없이 제공

### ⚠️ 주의사항
- 8월 20일 공개 예정 (아직 며칠 남음)
- Tensor G5 칩셋 필요 (구형 기기 지원 안 됨)
- 인터넷 연결 시 더 정확한 가이드

## 🚀 다른 놀라운 기능들

### Pixel 10 시리즈 스펙
- **프로세서**: Tensor G5 (Gemini 최적화)
- **디스플레이**: 6.3인치 (Pro XL은 6.8인치)
- **카메라**: 48MP 울트라와이드 + 5배 광학 줌
- **충전**: Qi2 무선 충전 지원

### 함께 공개될 제품들
- Pixel Watch 4 (더 긴 배터리 수명)
- Pixel Buds 2a (ANC 탑재)

![Pixel 10 전체 라인업](https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&h=600)

## 💭 마무리 생각

스마트폰 카메라가 이제 단순한 촬영 도구를 넘어 개인 사진 코치로 진화하고 있습니다.

AI가 "이렇게 찍으면 더 예뻐요"라고 속삭여주는 시대, 
이제 누구나 프로 사진작가가 될 수 있는 시대가 열렸습니다.

여러분은 어떻게 생각하시나요? 
AI 카메라 코치가 정말 필요한 기능일까요, 아니면 과한 기술일까요?
댓글로 의견을 들려주세요! 🙌

---

### 📅 놓치지 마세요!
**Made by Google 2025 이벤트**
- 일시: 8월 20일 오전 10시 (PT)
- 한국 시간: 8월 21일 새벽 2시
- 시청: YouTube 라이브 스트리밍

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️`

async function createPixel10NewsPost() {
  try {
    // 태그 생성 또는 찾기
    const tagNames = ['AI', 'Google', 'Pixel10', '카메라', 'Gemini']
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        return await prisma.mainTag.upsert({
          where: { name },
          update: { postCount: { increment: 1 } },
          create: {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            postCount: 1,
          },
        })
      })
    )

    // 포스트 생성
    const post = await prisma.mainPost.create({
      data: {
        title:
          '📸 구글이 AI로 당신을 프로 사진작가로 만들어준다고? Pixel 10의 충격적인 신기능!',
        slug: `google-pixel-10-ai-camera-coach-${Date.now()}`,
        content,
        excerpt:
          '8월 20일 공개되는 Google Pixel 10의 AI 카메라 코치 기능이 실시간으로 사진 촬영을 도와주는 개인 사진 선생님이 됩니다. Gemini AI가 구도, 조명, 각도를 실시간으로 조언해주는 혁신적인 기능을 소개합니다.',
        categoryId: AI_NEWS_CATEGORY.id,
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        status: 'PUBLISHED',
        isPinned: false,
        viewCount: getRandomViewCount(
          AI_NEWS_CATEGORY.viewRange.min,
          AI_NEWS_CATEGORY.viewRange.max
        ),
        likeCount: 0,
        commentCount: 0,
        tags: {
          create: tags.map((tag) => ({
            tag: { connect: { id: tag.id } },
          })),
        },
      },
    })

    console.log('✅ 포스트 생성 완료!')
    console.log(`📌 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)
    console.log(`📊 조회수: ${post.viewCount}`)
    console.log(`🏷️ 태그: ${tagNames.join(', ')}`)

    return post
  } catch (error) {
    console.error('❌ 포스트 생성 실패:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 실행
if (require.main === module) {
  createPixel10NewsPost()
    .then(() => {
      console.log(
        '\n🎉 Google Pixel 10 AI 뉴스 포스트가 성공적으로 생성되었습니다!'
      )
      process.exit(0)
    })
    .catch((error) => {
      console.error('실행 중 오류 발생:', error)
      process.exit(1)
    })
}

export { createPixel10NewsPost }
