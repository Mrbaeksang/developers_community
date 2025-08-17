import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy' // 관리자 ID
const ADMIN_ROLE = 'ADMIN' // GlobalRole.ADMIN

// Frontend 카테고리 ID
const FRONTEND_CATEGORY_ID = 'cmdrfyb5f0000u8fsih05gxfk'

// 랜덤 조회수 생성 함수 (Frontend: 100-250)
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createUIStylesPost() {
  const content = `# 🎨 2025 트렌디한 UI 스타일 20가지 완전정복 - 1편

## 🎯 한 줄 요약
**네오 브루탈리즘부터 글래스모피즘까지! AI로 웹사이트 만들 때 꼭 알아야 할 UI 스타일 5가지를 친절하게 소개해드려요.**

![2025년 트렌디한 UI 디자인 스타일들](https://cdn.dribbble.com/userupload/12868664/file/original-c74947f595a439ef558e488f6a935a02.png?resize=1200x853&vertical=center)

## 🤔 이런 고민 있으신가요?

여러분, 혹시 이런 경험 있으신가요?

- **"AI에게 웹사이트 만들어달라고 했는데 뭔가 밋밋해..."** 
- **"트렌디한 디자인을 원하는데 어떻게 설명해야 할지 모르겠어"**
- **"다른 사이트들처럼 세련된 느낌을 내고 싶은데 방법을 모르겠어"**

![UI 디자인 고민하는 모습](https://cdn.prod.website-files.com/6729ec93314d1a742cfeb18b/6730ae1b3fd2ebb2fc067952_672e5d70f45a776946665f52_672e59a468c2367c0b33a7f5_Neobrutalism-ui-design.avif)

정말 공감가는 이야기죠! 특히 코딩을 모르는 상황에서 AI에게 디자인을 요청할 때, 내가 원하는 스타일을 정확히 전달하기가 쉽지 않아요.

## 💡 해결책은 바로 UI 스타일 가이드!

오늘부터 4편에 걸쳐 **2025년 가장 트렌디한 UI 스타일 20가지**를 완전 정복해보겠습니다!

**1편에서는 이 5가지를 다룰 예정이에요:**
1. 🔥 네오 브루탈리즘 (Neo-brutalism)
2. ✨ 글래스모피즘 (Glassmorphism) 
3. 🎈 뉴모피즘 (Neumorphism)
4. ⚪ 미니멀리즘 (Minimalism)
5. 🌈 맥시멀리즘 (Maximalism)

![다양한 UI 디자인 스타일들](https://og.bejamas.com/api/og?slug=neubrutalism-web-design-trend&type=post)

## 🔥 1. 네오 브루탈리즘 (Neo-brutalism)

### ✨ 어떤 스타일인가요?

**네오 브루탈리즘**은 마치 90년대 인터넷을 현대적으로 재해석한 듯한 스타일이에요!

**주요 특징:**
- **두꺼운 검은 테두리**와 강렬한 그림자
- **원색 계열의 강렬한 색상** (핫핑크, 라임그린, 일렉트릭 블루)
- **부드러운 곡선보다는 각진 모양**
- **과감한 타이포그래피**와 큰 글씨

![네오 브루탈리즘 UI 디자인 예시](https://media.nngroup.com/media/articles/opengraph_images/Social-Card-Neobrutalism-opengraph.jpg)

### 🌟 실제 사용 사례

**Brutalist Web Gallery**에서 볼 수 있는 사이트들처럼:
- **굵은 테두리의 버튼**들이 페이지 곳곳에 배치
- **네온 컬러**로 강조된 제목들
- **의도적으로 투박해 보이는** 레이아웃

**이런 느낌을 원한다면:**
> "90년대 인터넷 감성이 느껴지는 레트로 퓨처 스타일로 만들어줘. 굵은 검은 테두리, 네온 컬러, 큰 글씨체를 사용해서"

### 🎯 AI 프롬프트 예시

**네오 브루탈리즘 스타일 요청할 때:**

90년대 인터넷 감성의 네오 브루탈리즘 스타일로 웹사이트를 만들어주세요. 
- 굵은 검은 테두리 (3px 이상)
- 네온 핑크, 라임 그린, 일렉트릭 블루 색상 사용
- 각진 버튼과 박스들
- 큰 볼드체 제목
- 의도적으로 투박한 레이아웃

## ✨ 2. 글래스모피즘 (Glassmorphism)

### ✨ 어떤 스타일인가요?

**글래스모피즘**은 마치 **투명한 유리창**을 통해 보는 듯한 몽환적인 스타일이에요!

**주요 특징:**
- **반투명한 배경**과 **블러 효과**
- **은은한 그라데이션** 배경
- **가는 테두리**와 **부드러운 그림자**
- **깔끔하고 미래적인 느낌**

![글래스모피즘 UI 디자인 실제 예시](https://cdn.dribbble.com/userupload/9822656/file/original-614bfbee2375ac066f4b10b6242d5cc7.jpg?resize=1200x853&vertical=center)

### 🌟 실제 사용 사례

**Apple의 iOS 스타일**이나 **스포티파이 Wrapped**처럼:
- **흐릿한 배경** 위에 떠있는 듯한 카드들
- **투명도 효과**로 뒤의 배경이 살짝 보임
- **부드러운 곡선**과 **미니멀한 디자인**

**Tomorrow.io 날씨 앱**의 경우:
- 배경 이미지 위에 **반투명 카드**들이 떠있는 형태
- **블러 효과**로 깊이감 연출
- **우아하고 세련된** 전체적인 분위기

### 🎯 AI 프롬프트 예시

**글래스모피즘 스타일 요청할 때:**

글래스모피즘 스타일로 웹사이트를 만들어주세요.
- 반투명한 유리 같은 배경 (opacity: 0.1-0.3)
- 부드러운 블러 효과 (backdrop-filter: blur)
- 은은한 그라데이션 배경
- 가는 화이트 테두리 (1px)
- 미래적이고 깔끔한 느낌

## 🎈 3. 뉴모피즘 (Neumorphism)

### ✨ 어떤 스타일인가요?

**뉴모피즘**은 **스크린에서 튀어나올 것 같은** 3D 효과가 특징인 스타일이에요!

**주요 특징:**
- **부드러운 그림자**로 만든 **볼록/오목 효과**
- **단색 배경** (주로 회색 계열)
- **미니멀한 색상 팔레트**
- **버튼이 실제로 눌리는 듯한** 느낌

![뉴모피즘 UI 디자인 예시](https://cdn.sanity.io/images/r115idoc/production/dcd549a4cbed124b2502af0744f6e22874c60487-768x492.png?w=1200&q=80&fit=clip&auto=format)

### 🌟 실제 사용 사례

**모바일 앱 인터페이스**에서 많이 볼 수 있어요:
- **음량 조절 버튼**이 실제로 눌리는 듯한 효과
- **카드들이 표면에서 살짝 떠있는** 느낌
- **부드러운 곡선**과 **그림자**로 입체감 연출

**계산기 앱**이나 **음악 플레이어**에서:
- 버튼을 누르면 **안쪽으로 들어가는** 애니메이션
- **매트한 질감**의 배경
- **절제된 컬러**로 집중도 높임

### 🎯 AI 프롬프트 예시

**뉴모피즘 스타일 요청할 때:**

뉴모피즘 스타일로 웹사이트를 만들어주세요.
- 부드러운 그림자로 3D 효과 연출
- 회색 계열 단색 배경 (#f0f0f3)
- 버튼과 카드가 표면에서 떠있는 느낌
- 미니멀한 색상 (화이트, 그레이 위주)
- 둥근 모서리와 부드러운 곡선

## ⚪ 4. 미니멀리즘 (Minimalism)

### ✨ 어떤 스타일인가요?

**미니멀리즘**은 **"적을수록 좋다"**는 철학을 담은 깔끔한 스타일이에요!

**주요 특징:**
- **화이트 스페이스**를 과감하게 활용
- **단순한 색상 팔레트** (2-3가지 컬러만)
- **깔끔한 타이포그래피**
- **불필요한 장식 요소 제거**

![미니멀한 웹 디자인 예시](https://images.unsplash.com/file-1707885205802-88dd96a21c72image?w=1200&dpr=2&auto=format&fit=crop&q=60)

### 🌟 실제 사용 사례

**Apple 웹사이트**가 대표적인 예시:
- **여백이 충분한** 레이아웃
- **하나의 메시지에 집중**하는 구성
- **심플한 내비게이션**
- **고품질 이미지** 하나로 임팩트

**Google 검색 페이지**처럼:
- **핵심 기능에만 집중**
- **불필요한 요소 완전 제거**
- **직관적인 사용성**

### 🎯 AI 프롬프트 예시

**미니멀리즘 스타일 요청할 때:**

미니멀리즘 스타일로 웹사이트를 만들어주세요.
- 화이트 스페이스를 넉넉하게 활용
- 색상은 최대 3가지만 사용 (화이트, 블랙, 포인트 컬러 1개)
- 깔끔한 산세리프 폰트
- 불필요한 장식 요소 제거
- 심플하고 직관적인 레이아웃

## 🌈 5. 맥시멀리즘 (Maximalism)

### ✨ 어떤 스타일인가요?

**맥시멀리즘**은 **"더 많을수록 좋다"**는 철학의 화려하고 대담한 스타일이에요!

**주요 특징:**
- **다양한 색상**과 **패턴**의 조화
- **여러 요소**가 **동시에 존재**
- **풍부한 텍스처**와 **디테일**
- **개성 넘치는 비주얼**

![맥시멀한 컬러풀 디자인 예시](https://thedigitalmaze.com/app/uploads/2023/11/cash-app.png)

### 🌟 실제 사용 사례

**패션 브랜드 웹사이트**에서 자주 볼 수 있어요:
- **여러 색상**이 **조화롭게 섞인** 배경
- **다양한 폰트**와 **크기**의 텍스트
- **패턴과 텍스처**가 **레이어처럼** 겹쳐진 구성
- **강렬한 비주얼 임팩트**

**아티스트 포트폴리오**나 **창작 분야**에서:
- **개성을 최대한 표현**하는 레이아웃
- **예술적이고 실험적인** 구성
- **시선을 사로잡는** 화려한 색감

### 🎯 AI 프롬프트 예시

**맥시멀리즘 스타일 요청할 때:**

맥시멀리즘 스타일로 웹사이트를 만들어주세요.
- 다양한 색상과 패턴을 풍부하게 사용
- 여러 폰트와 크기를 믹스매치
- 텍스처와 그라데이션을 레이어로 겹치기
- 화려하고 대담한 비주얼
- 개성 넘치는 창의적 레이아웃

## ⚡ 스타일별 비교 정리

### ✅ 어떤 상황에 어떤 스타일을 쓸까요?

| 스타일 | 적합한 용도 | 색상 특징 | 주요 느낌 |
|------|------------|----------|----------|
| **네오 브루탈리즘** | 개성있는 포트폴리오, 창작 사이트 | 네온 컬러, 원색 | 레트로, 개성적 |
| **글래스모피즘** | 프리미엄 브랜드, 테크 기업 | 투명도, 그라데이션 | 미래적, 세련됨 |
| **뉴모피즘** | 앱 인터페이스, 대시보드 | 회색 계열, 단색 | 촉감적, 부드러움 |
| **미니멀리즘** | 기업 사이트, 전문 서비스 | 2-3가지 컬러 | 깔끔함, 전문성 |
| **맥시멀리즘** | 패션, 아트, 엔터테인먼트 | 다채로운 컬러 | 화려함, 개성 |

## 🎯 실제로 이렇게 활용하세요

### Step 1: 내 브랜드에 맞는 스타일 선택
**우리 회사/서비스의 성격**을 먼저 생각해보세요:
- 전문적이고 신뢰할 만한 느낌 → **미니멀리즘**
- 혁신적이고 미래적인 느낌 → **글래스모피즘**
- 개성있고 독특한 느낌 → **네오 브루탈리즘**

### Step 2: AI에게 구체적으로 설명하기
위에서 제공한 **프롬프트 예시**를 그대로 복사해서 사용하세요!

### Step 3: 여러 번 시도해보기
첫 번째 결과가 마음에 안 들면 **조금씩 수정**해서 다시 요청하세요.

![UI 스타일 적용한 웹사이트 예시](https://images.yourstory.com/cs/1/ea667c40-c898-11e9-a36a-eb06ee850db6/websitedesign1566891583958.jpg)

## 💭 마무리 생각

**UI 스타일을 안다는 것은 디자인 언어를 배우는 것**과 같아요.

이제 여러분도 AI에게 **"좀 더 세련되게 만들어줘"**라고 애매하게 말하는 대신, **"글래스모피즘 스타일로 반투명 효과를 줘서 미래적인 느낌으로 만들어줘"**라고 구체적으로 요청할 수 있겠죠?

**다음 편 예고**: 2편에서는 **클레이모피즘, 그라데이션, 멤피스 스타일** 등 더욱 다양한 UI 스타일들을 만나보실 예정이에요!

**여러분은 어떤 스타일이 가장 마음에 드시나요? 댓글로 의견을 들려주세요!** 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️`

  try {
    console.log('🎯 UI 스타일 가이드 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🎨 2025 트렌디한 UI 스타일 20가지 완전정복 - 1편',
        slug: '2025-trendy-ui-styles-part1-complete-guide',
        content,
        excerpt:
          '네오 브루탈리즘부터 글래스모피즘까지! AI로 웹사이트 만들 때 꼭 알아야 할 UI 스타일 5가지를 친절하게 소개합니다. 각 스타일의 특징과 실제 활용법, AI 프롬프트 예시까지 모두 담았어요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: FRONTEND_CATEGORY_ID,
        viewCount: getRandomViewCount(100, 250),
        metaTitle:
          '2025 트렌디한 UI 스타일 5가지 완전 가이드 | 네오브루탈리즘, 글래스모피즘',
        metaDescription:
          'AI로 웹사이트 만들 때 필수! 2025년 트렌디한 UI 스타일 5가지를 실제 예시와 AI 프롬프트와 함께 완전 정복하세요.',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      'UI디자인',
      '웹디자인',
      '네오브루탈리즘',
      '글래스모피즘',
      '뉴모피즘',
      '미니멀리즘',
      '맥시멀리즘',
      '디자인트렌드',
      'AI프롬프트',
      'Frontend',
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
  createUIStylesPost()
    .then(() => {
      console.log('🎉 UI 스타일 가이드 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createUIStylesPost }
