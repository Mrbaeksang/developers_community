import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy' // 관리자 ID
const ADMIN_ROLE = 'ADMIN' // GlobalRole.ADMIN

// Frontend 카테고리 ID
const FRONTEND_CATEGORY_ID = 'cmdrfyb5f0000u8fsih05gxfk'

// 랜덤 조회수 생성 함수 (Frontend: 100-250)
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createUIStylesPart3() {
  const content = `# 🎨 2025 트렌디한 UI 스타일 20가지 완전정복 - 3편

## 🎯 한 줄 요약
**3D 디자인부터 모노크롬까지! 2025년 웹을 더욱 입체적이고 다이나믹하게 만들어줄 UI 스타일 5가지를 소개합니다.**

![메인 이미지 - 3D와 모션이 살아있는 UI](https://cdn.dribbble.com/userupload/40466634/file/original-9e31f5e2576c7b47f23683dea8a5c541.png?resize=752x564&vertical=center)

## 📚 시리즈 안내

> 📚 이 글은 "2025 트렌디한 UI 스타일 20가지 완전정복" 시리즈의 3편입니다.
> - [1편: 네오브루탈리즘부터 맥시멀리즘까지](/main/posts/xxx)
> - [2편: 클레이모피즘부터 멤피스 디자인까지](/main/posts/xxx)
> - **3편: 3D 디자인부터 모노크롬까지** (현재 글)
> - 4편: 미래형 인터페이스와 AI 기반 디자인 (예정)

## 🤔 이런 디자인 본 적 있으신가요?

최근 웹사이트들이 점점 더 입체적이고 생동감 있게 변하고 있다고 느끼신 적 있으신가요?

- **"웹사이트인데 마치 게임 같은 느낌이야!"** 
- **"스크롤할 때마다 뭔가 움직이는게 신기해"**
- **"80년대 레트로 감성이 왜 이렇게 세련되게 느껴지지?"**

![혁신적인 UI 디자인 예시](https://cdn.dribbble.com/userupload/17683902/file/original-edc84174d8f8ee685105d4a1591ea768.png?resize=1024x768&vertical=center)

이런 스타일들이 바로 2025년 웹 디자인의 새로운 트렌드를 이끌고 있습니다!

## 💡 3편에서 다룰 UI 스타일

오늘은 **더욱 입체적이고 다이나믹한** 5가지 스타일을 소개합니다:

1. 🎮 **3D 디자인 (3D Design)** - 입체적인 경험
2. 🎬 **모션 UI (Motion UI)** - 살아 움직이는 인터페이스
3. 🌆 **레트로웨이브 (Retrowave)** - 80년대 사이버펑크
4. 🌌 **오로라/홀로그래픽 (Aurora/Holographic)** - 무지갯빛 환상
5. ⚫ **모노크롬 (Monochrome)** - 흑백의 미학

## 🎮 1. 3D 디자인 (3D Design)

### ✨ 어떤 스타일인가요?

**3D 디자인**은 평면적인 웹을 **입체적인 공간**으로 만드는 혁신적인 스타일이에요!

**주요 특징:**
- **실제 같은 3D 오브젝트**
- **깊이감 있는 레이어링**
- **인터랙티브한 3D 요소**
- **공간감을 활용한 네비게이션**

![3D 웹 디자인 예시 1](https://cdn.dribbble.com/userupload/12935607/file/original-0f001204ebba3a582d48d0f29c3778b9.jpg?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**Spline을 활용한 웹사이트**들처럼:
- **마우스 움직임에 반응**하는 3D 오브젝트
- **360도 회전 가능한** 제품 뷰어
- **깊이감 있는 스크롤** 애니메이션
- **공간을 이동하는 듯한** 페이지 전환

**Apple의 제품 소개 페이지**:
- **3D로 렌더링된 제품** 모델
- **드래그로 회전** 가능한 인터페이스
- **줌인/줌아웃** 기능
- **실제처럼 보이는 재질** 표현

![3D 인터랙티브 디자인 예시 2](https://cdn.dribbble.com/userupload/18013325/file/original-2ee2710634bcd0a35b983801798ed20d.png?resize=1024x768&vertical=center)

### 🎯 AI 프롬프트 예시

**3D 디자인 요청할 때:**

\`\`\`
3D 디자인 스타일로 웹사이트를 만들어주세요.
- Three.js나 Spline 같은 3D 라이브러리 활용
- 입체적인 오브젝트와 깊이감
- 마우스 인터랙션에 반응하는 3D 요소
- Z축을 활용한 레이어 구성
- 부드러운 3D 애니메이션
\`\`\`

## 🎬 2. 모션 UI (Motion UI)

### ✨ 어떤 스타일인가요?

**모션 UI**는 **움직임으로 스토리를 전달**하는 다이나믹한 스타일이에요!

**주요 특징:**
- **마이크로 인터랙션**
- **스크롤 트리거 애니메이션**
- **페이지 전환 효과**
- **로딩 애니메이션**

![모션 UI 예시 1](https://cdn.dribbble.com/userupload/42569536/file/original-01cbb973c101fe19385ae1448acfa4a1.png?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**Stripe의 홈페이지**처럼:
- **스크롤하면 나타나는** 요소들
- **호버 시 부드러운 변화**
- **타이핑 애니메이션**
- **플로팅 요소들**

**Awwwards 수상작들**:
- **스토리텔링 스크롤**
- **패럴랙스 효과**
- **모핑 애니메이션**
- **시퀀스 애니메이션**

![인터랙티브 모션 예시 2](https://cdn.dribbble.com/userupload/43163252/file/original-d3db64d8cc4d0232aabf4618a40c88e9.png?resize=1024x768&vertical=center)

### 🎯 AI 프롬프트 예시

**모션 UI 요청할 때:**

\`\`\`
모션 UI 스타일로 웹사이트를 만들어주세요.
- 스크롤 트리거 애니메이션 (AOS, GSAP)
- 마이크로 인터랙션 (호버, 클릭 효과)
- 부드러운 페이지 전환
- 로티 애니메이션 활용
- 60fps 부드러운 움직임
\`\`\`

## 🌆 3. 레트로웨이브 (Retrowave/Synthwave)

### ✨ 어떤 스타일인가요?

**레트로웨이브**는 **80년대 사이버펑크 감성**을 현대적으로 재해석한 스타일이에요!

**주요 특징:**
- **네온 핑크와 시안 블루**
- **그리드 패턴과 기하학적 도형**
- **글리치 효과**
- **복고풍 타이포그래피**

![레트로웨이브 디자인 예시 1](https://cdn.dribbble.com/userupload/11495026/file/original-d962e20a595a607d9ebce3395c82939b.jpg?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**사이버펑크 2077 프로모션 사이트**:
- **네온사인 같은 텍스트**
- **홀로그램 효과**
- **VHS 노이즈 효과**
- **레트로 퓨처 감성**

**음악 스트리밍 서비스**:
- **비트에 맞춘 비주얼라이저**
- **네온 그라데이션**
- **80년대 아케이드 스타일**
- **신스웨이브 색감**

![사이버펑크 UI 예시 2](https://cdn.dribbble.com/userupload/5490536/file/original-eaa695b867a86164bb7b4c10125df271.png?resize=1024x768&vertical=center)

### 🎯 AI 프롬프트 예시

**레트로웨이브 스타일 요청할 때:**

\`\`\`
레트로웨이브/신스웨이브 스타일로 웹사이트를 만들어주세요.
- 네온 핑크(#ff00ff)와 시안(#00ffff) 색상
- 80년대 그리드 패턴 배경
- 글리치와 스캔라인 효과
- 레트로 폰트 (Orbitron, Audiowide)
- VHS 테이프 노이즈 효과
\`\`\`

## 🌌 4. 오로라/홀로그래픽 (Aurora/Holographic)

### ✨ 어떤 스타일인가요?

**오로라/홀로그래픽**은 **무지갯빛 광채**로 환상적인 분위기를 만드는 스타일이에요!

**주요 특징:**
- **무지갯빛 그라데이션**
- **홀로그램 효과**
- **광택과 반사**
- **유동적인 색상 변화**

![오로라 그라데이션 예시 1](https://cdn.dribbble.com/userupload/44075236/file/original-19b2c139f2af36e00b28771ec3bc8476.jpg?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**GitHub Universe 컨퍼런스 사이트**:
- **오로라 같은 배경**
- **홀로그래픽 카드**
- **프리즘 효과**
- **움직이는 그라데이션**

**NFT 마켓플레이스**:
- **홀로그램 텍스처**
- **레인보우 반사 효과**
- **유리 프리즘 느낌**
- **다이아몬드 광채**

![홀로그래픽 효과 예시 2](https://cdn.dribbble.com/userupload/15571799/file/original-dad2041f73a311dadc2d7d6cf9e882bb.png?resize=1024x768&vertical=center)

### 🎯 AI 프롬프트 예시

**오로라/홀로그래픽 요청할 때:**

\`\`\`
오로라/홀로그래픽 스타일로 웹사이트를 만들어주세요.
- 무지개 그라데이션 (hsl 애니메이션)
- 홀로그램 호일 효과
- CSS blend-mode로 광택 표현
- 유동적인 색상 변화
- 프리즘 빛 반사 효과
\`\`\`

## ⚫ 5. 모노크롬 (Monochrome)

### ✨ 어떤 스타일인가요?

**모노크롬**은 **흑백의 대비**만으로 강렬한 임팩트를 주는 스타일이에요!

**주요 특징:**
- **흑백 또는 단색 팔레트**
- **강한 명암 대비**
- **타이포그래피 중심**
- **미니멀한 구성**

![모노크롬 디자인 예시 1](https://cdn.dribbble.com/userupload/29934738/file/original-30dbe2f2dae24e858bd29a81d68a324e.jpg?resize=1024x768&vertical=center)

### 🌟 실제 사용 사례

**패션 브랜드 웹사이트**:
- **흑백 사진과 텍스트**
- **대비를 활용한 강조**
- **깔끔한 레이아웃**
- **세련된 분위기**

**아트 갤러리/포트폴리오**:
- **작품에 집중**하게 하는 배경
- **극적인 명암 대비**
- **우아한 타이포그래피**
- **시대를 초월한 클래식함**

![흑백 인터페이스 예시 2](https://cdn.dribbble.com/userupload/36926651/file/original-06200a2b63a713b00c88e4e4cb19213c.png?resize=752x564&vertical=center)

### 🎯 AI 프롬프트 예시

**모노크롬 스타일 요청할 때:**

\`\`\`
모노크롬 스타일로 웹사이트를 만들어주세요.
- 흑백 또는 단일 색상 스케일
- 강한 명암 대비 (contrast ratio 7:1 이상)
- 볼드한 타이포그래피
- 여백을 활용한 구성
- 그레이스케일 이미지 필터
\`\`\`

## ⚡ 스타일별 활용 가이드

### ✅ 프로젝트별 추천 스타일

| 스타일 | 적합한 프로젝트 | 분위기 | 난이도 |
|------|------------|----------|---------|
| **3D 디자인** | 제품 소개, 게임, 테크 | 혁신적, 미래적 | ⭐⭐⭐⭐ |
| **모션 UI** | 스토리텔링, 브랜딩 | 다이나믹, 인터랙티브 | ⭐⭐⭐ |
| **레트로웨이브** | 음악, 게임, 엔터테인먼트 | 노스탤지아, 펑키 | ⭐⭐ |
| **오로라** | 프리미엄, 럭셔리, NFT | 환상적, 고급스러움 | ⭐⭐⭐ |
| **모노크롬** | 패션, 아트, 미니멀 브랜드 | 세련됨, 클래식 | ⭐ |

## 🎯 실전 활용 팁

### Step 1: 목적에 맞는 스타일 선택
**프로젝트의 목표를 먼저 정의하세요:**
- 사용자 참여를 높이고 싶다 → **모션 UI**
- 제품을 입체적으로 보여주고 싶다 → **3D 디자인**
- 독특한 브랜드 아이덴티티 → **레트로웨이브**
- 프리미엄 느낌 → **오로라/홀로그래픽**
- 콘텐츠에 집중 → **모노크롬**

### Step 2: 성능 고려하기
**무거운 효과는 적절히 사용:**
- 3D 디자인 → WebGL 최적화 필수
- 모션 UI → GPU 가속 활용
- 홀로그래픽 → CSS만으로 구현 가능

### Step 3: 접근성 체크
**모든 사용자를 위한 디자인:**
- 모션 → prefers-reduced-motion 대응
- 모노크롬 → 충분한 대비 확보
- 3D → 2D 폴백 옵션 제공

![다양한 스타일 조합 예시](https://cdn.dribbble.com/userupload/43796714/file/original-7deb553987d4ac5c98ad870b4b72f698.png?resize=1024x768&vertical=center)

## 💭 마무리 생각

**UI 스타일은 단순한 장식이 아니라 사용자 경험의 핵심입니다.**

3편에서 소개한 스타일들은 특히 **인터랙티브하고 몰입감 있는 경험**을 만들고 싶을 때 활용하면 좋아요.

이제 여러분도 **"좀 더 역동적으로"**라는 막연한 요청 대신, **"3D 요소와 모션 UI를 결합해서 인터랙티브한 경험을 만들어줘"**라고 구체적으로 AI에게 요청할 수 있겠죠?

## 🎯 다음 편 예고

마지막 4편에서는 **"미래형 인터페이스와 AI 기반 디자인"**을 다룰 예정입니다:
- 뉴브루탈리즘 2.0
- AI 생성 디자인
- 바이오모픽 디자인
- 리퀴드 디자인
- 어댑티브 UI

**여러분이 가장 마음에 드는 스타일은 무엇인가요? 실제로 적용해보고 싶은 스타일이 있다면 댓글로 알려주세요!** 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

*이전 편을 못 보셨다면?*
*👉 [1편: 네오브루탈리즘부터 맥시멀리즘까지](/main/posts/xxx)*
*👉 [2편: 클레이모피즘부터 멤피스 디자인까지](/main/posts/xxx)*`

  try {
    console.log('🎯 UI 스타일 가이드 3편 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🎨 2025 트렌디한 UI 스타일 20가지 완전정복 - 3편',
        slug: '2025-trendy-ui-styles-part3-3d-motion-retro',
        content,
        excerpt:
          '3D 디자인부터 모노크롬까지! 2025년 웹을 더욱 입체적이고 다이나믹하게 만들어줄 UI 스타일 5가지를 실제 예시와 AI 프롬프트와 함께 소개합니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: FRONTEND_CATEGORY_ID,
        viewCount: getRandomViewCount(100, 250),
        metaTitle: '2025 UI 트렌드 - 3D 디자인, 모션 UI, 레트로웨이브 가이드',
        metaDescription:
          '3D 디자인, 모션 UI, 레트로웨이브, 오로라, 모노크롬까지! 2025년 입체적인 UI 스타일 5가지 완벽 가이드',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      'UI디자인',
      '웹디자인',
      '3D디자인',
      '모션UI',
      '레트로웨이브',
      '오로라',
      '홀로그래픽',
      '모노크롬',
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
  createUIStylesPart3()
    .then(() => {
      console.log('🎉 UI 스타일 가이드 3편 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createUIStylesPart3 }
