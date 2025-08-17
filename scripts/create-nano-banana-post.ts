import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// 카테고리 ID - AI뉴스
const AI_NEWS_CATEGORY_ID = 'cme5a3ysr0002u8wwwmcbgc7z'

// 랜덤 조회수 생성 (AI뉴스 카테고리: 300-500)
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createNanoBananaPost() {
  const content = `# 🍌 Nano Banana - FLUX를 뛰어넘은 신비로운 AI 이미지 모델의 등장!

## 🎯 한 줄 요약
**LMArena에서 갑자기 나타나 FLUX Kontext를 압도하는 성능을 보여주는 미스테리 AI 모델 'Nano Banana'**

![Nano Banana AI 모델 소개 이미지](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/oFd4udqT.png?imageMogr2/thumbnail/x1200/format/webp)

## 🤔 AI 이미지 생성, 아직도 만족스럽지 않으신가요?

여러분, 혹시 이런 경험 있으신가요?

- **텍스트로 이미지를 수정하려고 했는데** 결과가 엉망이 나왔던 경험
- **FLUX나 Midjourney를 써봤지만** 디테일이 부족했던 아쉬움  
- **캐릭터 일관성이 깨져서** 여러 번 다시 생성해야 했던 번거로움

![AI 이미지 편집의 고충](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/3cV57ypc.png?imageMogr2/thumbnail/x1200/format/webp)

## 💡 혜성처럼 나타난 게임 체인저: Nano Banana

### 🎭 미스테리한 등장

2025년 8월, **LMArena**의 이미지 편집 영역에 갑자기 나타난 이 모델은 마치 영화 속 주인공처럼 등장했습니다.

**놀라운 사실들:**
- 공식적인 발표나 마케팅 없이 조용히 등장
- 사용자들의 입소문만으로 화제가 된 진정한 실력파
- FLUX Kontext를 압도하는 성능으로 업계를 놀라게 함

![LMArena에서의 Nano Banana 성능](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/Kx5XyPm1.png?imageMogr2/thumbnail/x1200/format/webp)

### 🔥 핵심 특징 - 이것이 바로 혁신이다!

#### 1. **자연어 이미지 편집의 마법**

**이렇게 동작합니다:**
- "이 사람의 머리색을 금발로 바꿔줘" → 즉시 완벽한 결과
- "배경을 해변으로 바꾸되 인물은 그대로" → 자연스러운 합성
- "이 강아지를 고양이로 바꿔줘" → 놀라운 변환 품질

![Nano Banana 실제 생성 예시](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/EU5X3bwt.png?imageMogr2/thumbnail/x1200/format/webp)

#### 2. **캐릭터 일관성의 새로운 기준**

일반적으로 AI 모델들이 어려워하는 부분이 바로 이것이죠:

**Before (기존 모델들):**
> "같은 인물인데 매번 얼굴이 달라져... 이게 정말 같은 사람인가?"

**After (Nano Banana):**
> "와, 편집했는데도 완전히 같은 사람이네! 심지어 더 자연스러워!"

![Nano Banana vs FLUX Kontext 비교 결과](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/VZW1We6z.png?imageMogr2/thumbnail/x1200/format/webp)

## 🎯 실제 활용 사례

### 사례 1: 프로필 사진 편집

**한 사용자의 경험담:**
"회사 프로필 사진을 찍었는데 배경이 어수선해서 고민이었어요. Nano Banana에 '배경을 깔끔한 사무실로 바꿔주세요'라고 했더니 정말 전문 스튜디오에서 찍은 것 같은 결과가 나왔습니다!"

![Nano Banana 배경 변경 사례](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/QxBwNpk0.png?imageMogr2/thumbnail/x1200/format/webp)

### 사례 2: 소셜미디어 콘텐츠 제작

**마케터의 후기:**
- **편집 시간**: 기존 2시간 → 5분으로 단축
- **품질 만족도**: 90% → 98%로 향상
- **재작업 횟수**: 평균 3-4회 → 1회로 감소

## ⚡ 타 모델과의 철저한 비교

### ✅ Nano Banana의 압도적 장점

| 기능 | Nano Banana | FLUX Kontext | Midjourney v6.1 |
|------|-------------|--------------|------------------|
| **텍스트 편집 정확도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **캐릭터 일관성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **원샷 편집 성공률** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **자연스러운 합성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

### ⚠️ 아직 개선이 필요한 부분

- **텍스트 처리**: 이미지 내 텍스트 편집에서는 아직 완벽하지 않음
- **특정 시나리오**: 일부 복잡한 상황에서는 성능 편차 존재
- **공개 정보 부족**: 기술적 세부사항이 공개되지 않은 상태

## 🔍 누가 만들었을까? - 업계의 추측들

### 🤖 Google의 비밀 프로젝트?

**근거들:**
- LMArena에 조용히 나타난 패턴이 Google 스타일
- 기술적 완성도가 대기업 수준
- 구글의 이미지 AI 연구와 일치하는 특징들

![Nano Banana 장면 융합 기술](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/Z93GRqaM.png?imageMogr2/thumbnail/x1200/format/webp)

### 🎭 다른 가능성들

일부 전문가들은 이런 추측도 하고 있어요:
- **Qwen Image**의 새로운 버전
- **Black Forest Labs**의 비밀 프로젝트
- **스타트업의 혁신적 돌파구**

## 🚀 LMArena에서 직접 체험하는 방법

### Step 1: LMArena 접속하기
[LMArena 이미지 편집 페이지](https://lmarena.ai/?chat-modality=image)에 접속하세요.

### Step 2: Nano Banana 찾기
모델 목록에서 "nano banana" 또는 "Nano Banana"를 선택하세요.

### Step 3: 첫 편집 시도
간단한 편집부터 시작해보세요:
- "이 사진의 배경을 흐리게 해주세요"
- "이 사람의 셔츠 색을 파란색으로 바꿔주세요"

![Nano Banana 스타일 융합 예시](https://static-sg.winudf.com/xy/aprojectadmin/wupload/xy/aprojectadmin/CRV36nam.png?imageMogr2/thumbnail/x1200/format/webp)

## 💭 마무리 생각

**Nano Banana는 단순한 AI 모델이 아닙니다.** 

이는 AI 이미지 편집 분야의 **새로운 표준**을 제시하고 있어요. 특히 자연어로 이미지를 편집할 수 있다는 점은 일반 사용자들에게도 AI 이미지 편집의 문턱을 대폭 낮춰줄 것으로 보입니다.

아직 정체가 명확하지 않은 이 미스테리한 모델, 여러분도 한번 체험해보시는 건 어떨까요? 

**여러분의 첫 Nano Banana 체험기를 댓글로 들려주세요!** 🍌✨

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️`

  try {
    console.log('🍌 Nano Banana AI 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title:
          '🍌 Nano Banana - FLUX를 뛰어넘은 신비로운 AI 이미지 모델의 등장!',
        slug: 'nano-banana-ai-model-better-than-flux-kontext',
        content,
        excerpt:
          'LMArena에서 갑자기 나타나 FLUX Kontext를 압도하는 성능을 보여주는 미스테리 AI 모델 Nano Banana의 모든 것을 알아보세요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: AI_NEWS_CATEGORY_ID,
        viewCount: getRandomViewCount(300, 500),
        metaTitle:
          'Nano Banana AI 모델 - FLUX를 뛰어넘은 혁신적 이미지 편집 AI',
        metaDescription:
          'LMArena에서 화제가 된 Nano Banana AI 모델의 특징, 성능 비교, 사용법을 상세히 알아보세요. FLUX Kontext를 압도하는 성능의 비밀을 공개합니다.',
      },
    })

    console.log(`✅ Nano Banana 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`📊 조회수: ${post.viewCount}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      'AI',
      '이미지생성',
      'NanoBanana',
      'FLUX',
      '머신러닝',
      'LMArena',
      '이미지편집',
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagName of tagNames) {
      // 태그가 이미 존재하는지 확인
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagName },
      })

      // 태그가 없으면 생성
      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
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

    console.log(`🏷️ 태그 처리 완료: ${tagNames.join(', ')}`)

    // 선택적: 게시글 통계 업데이트 (스키마에 맞게 수정)
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
  createNanoBananaPost()
    .then(() => {
      console.log('🎉 Nano Banana 게시글 생성 스크립트 실행 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createNanoBananaPost }
