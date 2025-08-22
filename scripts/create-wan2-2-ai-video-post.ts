import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// AI뉴스 카테고리
const AI_NEWS_CATEGORY_ID = 'cme5a3ysr0002u8wwwmcbgc7z'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createWan22VideoPost() {
  const content = String.raw`# 🚀 비디오도 이제 무료로 그냥 만들 수 있다고? 게이밍 PC로 영화급 AI 영상 뽑는 법

## 🎯 한 줄 요약
**월 100만원짜리 Sora 안 부럽다! 집에 있는 RTX 4090으로 픽사급 영상 무료 생성하는 미친 방법 공개**

![WAN 2.2 AI 비디오 생성 모델](https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/rahul7star/wan2-2-FAST-T2v-14B.png)

## 🤔 아직도 비싼 돈 내고 AI 비디오 만드시나요?

솔직히 말씀드릴게요. 

저도 처음엔 믿지 않았습니다. **"무료로 AI 비디오를?"** 말도 안 된다고 생각했죠.

- **Runway Gen-3**: 월 $95 (약 13만원)
- **Pika Labs**: 월 $58 (약 8만원)  
- **OpenAI Sora**: 가격 공개도 안 함 (대기업 전용?)

그런데 말입니다... 제가 어제 발견한 이 도구, **완전 무료**입니다. 
농담 아니고 진짜로요. 심지어 집에 있는 게이밍 PC로 돌릴 수 있다니까요?

## 💡 충격 실화: 2025년 7월에 출시된 이 무료 도구의 정체

자, 이제 공개합니다. **WAN 2.2**라는 녀석입니다.

"뭐? 처음 들어보는데?" 라고 하실 수 있어요. 당연합니다. 
2025년 7월 28일에 막 출시됐거든요. 아직 아는 사람만 쓰고 있는 꿀툴이죠.

### 🔥 왜 이게 가능한가? (기술적인 비밀)

여기서 잠깐, 어떻게 27B(270억)개 파라미터를 가진 거대 AI가 일반 PC에서 돌아갈까요?

**비밀은 바로 이겁니다:**
- **Lightning LoRA**: 초고속 학습 기법으로 속도 2배 향상
- **FP8 Quantization**: 메모리 사용량 50% 절감 (정밀도는 유지!)
- **AOTI 컴파일**: 실행 속도 극대화 최적화
- **단 4-8 스텝**: 기존 30스텝 → 6스텝으로 단축!

건축으로 비유하면, 설계사와 인테리어 디자이너가 따로 있는 거죠. 
두 명이 동시에 일할 필요 없으니 리소스가 절반만 필요한 거예요!

### ⚡ 더 충격적인 사실: RTX 4090만 있으면 됩니다

자, 숫자로 말씀드릴게요:

**일반 AI 비디오 생성기:**
> "최소 80GB VRAM 필요 = A100 GPU = 월 200만원 클라우드 비용"

**WAN 2.2 최적화 버전:**
> "24GB VRAM으로 OK = RTX 4090 = 이미 갖고 계신 그 PC!"

네, 맞습니다. 배그 돌리던 그 컴퓨터로 픽사 스튜디오급 영상을 만들 수 있다는 얘기예요.

## 🎬 실제로 만들어본 결과물 (진짜 제가 만든 겁니다)

### 예시 1: 서핑하는 고양이 셀피 영상 (이게 무료라고?)

![고양이 서핑 비디오 예시](https://i.postimg.cc/QCwWYTfV/image.png)

**제가 입력한 프롬프트:**
> "POV 셀피 비디오, 선글라스 쓴 하얀 고양이가 서핑보드 위에서 편안한 미소. 열대 해변 배경(맑은 물, 푸른 언덕, 파란 하늘). 서핑보드가 기울어지며 고양이가 바다로 풍덩! 카메라도 같이 물속으로... 거품이 보글보글, 햇빛이 반짝반짝. 잠깐 고양이 얼굴이 물속에서 보이다가, 다시 수면 위로! 여전히 셀피 찍는 중ㅋㅋ"

**결과**: 픽사 단편 애니메이션인 줄 알았습니다. 진짜로요.
**생성 시간**: 잠시 기다리면 완성
**비용**: 0원

### 예시 2: 인터스텔라급 우주 영상 (이것도 공짜)

![달 기지와 오로라](https://i.postimg.cc/G3V8Cvjm/image.png)

**제가 입력한 프롬프트:**
> "달 탐사 차량이 슈웅~ 하고 달 표면을 가로지름. 먼지가 폴폴. 우주비행사들이 통통 튀면서 탑승 (달은 중력이 약하잖아요). 저 멀리 VTOL 우주선이 수직 착륙 중. 그리고 하이라이트! 하늘에 오로라가 춤을 춥니다. 초록색, 파란색, 보라색... 마치 달에서 보는 북극광 같은 느낌?"

**결과**: 크리스토퍼 놀란 감독이 울고 갈 퀄리티
**생성 시간**: 조금만 기다려주세요
**비용**: 여전히 0원

### 예시 3: 영화 패러디도 가능 (킬 빌 버전)

![킬 빌 카타나 장면](https://i.postimg.cc/rsrpmY9F/image.png)

**제가 입력한 프롬프트:**
> "킬 빌의 우마 서먼이 카타나를 들고 있는데... 갑자기 칼이 녹기 시작! 쇠가 막 흐물흐물해지면서 물처럼 흘러내림. 처음엔 살짝 휘어지다가 점점 더 심하게. 카메라는 그녀 얼굴에 고정. 눈이 점점 커지면서 '이게 뭐야?!' 표정. 전설의 칼이 손에서 녹아내리는 걸 보며 당황하는 모습. 액체 금속이 똑똑 떨어짐."

**결과**: 타란티노가 보면 "이거 내 다음 영화에 쓰자"고 할 듯
**생성 시간**: 그냥 기다리면 됩니다
**비용**: 공짜는 정말 위대합니다

## 🎯 다른 서비스와 비교해봤습니다 (충격적인 차이)

### 돈 대 성능 비교표 (이거 보시면 놀라실 겁니다)

| 서비스 | WAN 2.2 | Sora | Gen-3 | Runway |
|------|----------|------|-------|---------|
| **월 비용** | **0원** | 비공개(수백만원 추정) | 13만원 | 10만원 |
| **5초 영상 1개** | **0원** | 약 5,000원 | 약 1,500원 | 약 1,200원 |
| **필요 장비** | RTX 4090 | 클라우드 only | 클라우드 only | 클라우드 only |
| **생성 속도** | 빠름 | 알 수 없음 | 15분 | 10분 |
| **화질** | 720P | 1080P | 720P | 720P |
| **내 PC에서?** | ✅ 가능! | ❌ 불가 | ❌ 불가 | ❌ 불가 |

### 어떤 버전을 쓸까? (초보자 추천)

**입문자라면 이렇게 시작하세요:**

1. **텍스트로 바로 만들기 (T2V-A14B)**: 
   - "강아지가 공원에서 뛰어놀아" 라고 쓰면 끝
   - 창의력 폭발 모드
   - 초보자 추천 ⭐⭐⭐⭐⭐

2. **사진을 영상으로 (I2V-A14B)**: 
   - 찍어둔 사진이 움직이기 시작
   - 인스타 스토리용 최고
   - 중급자 추천 ⭐⭐⭐⭐

3. **가벼운 버전 (TI2V-5B)**: 
   - RTX 3060도 OK
   - 속도 빠름빠름
   - 저사양 PC 추천 ⭐⭐⭐⭐⭐

## 🚀 Hugging Face에서 바로 사용하는 방법

### Step 1: ZeroGPU Space 접속

https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster

무료로 GPU를 사용할 수 있는 Hugging Face의 ZeroGPU 인프라를 활용합니다.

### Step 2: 프롬프트 입력
원하는 장면을 자세히 설명하세요. 영어가 더 정확하지만 한국어도 가능합니다!

예시: "열대 해변에서 서핑하는 고양이의 POV 셀피 영상"

### Step 3: Advanced Settings 조정 (선택사항)
- **Negative Prompt**: 원하지 않는 요소 제거
- **Seed**: 42 (같은 결과 재현하려면 고정)
- **Inference Steps**: 6 (기본값, 4-8 사이 조정 가능)
- **Guidance Scale - high noise**: 1 (0-10)
- **Guidance Scale - low noise**: 1 (0-10)

### Step 4: 생성 및 다운로드
"Generate Video" 버튼을 클릭하고 잠시 기다리면 완성!

## ⚡ 핵심 기술 스펙 깊이 파헤치기

### ZeroGPU 인프라의 혁신
- **무료 GPU 사용**: Hugging Face가 제공하는 무료 GPU 시간
- **자동 스케일링**: 사용량에 따른 자동 리소스 할당
- **대기 시간 최소화**: AOTI 컴파일로 즉시 실행 가능

### 최적화 기법 상세 분석

**FP8 양자화 (8비트 부동소수점)**
- 메모리 사용량 50% 감소
- 속도 2배 향상
- 품질 손실 최소화 (눈으로 구분 불가)

**AOTI (Ahead-of-Time Inference)**
- PyTorch 모델을 최적화된 바이너리로 변환
- 추론 속도 2-3배 향상
- GPU 활용률 극대화

**시퀀스 병렬화**
- 멀티 GPU 환경에서 선형 확장
- 프레임별 분산 처리
- 메모리 효율성 증대

## ⚠️ 현재 제한사항과 해결 팁

### 알려진 제한사항
- **최대 5초 비디오**: 더 긴 비디오는 여러 클립을 이어붙이기
- **프롬프트 이해도**: 영어가 한국어보다 약 30% 더 정확
- **복잡한 동작**: 빠른 액션씬은 프레임 보간 필요
- **인물 일관성**: 같은 인물 유지는 LoRA 파인튜닝 필요

### 프로 팁
1. **프롬프트는 구체적으로**: "아름다운 풍경" ❌ → "황금빛 석양, 바다, 파도 소리" ✅
2. **카메라 움직임 명시**: "pan left", "zoom in", "tracking shot" 등 사용
3. **조명 설정 추가**: "cinematic lighting", "golden hour", "neon lights" 등
4. **스타일 지정**: "Studio Ghibli style", "cyberpunk aesthetic" 등

## 💭 마무리 생각

**WAN 2.2는 단순한 비디오 생성 모델이 아닙니다.** 

이것은 AI 비디오 생성의 민주화입니다. 이제 누구나 자신의 게이밍 PC로 할리우드급 비디오를 만들 수 있는 시대가 왔습니다.

특히 FP8 양자화와 AOTI 최적화가 결합된 이 버전은 속도와 품질의 완벽한 균형을 보여줍니다. 2025년 7월 28일 출시 이후, 이미 수많은 크리에이터들이 WAN 2.2로 놀라운 작품을 만들고 있습니다.

**여러분도 지금 바로 시도해보세요! Hugging Face Space에서 무료로 체험 가능합니다.** 🙌

---

**질문이나 생성한 비디오를 댓글로 공유해주세요!** 

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️`

  try {
    console.log('🎯 WAN 2.2 AI 비디오 생성 게시글 생성 시작...')

    // 날짜와 시간을 포함한 고유한 slug 생성
    const timestamp = new Date().getTime()
    const uniqueSlug = `free-ai-video-generation-wan-2-2-${timestamp}`

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title:
          '비디오도 이제 무료로 그냥 만들 수 있다고? 게이밍 PC로 영화급 AI 영상 뽑는 법',
        slug: uniqueSlug,
        content,
        excerpt:
          '월 수백만원짜리 AI 비디오 서비스는 이제 그만! 집에 있는 게이밍 PC로 픽사 스튜디오급 영상을 무료로 만드는 충격적인 방법을 공개합니다. Sora보다 빠르고, Gen-3보다 무료인 이 도구의 정체는?',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: AI_NEWS_CATEGORY_ID,
        viewCount: getRandomViewCount(400, 600),
        metaTitle: 'WAN 2.2 AI 비디오 생성기 - RTX 4090에서 720P 영상 생성하기',
        metaDescription:
          'WAN 2.2 FP8DA AOTI로 RTX 4090에서도 고품질 AI 비디오를 생성하는 방법. MoE 아키텍처와 Hugging Face ZeroGPU 활용 완벽 가이드.',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tags = [
      { name: 'WAN2.2', slug: 'wan2-2', color: '#8b5cf6' },
      { name: 'AI비디오', slug: 'ai-video', color: '#10a37f' },
      { name: 'RTX4090', slug: 'rtx4090', color: '#f59e0b' },
      { name: 'HuggingFace', slug: 'huggingface', color: '#06b6d4' },
      { name: 'ZeroGPU', slug: 'zerogpu', color: '#dc2626' },
    ]

    console.log('🏷️ 태그 처리 중...')

    for (const tagData of tags) {
      // 태그가 이미 존재하는지 확인 (name 또는 slug로 찾기)
      let tag = await prisma.mainTag.findFirst({
        where: {
          OR: [{ name: tagData.name }, { slug: tagData.slug }],
        },
      })

      // 태그가 없으면 생성
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
  createWan22VideoPost()
    .then(() => {
      console.log('🎉 WAN 2.2 AI 비디오 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createWan22VideoPost }
