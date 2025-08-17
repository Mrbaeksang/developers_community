import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy' // 관리자 ID
const ADMIN_ROLE = 'ADMIN' // GlobalRole.ADMIN

// Frontend 카테고리 ID
const FRONTEND_CATEGORY_ID = 'cmdrfyb5f0000u8fsih05gxfk'

// 랜덤 조회수 생성 함수 (Frontend: 100-250)
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createUIStylesPart2() {
  const content = `# 🎨 2025 트렌디한 UI 스타일 20가지 완전정복 - 2편

## 🎯 한 줄 요약
**클레이모피즘부터 멤피스 디자인까지! 2025년 웹디자인을 주도할 혁신적인 UI 스타일 5가지를 만나보세요.**

![2025년 혁신적인 UI 디자인 트렌드](https://cdn.dribbble.com/userupload/17752881/file/original-8d6811b417df9df9de407aca346ed7e9.png?resize=1024x768&vertical=center)

## 📚 시리즈 안내

> 📚 이 글은 "2025 트렌디한 UI 스타일 20가지 완전정복" 시리즈의 2편입니다.
> - [1편: 네오브루탈리즘부터 맥시멀리즘까지](/main/posts/xxx)
> - **2편: 클레이모피즘부터 멤피스 디자인까지** (현재 글)
> - 3편: 다크모드부터 3D 디자인까지 (예정)
> - 4편: 모션 UI부터 미래형 인터페이스까지 (예정)

## 🤔 이런 디자인 본 적 있으신가요?

최근 웹사이트를 둘러보다가 이런 생각 해보신 적 있으신가요?

- **"요즘 클레이처럼 부드러운 3D 느낌이 대세던데..."** 
- **"그라데이션이 이렇게 예쁠 수가 있어?"**
- **"화려한 패턴인데 왜 세련되어 보이지?"**

![클레이모피즘 디자인 예시](https://cdn.dribbble.com/userupload/4381057/file/original-668f1cb069aaaca0160f412675adb11a.jpg?resize=1024x768&vertical=center)

바로 이런 스타일들이 2025년 웹 디자인 트렌드를 이끌고 있는 주인공들이에요!

## 💡 2편에서 다룰 UI 스타일

오늘은 **더욱 창의적이고 실험적인** 5가지 스타일을 소개합니다:

1. 🎨 **클레이모피즘 (Claymorphism)** - 3D 클레이 느낌
2. 🌈 **그라데이션 디자인 (Gradient Design)** - 색의 향연
3. 🔺 **멤피스 디자인 (Memphis Design)** - 기하학적 패턴
4. 🌙 **다크 UI (Dark UI)** - 프리미엄 다크모드
5. 🎭 **듀오톤 (Duotone)** - 두 가지 색의 조화

## 🎨 1. 클레이모피즘 (Claymorphism)

### ✨ 어떤 스타일인가요?

**클레이모피즘**은 마치 **부드러운 점토(Clay)**로 만든 듯한 3D 디자인이에요!

**주요 특징:**
- **부풀어 오른 듯한 3D 효과**
- **파스텔톤의 부드러운 색상**
- **큰 둥근 모서리** (border-radius: 30px 이상)
- **내부와 외부 그림자**의 조합

![클레이모피즘 UI 예시](https://cdn.dribbble.com/userupload/35125832/file/original-d08d7209f48e71f32e03a77fcdfecc06.png?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**Notion의 최신 템플릿**이나 **Craft 앱**에서 볼 수 있어요:
- **입체감 있는 카드** 디자인
- **부드러운 파스텔 색상**
- **친근하고 재미있는** 느낌
- **터치하고 싶은** 인터페이스

**AI 아바타 생성 서비스**들이 많이 사용:
- **3D 캐릭터**처럼 보이는 UI 요소
- **플레이풀한 애니메이션**
- **아이들도 좋아하는** 친근한 디자인

![클레이모피즘 실제 적용 예시](https://cdn.dribbble.com/userupload/43111609/file/original-9a3e903878be3f4e744c961464189e34.png?resize=1024x681&vertical=center)

### 🎯 AI 프롬프트 예시

**클레이모피즘 스타일 요청할 때:**

\`\`\`
클레이모피즘 스타일로 웹사이트를 만들어주세요.
- 3D 클레이/점토 느낌의 입체적인 요소
- 파스텔톤 색상 (연한 핑크, 라벤더, 민트)
- 큰 둥근 모서리 (30px 이상)
- 내부 그림자와 외부 그림자 조합
- 부풀어 오른 듯한 버튼과 카드
\`\`\`

## 🌈 2. 그라데이션 디자인 (Gradient Design)

### ✨ 어떤 스타일인가요?

**그라데이션 디자인**은 **색상이 자연스럽게 변화**하는 화려한 스타일이에요!

**주요 특징:**
- **부드러운 색상 전환**
- **메시 그라데이션** (여러 색이 섞인 형태)
- **움직이는 그라데이션** 애니메이션
- **홀로그래픽 효과**

![그라데이션 디자인 예시](https://cdn.dribbble.com/userupload/43235231/file/original-2ee5fd6cb1cfc4f498fe605bc3eed46b.png?resize=1024x576&vertical=center)

### 🌟 실제 사용 사례

**Stripe**나 **Instagram** 브랜딩처럼:
- **화려한 배경** 그라데이션
- **버튼과 아이콘**에 적용된 그라데이션
- **브랜드 아이덴티티** 강화

**Spotify Wrapped** 스타일:
- **다이나믹한 색상 변화**
- **개인화된 컬러 팔레트**
- **감성적이고 트렌디한** 느낌

### 🎯 AI 프롬프트 예시

**그라데이션 디자인 요청할 때:**

\`\`\`
그라데이션 디자인으로 웹사이트를 만들어주세요.
- 메시 그라데이션 배경 (3-4가지 색상 블렌딩)
- 보라-핑크-오렌지 색상 조합
- CSS 애니메이션으로 움직이는 그라데이션
- 홀로그래픽 버튼 효과
- 부드러운 색상 전환
\`\`\`

## 🔺 3. 멤피스 디자인 (Memphis Design)

### ✨ 어떤 스타일인가요?

**멤피스 디자인**은 **80년대 포스트모던** 스타일의 현대적 재해석이에요!

**주요 특징:**
- **기하학적 도형**과 **불규칙한 패턴**
- **대담한 원색** 조합
- **물결, 지그재그** 패턴
- **비대칭적 레이아웃**

![멤피스 디자인 예시](https://cdn.dribbble.com/userupload/23946579/file/original-51dc7e865e13c9f37a110f7eb6e72e67.png?resize=752x564&vertical=center)

### 🌟 실제 사용 사례

**창의적인 에이전시 웹사이트**에서 자주 볼 수 있어요:
- **랜덤한 도형**들이 떠다니는 배경
- **반복되는 기하학 패턴**
- **예측 불가능한** 재미있는 레이아웃

**패션 브랜드**나 **아트 갤러리**:
- **대담하고 실험적인** 디자인
- **레트로와 현대의 조화**
- **시선을 사로잡는** 비주얼

### 🎯 AI 프롬프트 예시

**멤피스 디자인 요청할 때:**

\`\`\`
멤피스 디자인 스타일로 웹사이트를 만들어주세요.
- 삼각형, 원, 지그재그 등 기하학적 도형
- 노랑, 빨강, 파랑 등 원색 사용
- 물결 패턴과 점 패턴 배경
- 비대칭적이고 역동적인 레이아웃
- 80년대 레트로 감성
\`\`\`

## 🌙 4. 다크 UI (Dark UI)

### ✨ 어떤 스타일인가요?

**다크 UI**는 단순한 다크모드를 넘어선 **프리미엄 다크 디자인**이에요!

**주요 특징:**
- **깊은 검정색** 배경 (#000000 - #1a1a1a)
- **네온 액센트** 컬러
- **높은 대비**의 타이포그래피
- **은은한 그림자**와 **광택 효과**

![다크 UI 디자인 예시](https://cdn.dribbble.com/userupload/34819933/file/original-6576d77d9df4f3d381486a9107f3c879.png?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**Linear**나 **Vercel** 대시보드처럼:
- **순수한 검정 배경**
- **네온 그린/블루** 포인트
- **미니멀하면서도 고급스러운** 느낌

**게이밍 플랫폼**이나 **크립토 서비스**:
- **사이버펑크 느낌**의 네온 효과
- **하이테크 감성**
- **몰입감 있는** 사용자 경험

### 🎯 AI 프롬프트 예시

**다크 UI 요청할 때:**

\`\`\`
프리미엄 다크 UI로 웹사이트를 만들어주세요.
- 깊은 검정색 배경 (#0a0a0a)
- 네온 그린(#00ff88) 액센트 컬러
- 높은 대비의 흰색 텍스트
- 은은한 광택 효과와 그림자
- 미니멀하고 고급스러운 레이아웃
\`\`\`

## 🎭 5. 듀오톤 (Duotone)

### ✨ 어떤 스타일인가요?

**듀오톤**은 **두 가지 색상만으로** 만드는 강렬한 비주얼 스타일이에요!

**주요 특징:**
- **2가지 대비되는 색상**
- **이미지에 컬러 오버레이**
- **강렬한 시각적 임팩트**
- **브랜드 컬러 강조**

![듀오톤 디자인 예시](https://cdn.dribbble.com/userupload/16222531/file/original-485236cdf0beb4f5cb8fc64af03e71b0.png?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**Spotify** 초기 광고 캠페인:
- **보라색과 녹색**의 대담한 조합
- **아티스트 사진**에 듀오톤 효과
- **강렬한 브랜드 아이덴티티**

**디자인 포트폴리오**에서:
- **개성있는 컬러 조합**
- **심플하면서도 임팩트 있는** 표현
- **일관된 비주얼 스타일**

### 🎯 AI 프롬프트 예시

**듀오톤 스타일 요청할 때:**

\`\`\`
듀오톤 스타일로 웹사이트를 만들어주세요.
- 파란색(#0066ff)과 오렌지색(#ff6600) 조합
- 이미지에 듀오톤 필터 효과
- 높은 대비의 타이포그래피
- 미니멀한 레이아웃
- 강렬한 시각적 임팩트
\`\`\`

## ⚡ 스타일별 활용 가이드

### ✅ 프로젝트별 추천 스타일

| 스타일 | 적합한 프로젝트 | 분위기 | 난이도 |
|------|------------|----------|---------|
| **클레이모피즘** | 교육 플랫폼, 키즈 서비스 | 친근함, 재미 | ⭐⭐⭐ |
| **그라데이션** | 스타트업, 크리에이티브 | 혁신적, 트렌디 | ⭐⭐ |
| **멤피스** | 아트, 패션, 이벤트 | 독특함, 개성 | ⭐⭐⭐⭐ |
| **다크 UI** | 테크, 게이밍, 프리미엄 | 고급스러움, 전문성 | ⭐⭐ |
| **듀오톤** | 브랜딩, 캠페인, 포트폴리오 | 강렬함, 임팩트 | ⭐ |

## 🎯 실전 활용 팁

### Step 1: 브랜드 성격 파악하기
**우리 서비스는 어떤 느낌을 주고 싶나요?**
- 친근하고 재미있는 → **클레이모피즘**
- 혁신적이고 트렌디한 → **그라데이션**
- 개성있고 독특한 → **멤피스**
- 프리미엄 전문적인 → **다크 UI**
- 강렬하고 임팩트 있는 → **듀오톤**

### Step 2: 조합해서 사용하기
하나의 스타일에 얽매이지 마세요! 
- **다크 UI + 그라데이션** = 프리미엄 테크 느낌
- **클레이모피즘 + 파스텔 듀오톤** = 부드럽고 세련된 느낌

### Step 3: A/B 테스트하기
같은 콘텐츠를 다른 스타일로 만들어서 **반응이 좋은 것** 선택!

![다양한 UI 스타일 조합 예시](https://cdn.dribbble.com/userupload/44521458/file/7c2e5a50ad88f184ff53a01696d300be.jpg?resize=1024x768&vertical=center)

## 💭 마무리 생각

**UI 스타일은 단순한 꾸미기가 아니라 브랜드의 언어입니다.**

이제 여러분도 **"좀 더 트렌디하게"**라는 막연한 요청 대신, **"클레이모피즘으로 3D 느낌 나게"**라고 구체적으로 AI에게 요청할 수 있겠죠?

각 스타일마다 **전달하는 메시지**가 다르니, 여러분의 브랜드에 맞는 스타일을 선택하세요!

## 🎯 다음 편 예고

다음 편에서는 **"다크모드의 진화부터 3D 디자인까지"** 더욱 미래지향적인 UI 스타일들을 만나보실 예정입니다:
- 어댑티브 다크모드
- 3D 일러스트레이션
- 모노크롬 디자인
- 오로라 효과
- 리퀴드 디자인

**여러분이 가장 마음에 드는 스타일은 무엇인가요? 실제로 적용해보신 경험이 있다면 댓글로 공유해주세요!** 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

*이전 편을 못 보셨다면? 👉 [1편: 네오브루탈리즘부터 맥시멀리즘까지](/main/posts/xxx)*`

  try {
    console.log('🎯 UI 스타일 가이드 2편 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🎨 2025 트렌디한 UI 스타일 20가지 완전정복 - 2편',
        slug: '2025-trendy-ui-styles-part2-claymorphism-gradient',
        content,
        excerpt:
          '클레이모피즘부터 멤피스 디자인까지! 2025년 웹디자인을 주도할 혁신적인 UI 스타일 5가지를 실제 예시와 AI 프롬프트와 함께 소개합니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: FRONTEND_CATEGORY_ID,
        viewCount: getRandomViewCount(100, 250),
        metaTitle:
          '2025 UI 트렌드 - 클레이모피즘, 그라데이션, 멤피스 디자인 가이드',
        metaDescription:
          '클레이모피즘, 그라데이션, 멤피스, 다크UI, 듀오톤까지! 2025년 혁신적인 UI 스타일 5가지 완벽 가이드',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      'UI디자인',
      '웹디자인',
      '클레이모피즘',
      '그라데이션',
      '멤피스디자인',
      '다크UI',
      '듀오톤',
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
  createUIStylesPart2()
    .then(() => {
      console.log('🎉 UI 스타일 가이드 2편 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createUIStylesPart2 }
