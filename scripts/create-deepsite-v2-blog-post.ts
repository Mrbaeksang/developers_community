import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// 바이브코딩 카테고리 ID
const VIBECODING_CATEGORY_ID = 'cme5a5vyt0003u8ww9aoazx9f'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🚀 DeepSite(v2) 완전 정복: 허깅페이스 AI 웹사이트 생성의 모든 것!

## 🎯 한 줄 요약
**코딩 몰라도 OK! DeepSite v2로 텍스트 한 줄이면 프로급 웹사이트가 뚝딱 완성됩니다. v3 0324부터 Kimi K2까지 5가지 AI 모델로 무료 웹사이트 제작의 새 시대가 열렸어요!**

![DeepSite v2 메인 이미지](https://i.ytimg.com/vi/XpbqcgVJyGo/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCYdj-iXWKEStnJsQPXsIEVUEy2Bg)

## 🤔 이런 고민 있으신가요?

코딩을 배우고 싶은데 시간도 없고, 당장 웹사이트는 필요하고... 혹시 이런 상황이신가요?

- **"노코드 툴은 비싸고, 커스터마이징 한계가 너무 많아..."**
- **"ChatGPT로 코드 짜달라고 하면 복사 붙여넣기가 너무 복잡해..."**
- **"기존 웹사이트 디자인을 바꾸고 싶은데 개발자 고용비가 부담돼..."**

이제 **DeepSite v2**로 모든 문제가 해결됩니다! 🔥


## 💡 DeepSite v2란? HuggingFace의 게임체인저

### 🌟 DeepSite v2의 놀라운 정체

**HuggingFace Spaces**에서 운영되는 **완전 무료** AI 웹사이트 생성 도구입니다!

![DeepSite v2로 제작된 다양한 웹사이트 예시](https://i.postimg.cc/Y2WB7mzr/320f0be9-b688-4d06-9c1d-4f3f3d7edd96.png)

**기존 웹사이트 빌더 vs DeepSite v2:**

| 구분 | 기존 도구들 | DeepSite v2 |
|------|------------|-------------|
| **비용** | 월 $10-50 | 완전 무료 |
| **코딩 지식** | 템플릿 제한 | AI가 맞춤 생성 |
| **커스터마이징** | 제한적 | 무제한 |
| **속도** | 몇 시간 | 몇 분 |
| **코드 접근** | 제한적 | 완전 오픈 |

### 🎯 DeepSite v2의 핵심 철학

**"설명만 하면 AI가 다 만들어준다"**

복잡한 드래그 앤 드롭이나 템플릿 선택 없이, 그냥 **"카페 홈페이지 만들어줘"**라고 하면 끝!


## 🤖 5가지 AI 모델 완전 분석

DeepSite v2의 가장 큰 매력은 **다양한 AI 모델 선택권**입니다!

### 1️⃣ DeepSeek Chat V3 0324 - 균형잡힌 올라운더

**✨ 특징:**
- 가장 안정적이고 범용적
- 웹사이트 전반적 구조 설계에 강함
- **무료 사용자 기본 모델**

![V3 0324로 애플 스타일 네이버 재디자인](https://i.postimg.cc/43BFvXvF/daf3f463-8667-43c5-a4c8-5a99b5000676.png)

**💻 활용 예시:**
\`\`\`
프롬프트: "네이버를 애플스타일로 바꿔달라고 지시했을때"
결과: 깔끔한 디자인 + 반응형 레이아웃 + 애니메이션
\`\`\`

**🎯 추천 용도:**
- 개인 포트폴리오
- 기업 소개 페이지  
- 블로그 사이트

### 2️⃣ DeepSeek R1 0528 - 추론 능력의 끝판왕

**🚀 특징:**
- 최신 추론 모델로 복잡한 요청 이해
- AIME 2025에서 87.5% 정확도 달성
- 평균 23K 토큰의 깊은 사고 과정

![R1 0528로 네이버 사이트 재제작 예시](https://i.postimg.cc/053FH5TT/8fb559fc-13e4-4f1a-8452-f6906328e1e7.png)

**💻 활용 예시:**
\`\`\`
프롬프트: "네이버 사이트 만들어줘"
결과: 완전한 쇼핑몰 시스템 생성
\`\`\`

**🎯 추천 용도:**
- 복잡한 기능이 필요한 웹앱
- 전자상거래 사이트
- 대시보드 시스템

### 3️⃣ Qwen3 Coder - 코딩 특화 전문가

**⚡ 특징:**
- 코딩에 특화된 전문 모델
- 클린 코드 생성에 강점
- 개발자 친화적 코드 구조

![Qwen3 Coder로 네오브루탈리즘 스타일 네이버 재디자인](https://i.postimg.cc/Hn5q9fkc/189c70d2-bb6a-4f17-9d34-de0ad623ac16.png)

**💻 활용 예시:**
\`\`\`
프롬프트: "네이버를 네오브루탈리즘으로 바꿔줘"
결과: 최적화된 컴포넌트 구조 + 3D 애니메이션
\`\`\`

**🎯 추천 용도:**
- 개발자 도구 사이트
- 기술 블로그
- 인터랙티브 데모 페이지

### 4️⃣ Kimi K2 - 크리에이티브 디자인 마스터

**🎨 특징:**
- 창의적 디자인 생성에 특화
- 독특한 레이아웃과 컬러 조합
- 시각적 임팩트 극대화

![Kimi K2로 쿠팡 스타일 네이버 재디자인](https://i.postimg.cc/7LtrH3R6/296ea6d6-839d-4648-bf9b-ef89c2a1d335.png)

**💻 활용 예시:**
\`\`\`
프롬프트: "네이버를 쿠팡으로 바꿔줘"
결과: 혁신적 디자인 + 독특한 내비게이션 + 아티스틱 효과
\`\`\`

**🎯 추천 용도:**
- 크리에이티브 포트폴리오
- 아트 갤러리
- 패션/뷰티 브랜드 사이트

### 5️⃣ 추가 모델 옵션들

**🔥 기타 활용 가능한 모델:**
- 다양한 오픈소스 모델들이 지속적으로 추가
- 각 모델별 특화 영역과 강점 존재
- 프로젝트 요구사항에 맞는 최적 모델 선택 가능

## 💻 DeepSite v2 핵심 기능 마스터하기

### 🌟 1. 텍스트-to-웹사이트 생성

**기본 사용법:**
1. **"새 프로젝트"** 클릭
2. **원하는 AI 모델 선택**
3. **텍스트로 요청 작성**
4. **생성 버튼 클릭**
5. **실시간 미리보기 확인**

**🔥 프롬프트 작성 팁:**
\`\`\`
❌ 나쁜 예: "웹사이트 만들어줘"
✅ 좋은 예: "카페 홈페이지, 갈색 톤, 메뉴 소개, 예약 기능, 모던한 느낌으로"
\`\`\`

### 🔄 2. URL 리디자인 기능 - 혁신의 끝판왕

**기존 웹사이트를 AI로 완전히 리뉴얼!**

**사용 방법:**
1. **"Redesign Website" 옵션 선택**
2. **기존 웹사이트 URL 입력**
3. **리디자인 요청사항 작성**
4. **새로운 디자인 즉시 생성**

**실제 활용 사례:**
\`\`\`
입력 URL: https://old-restaurant-site.com
요청: "모던하고 미니멀한 스타일로, 어두운 테마, 음식 사진 강조"
결과: 완전히 새로운 디자인의 레스토랑 사이트
\`\`\`

### 📱 3. 모바일/웹 미리보기 - 반응형 완벽 지원

**실시간 디바이스 테스트:**
- **데스크톱 뷰**: 1920px 기준
- **태블릿 뷰**: 768px 기준  
- **모바일 뷰**: 375px 기준
- **커스텀 해상도**: 직접 설정 가능

**미리보기 활용법:**
1. **우측 상단 디바이스 아이콘** 클릭
2. **원하는 해상도 선택**
3. **실시간으로 반응형 확인**
4. **문제 발견 시 즉시 수정 요청**

### ⚡ 4. Monaco 에디터 - VS Code 경험 그대로

**코드 직접 편집 기능:**
- **신택스 하이라이팅**
- **자동 완성**
- **에러 감지**
- **실시간 저장**

![수정 히스토리 및 버전 관리 기능](https://i.postimg.cc/nhnyqSbr/cb7e03c2-889a-43bf-a62b-9183715e8990.png)

**🔄 버전 관리 기능:**
- **커밋 히스토리**: 모든 수정 내역을 자동 저장
- **이전 버전 복구**: 언제든지 이전 상태로 되돌리기 가능
- **변경 사항 추적**: 무엇이 언제 바뀌었는지 상세 기록

**고급 사용자를 위한 팁:**
\`\`\`javascript
// Monaco 에디터에서 직접 편집 가능
const customComponent = () => {
  // AI가 생성한 코드를 바로 수정
  return <div>맞춤 컴포넌트</div>
}
\`\`\`

## 🎨 실전 프로젝트 만들기 - 단계별 가이드

### 🏪 프로젝트 1: 카페 홈페이지 만들기

**Step 1: 기본 구조 생성**
\`\`\`
프롬프트: "따뜻하고 아늑한 카페 홈페이지를 만들어주세요. 
갈색과 베이지 톤을 사용하고, 헤더에는 로고와 내비게이션, 
메인 섹션에는 히어로 이미지와 소개 글, 
메뉴 소개 섹션, 매장 정보, 푸터를 포함해주세요."
\`\`\`

**Step 2: 디테일 추가**
\`\`\`
추가 요청: "메뉴 섹션에 커피, 디저트, 브런치 카테고리 탭을 추가하고,
각 메뉴에는 가격과 간단한 설명을 포함해주세요."
\`\`\`

**Step 3: 모바일 최적화 확인**
- 모바일 미리보기로 레이아웃 확인
- 텍스트 크기와 버튼 터치 영역 점검
- 필요시 모바일 전용 조정 요청

### 💼 프로젝트 2: 포트폴리오 사이트 제작

**Step 1: Qwen3 Coder 모델 선택**
\`\`\`
프롬프트: "개발자 포트폴리오 사이트를 만들어주세요.
다크 테마, 미니멀 디자인, 프로젝트 갤러리, 
스킬 차트, 연락처 폼, 깃허브 링크 포함"
\`\`\`

**Step 2: 인터랙티브 요소 추가**
\`\`\`
추가 요청: "프로젝트 카드에 호버 효과와 모달 팝업을 추가하고,
스킬 차트는 애니메이션으로 진행률을 표시해주세요."
\`\`\`

### 🛒 프로젝트 3: 기존 사이트 리디자인

**Step 1: URL 입력 및 분석**
\`\`\`
기존 사이트: https://old-fashion-store.com
리디자인 요청: "Z세대 타겟으로 트렌디하고 역동적인 디자인으로 변경,
인스타그램 연동, 영상 배경, 대담한 컬러 사용"
\`\`\`

**Step 2: 브랜드 아이덴티티 강화**
\`\`\`
추가 요청: "브랜드 컬러는 네온 핑크와 블랙 조합,
헤더는 고정식으로 하고, 제품 카테고리는 
드롭다운 대신 전체 화면 메뉴로 변경"
\`\`\`

## ⚔️ 경쟁 도구와의 차별점

### 🥊 DeepSite v2 vs 인기 도구들

| 기능 | DeepSite v2 | Cursor | Bolt.new | Webflow |
|------|------------|--------|----------|---------|
| **가격** | 무료 | $20/월 | $20/월 | $23/월 |
| **AI 모델** | 5가지 선택 | Claude | GPT-4 | X |
| **URL 리디자인** | ✅ | ❌ | ❌ | ❌ |
| **코드 편집** | Monaco | VS Code | 브라우저 | 제한적 |
| **배포** | 원클릭 | 수동 | 수동 | 자동 |
| **러닝커브** | 매우 쉬움 | 중간 | 쉬움 | 어려움 |

### 🎯 DeepSite v2만의 독특한 강점

#### 1. **다중 AI 모델 생태계**
- 프로젝트 성격에 맞는 모델 선택
- 실시간 모델 변경 가능
- 각 모델의 전문성 활용

#### 2. **URL 리디자인 혁신**
- 기존 사이트를 AI로 완전 재설계
- 브랜드 아이덴티티 유지하며 현대화
- 경쟁사에서 찾을 수 없는 독특한 기능

#### 3. **완전 무료 + 오픈소스**
- HuggingFace 커뮤니티 기반
- 사용량 제한 없음
- 투명한 개발 과정

#### 4. **학습 친화적 환경**
- 생성된 코드 완전 공개
- 실시간 편집으로 학습 가능
- 개발자 성장 지원


## 🔮 DeepSite v2의 미래와 한계

### 🚀 앞으로의 발전 방향

**2025년 예정 업데이트:**
- **더 많은 AI 모델 추가**
- **협업 기능 강화** 
- **템플릿 마켓플레이스**
- **플러그인 생태계 구축**

### ⚠️ 현재 한계점과 해결 방안

**📝 알려진 제한사항:**
- **복잡한 백엔드 로직**: 프론트엔드 중심
- **서버 과부하**: 피크 시간 대기 발생
- **일부 고급 기능**: 수동 코딩 필요

**💡 극복 방법:**
- **단계별 구축**: 복잡한 기능은 점진적 추가
- **백업 플랜**: 여러 도구 조합 활용
- **커뮤니티 활용**: HuggingFace 토론 참여

## 💭 마무리: 웹 개발의 새로운 패러다임

**DeepSite v2는 단순한 웹사이트 빌더가 아닙니다.**

이는 **"코딩 민주화"**의 완성체입니다. 5가지 AI 모델을 자유자재로 활용하여 누구나 전문가 수준의 웹사이트를 만들 수 있는 시대가 열렸습니다.

특히 **URL 리디자인 기능**은 기존 웹사이트 개선에 혁명을 일으킬 것입니다. 비싼 개발비 없이도 최신 트렌드를 반영한 웹사이트로 업그레이드할 수 있거든요.

**하지만 기술은 도구일 뿐, 진짜 중요한 것은 여러분의 아이디어와 창의성입니다.** 🎨

DeepSite v2로 어떤 멋진 프로젝트를 만들어보실 건가요? 댓글로 여러분의 제작 계획과 경험을 공유해주세요!

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

### 🔗 유용한 링크 모음

- **DeepSite v2 공식**: https://huggingface.co/spaces/enzostvs/deepsite
- **HuggingFace Spaces**: https://huggingface.co/spaces
- **DeepSeek 모델 정보**: https://huggingface.co/deepseek-ai
- **커뮤니티 갤러리**: https://huggingface.co/spaces/enzostvs/deepsite#community-gallery`

  try {
    console.log('🎯 DeepSite v2 바이브코딩 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🚀 누구나 10초만에 사이트 만들기!! DeepSite(v2) 완전 정복',
        slug: 'deepsite-v2-10-seconds-website-generator-complete-guide',
        content,
        excerpt:
          '코딩 몰라도 OK! DeepSite v2로 텍스트 한 줄이면 프로급 웹사이트가 뚝딱 완성됩니다. v3 0324, R1 0528, Qwen3 Coder, Kimi K2까지 5가지 AI 모델로 무료 웹사이트 제작의 새 시대를 만나보세요!',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: VIBECODING_CATEGORY_ID,
        viewCount: getRandomViewCount(350, 450),
        metaTitle:
          '누구나 10초만에 사이트 만들기 - DeepSite v2 완전 정복 가이드',
        metaDescription:
          'DeepSite v2로 무료 웹사이트 제작하는 완벽 가이드! 5가지 AI 모델(v3 0324, R1 0528, Qwen3 Coder, Kimi K2) 활용법과 URL 리디자인, 모바일 미리보기까지 모든 기능 완전 정복.',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결 (색상 포함)
    const tagData = [
      { name: 'DeepSite', color: '#8b5cf6' }, // 보라색 - AI 도구
      { name: 'HuggingFace', color: '#f59e0b' }, // 황색 - 플랫폼
      { name: 'AI웹사이트생성', color: '#8b5cf6' }, // 보라색 - AI 도구
      { name: 'DeepSeek', color: '#dc2626' }, // 빨간색 - AI 모델
      { name: 'Qwen3', color: '#3b82f6' }, // 파란색 - AI 모델
      { name: 'KimiK2', color: '#059669' }, // 녹색 - AI 모델
      { name: '무료웹사이트', color: '#10a37f' }, // 초록색 - 무료 도구
      { name: 'URL리디자인', color: '#06b6d4' }, // 청록색 - 웹 기능
      { name: '바이브코딩', color: '#06b6d4' }, // 청록색 - 바이브 코딩
      { name: 'NoCode', color: '#f59e0b' }, // 황색 - 노코드
      { name: 'AI도구', color: '#8b5cf6' }, // 보라색 - AI 도구
      { name: '웹개발', color: '#0ea5e9' }, // 하늘색 - 웹개발
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagInfo of tagData) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagInfo.name },
      })

      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagInfo.name,
            slug: tagInfo.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            color: tagInfo.color,
            postCount: 1,
          },
        })
      } else {
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: {
            postCount: { increment: 1 },
            color: tagInfo.color, // 기존 태그도 색상 업데이트
          },
        })
      }

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`🏷️ 태그 처리 완료: ${tagData.map((t) => t.name).join(', ')}`)

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

    console.log('\n📸 사용된 이미지:')
    console.log(
      '1. 메인 이미지 (사용자 제공): https://i.ytimg.com/vi/XpbqcgVJyGo/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCYdj-iXWKEStnJsQPXsIEVUEy2Bg'
    )
    console.log('* 메인 이미지는 사용자가 제공한 YouTube 썸네일 사용')
    console.log('* 불필요한 이미지 링크 제거하여 콘텐츠 집중도 향상')
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류 발생:', error)
    throw error
  }
}

// 스크립트 실행
if (require.main === module) {
  createPost()
    .then(() => {
      console.log('🎉 DeepSite v2 바이브코딩 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
