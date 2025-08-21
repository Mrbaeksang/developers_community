import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// AI뉴스 카테고리 ID
const AI_NEWS_CATEGORY_ID = 'cme5a3ysr0002u8wwwmcbgc7z'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎨 알리바바에서 만든 신기한 AI, 말로만 해도 사진이 바뀐다고?

## 💬 간단하게 말하면?

**"배경을 바다로 바꿔줘"라고 말하면 정말로 바뀌는 AI가 나왔어요!**

![Qwen-Image-Edit 공식 발표](https://preview.redd.it/qwen-released-qwen-image-edit-v0-hp1ovqb3htjf1.jpg?width=640&crop=smart&auto=webp&s=8af8900688c25faf8100aeb9e6f197c2774facdc)

## 🤔 이게 뭐야?

**Qwen-Image-Edit**라는 이름의 AI예요. 

중국 알리바바에서 만들었는데, 지금까지 나온 사진 편집 AI 중에서 **가장 똑똑하다**고 해요.

![Qwen-Image-Edit 기능 소개](https://www.marktechpost.com/wp-content/uploads/2025/08/Screenshot-2025-08-18-at-4.05.31-PM.png)

## ✨ 뭐가 특별한데?

### 🗣️ 말로만 하면 끝!

포토샵 같은 복잡한 프로그램 몰라도 돼요.

**이렇게 말하면:**
- "모자 씌워줘" → 모자가 생김
- "배경을 카페로 바꿔줘" → 배경이 카페로 변함  
- "이 사람 지워줘" → 사람이 사라짐

### 🎯 13가지나 되는 기능

**사진 꾸미기:**
- 배경 바꾸기
- 사람이나 물건 지우기  
- 새로운 것 추가하기

**재미있는 기능:**
- 아바타 만들기
- 옷 입혀보기 (가상으로)
- 오래된 사진 깨끗하게 만들기

**실용적인 기능:**
- 상품 사진 만들기
- 포스터 글자 바꾸기

## 🎨 실제 편집 결과 보기

### 1. 텍스트 편집 기능
"QWEN Image Edit is here"로 바꿔달라고 했을 때:

![텍스트 편집 예시](https://i.postimg.cc/tgjMX4bs/60be68de-3690-498c-8af0-41cb3e2aed86.png)

### 2. 창작 기능
고양이가 "this is fun"이라 적힌 종이를 들고 점프하라고 했을 때:

![창작 기능 예시](https://i.postimg.cc/HnR6Fp3s/ab67350a-04d2-4004-b7aa-c22b4fe85152.png)

### 3. 스타일 변환 기능
사진을 만화책 스타일로 바꿔달라고 했을 때:

![스타일 변환 예시](https://i.postimg.cc/hGspc8MY/36a6abf1-c447-459e-b8c2-a0304bba4335.png)

## 💻 어떻게 써보나요?

### 1단계: 웹사이트 들어가기
**Hugging Face**라는 사이트에 가면 바로 써볼 수 있어요.
주소: https://huggingface.co/spaces/Qwen/Qwen-Image-Edit

### 2단계: 사진 올리기
편집하고 싶은 사진을 올려요.

### 3단계: 원하는 것 말하기
"배경을 산으로 바꿔줘" 이런 식으로 써주세요.

### 4단계: 결과 보기
AI가 알아서 편집해줘요!

## 🔥 누가 쓰면 좋을까?

### 📸 일반인
- **인스타그램 사진** 예쁘게 만들기
- **프로필 사진** 배경 바꾸기
- **추억 사진** 깨끗하게 복원하기

### 🛒 쇼핑몰 사장님
- **상품 사진** 배경 깔끔하게 만들기  
- **모델 사진**에 다른 옷 입혀보기
- **광고 이미지** 쉽게 만들기

### 🎨 디자이너
- **포스터** 글자 쉽게 바꾸기
- **캐릭터** 새로 만들기
- **배경** 다양하게 시도해보기

## ⚠️ 아직 아쉬운 점

### 속도가 조금 느려요
복잡한 편집을 하면 기다려야 해요.

### 영어가 더 잘 통해요
한국어보다 영어로 말하면 더 정확해요.

### 아주 세밀한 작업은 어려워요
머리카락 한 올 한 올 수정하는 건 힘들어요.

## 🆓 무료로 쓸 수 있나요?

**네! 지금은 무료로 체험해볼 수 있어요.**

다만 나중에 상업적으로 쓰려면 유료일 수도 있어요.

## 🚀 앞으로는 어떨까?

이런 AI가 계속 발전하면, 앞으로는 **누구나 쉽게** 전문가 수준의 사진을 만들 수 있을 것 같아요.

포토샵 공부 안 해도 되는 시대가 올지도 모르겠네요! 😊

## 🙋‍♀️ 정리하면

- **알리바바**에서 만든 **Qwen-Image-Edit** AI
- **말로만 해도** 사진 편집이 됨
- **13가지 기능** 지원 (배경 바꾸기, 물건 지우기 등)
- **무료로 체험** 가능
- **누구나 쉽게** 사용할 수 있음

궁금하시면 한번 써보세요! 생각보다 재미있어요 🎉

---

*출처: 알리바바 공식 발표, 기술 뉴스 사이트들*`

  try {
    console.log('🎯 Qwen-Image-Edit 일반인용 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🎨 알리바바에서 만든 신기한 AI, 말로만 해도 사진이 바뀐다고?',
        slug: 'qwen-image-edit-easy-guide-for-everyone-2025',
        content,
        excerpt:
          '중국 알리바바에서 만든 Qwen-Image-Edit는 말로만 해도 사진을 편집해주는 신기한 AI예요. "배경을 바다로 바꿔줘"라고 하면 정말로 바뀝니다! 13가지 기능을 무료로 체험해보세요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: AI_NEWS_CATEGORY_ID,
        viewCount: getRandomViewCount(300, 500),
        metaTitle:
          '알리바바 AI로 말만 해도 사진 편집? Qwen-Image-Edit 쉬운 사용법',
        metaDescription:
          '복잡한 포토샵 몰라도 OK! 말로만 해도 사진이 바뀌는 알리바바 AI Qwen-Image-Edit 사용법. 배경 바꾸기, 물건 지우기 등 13가지 기능 무료 체험하기.',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: '이미지편집', slug: 'image-editing', color: '#f59e0b' },
      { name: '초보자가이드', slug: 'beginner-guide', color: '#10a37f' },
      { name: '무료도구', slug: 'free-tool', color: '#06b6d4' },
    ]

    console.log('🏷️ 태그 처리 중...')

    for (const tagData of tags) {
      // 태그가 이미 존재하는지 확인 (name 또는 slug로)
      let tag = await prisma.mainTag.findFirst({
        where: {
          OR: [
            { name: tagData.name },
            {
              slug: tagData.slug.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            },
          ],
        },
      })

      // 태그가 없으면 생성
      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            color: tagData.color,
            postCount: 1,
          },
        })
      } else {
        // 기존 태그의 postCount 증가
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } },
        })
      }

      // 게시글-태그 연결
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`🏷️ 태그 처리 완료: ${tags.map((t) => t.name).join(', ')}`)

    // 사이트 통계 업데이트
    await prisma.siteStats.upsert({
      where: { id: 'main' },
      update: {
        totalPosts: { increment: 1 },
      },
      create: {
        id: 'main',
        totalUsers: 0,
        totalPosts: 1,
        totalComments: 0,
        totalCommunities: 0,
        dailyActiveUsers: 0,
      },
    })

    console.log('📈 사이트 통계 업데이트 완료')
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류 발생:', error)
    throw error
  }
}

// 스크립트 실행
if (require.main === module) {
  createPost()
    .then(() => {
      console.log('🎉 Qwen-Image-Edit 일반인용 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
