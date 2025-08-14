import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

// 랜덤 조회수 생성 함수
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createAIUXUIDesignPost() {
  const categoryId = 'cme5a3ysr0002u8wwwmcbgc7z' // AI뉴스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  const title = 'AI로 UX/UI 디자인하기: 디자이너가 알아야 할 모든 것'
  const content = `# AI로 UX/UI 디자인하기: 디자이너가 알아야 할 모든 것

## 🎨 AI가 디자인을 대체한다고요? 아니에요!

"AI가 디자이너를 대체할까요?" 

이 질문, 정말 많이 받아요. 결론부터 말씀드리면 **절대 아닙니다**. 오히려 AI는 디자이너의 가장 강력한 동료가 되고 있어요. 

반복적인 작업은 AI가, 창의적인 결정은 인간이. 이게 2025년 디자인의 현실입니다.

## 🚀 5분 만에 프로토타입 완성? 진짜 가능해요!

### Figma AI가 바꾼 일상

김 디자이너의 하루를 볼까요?

**오전 9시**: 클라이언트가 "쇼핑몰 앱 메인 화면 3가지 안 보여주세요"라고 요청
**오전 9시 5분**: Figma AI에게 "이커머스 앱 메인 화면 와이어프레임 생성해줘" 입력
**오전 9시 10분**: 3가지 다른 스타일의 프로토타입 완성

예전 같았으면 반나절은 걸렸을 작업이 단 5분 만에 끝났어요. 물론 이건 시작일 뿐이죠. 여기서부터 인간 디자이너의 진짜 작업이 시작됩니다.

### 실제로 어떻게 쓰나요?

**1. 레이어 정리 자동화**
"모든 텍스트 레이어 이름 바꿔줘" → 1초 만에 완료

**2. 더미 콘텐츠 채우기**
"실제 같은 상품 정보 20개 넣어줘" → 즉시 생성

**3. 다국어 버전 제작**
"이 디자인 일본어 버전으로 만들어줘" → 자동 번역 + 레이아웃 조정

**4. 반응형 디자인**
"모바일, 태블릿, 데스크톱 버전 만들어줘" → 자동 리사이징

놀라운 건, 이 모든 게 **디자인 일관성을 유지하면서** 진행된다는 거예요!

## 🎭 Midjourney로 무드보드 만들기

### 클라이언트와의 소통이 달라졌어요

"따뜻하고 모던한 느낌으로 해주세요"

이런 추상적인 요청, 디자이너라면 다들 겪어보셨죠? 이제는 이렇게 해결해요.

**Step 1**: Midjourney에 입력
"warm modern interior design app UI, minimalist, soft colors, cozy atmosphere --v 6 --ar 16:9"

**Step 2**: 10초 후 4가지 컨셉 이미지 생성

**Step 3**: 클라이언트에게 보여주기
"이 중에 어떤 느낌이 마음에 드시나요?"

**Step 4**: 구체적인 방향 확정!

### 실제 프로젝트 사례

박 UI 디자이너는 최근 명상 앱을 디자인했어요.

- **기존 방식**: 핀터레스트에서 2시간 동안 레퍼런스 수집
- **AI 활용**: Midjourney로 15분 만에 독특한 무드보드 20개 생성

"특히 '우주와 명상의 조화'같은 독특한 컨셉은 AI 없이는 상상도 못했을 거예요" - 박 디자이너

## 🤖 프로토타이핑의 혁명: Framer AI

### 코드 몰라도 인터랙션 구현 가능!

Framer AI의 마법 같은 기능들:

**"이 버튼 누르면 팝업 뜨게 해줘"**
→ 자동으로 인터랙션 추가

**"스크롤하면 헤더가 작아지게 해줘"**
→ 스크롤 애니메이션 자동 생성

**"로그인 플로우 만들어줘"**
→ 전체 유저 플로우 자동 구성

### 개발자와의 협업이 쉬워졌어요

예전엔 "이거 구현 가능한가요?"를 계속 물어봤죠. 이제는 Framer AI로 만든 프로토타입을 그대로 개발자에게 전달하면 돼요. 

실제 작동하는 프로토타입이니까 오해의 소지가 없어요!

## 🎨 DALL-E 3로 커스텀 일러스트 제작

### 스톡 이미지는 이제 그만!

"우리 앱에만 있는 독특한 일러스트가 필요해요"

이런 요구, 예산 때문에 포기했던 적 많으시죠? 이제는 DALL-E 3로 해결해요.

**실제 활용 예시:**

1. **온보딩 화면 일러스트**
   - "친근한 3D 캐릭터가 스마트폰을 들고 웃는 모습"
   - 스타일, 색상, 표정까지 세밀하게 조정 가능

2. **에러 페이지 일러스트**
   - "귀여운 로봇이 고장 나서 당황하는 모습"
   - 브랜드 컬러에 맞춰 자동 생성

3. **빈 상태(Empty State) 디자인**
   - "텅 빈 책장과 호기심 많은 고양이"
   - 앱의 톤앤매너에 완벽 매칭

### 일관성 유지하는 꿀팁

같은 스타일로 여러 일러스트를 만들려면?

1. 첫 번째 이미지 생성 후 **seed 번호** 저장
2. 다음 이미지 생성 시 같은 seed 사용
3. 스타일 가이드 문구를 템플릿으로 저장

예시 템플릿:
"flat design illustration, pastel colors, rounded shapes, minimal shadows, friendly characters, [구체적인 장면 설명]"

## 📊 사용자 리서치도 AI가 도와줘요

### 대규모 피드백 분석이 10분이면 끝!

1000개의 앱스토어 리뷰를 어떻게 분석하세요? AI를 쓰면 간단해요.

**ChatGPT 활용법:**

1. 리뷰 데이터 복사 → ChatGPT에 붙여넣기
2. "주요 불만사항 TOP 10 정리해줘" 
3. "개선 우선순위 매겨줘"
4. "사용자 페르소나 3개 도출해줘"

**실제 결과물 예시:**
- 😤 불만 1위: 로딩 속도 (312명 언급)
- 😕 불만 2위: 복잡한 네비게이션 (287명)
- 🤔 불만 3위: 글자 크기 조절 불가 (201명)

이런 인사이트를 바탕으로 디자인 개선 방향을 잡을 수 있어요!

## ♿ 접근성도 AI가 체크해줘요

### 모두를 위한 디자인, 이제 쉬워졌어요

**AI가 자동으로 체크하는 것들:**

✅ **색상 대비**: "이 조합은 시각 장애인이 구분하기 어려워요"
✅ **텍스트 가독성**: "이 폰트 크기는 노안이 있는 분들께 작아요"
✅ **터치 영역**: "버튼이 너무 작아서 터치하기 어려워요"
✅ **스크린 리더 호환성**: "이 이미지에 설명이 없어요"

### 실제 개선 사례

A 쇼핑 앱은 AI 접근성 검사 후:
- 구매 전환율 15% 상승
- 60대 이상 사용자 35% 증가
- 앱스토어 평점 4.2 → 4.7 상승

"접근성이 곧 사용성이더라고요!" - A사 UX 팀장

## 🛠️ 디자이너를 위한 AI 도구 총정리

### 필수 도구 5개

1. **Figma AI** (월 $12~)
   - 디자인 작업 자동화
   - 프로토타이핑
   - 협업 기능

2. **Midjourney** (월 $10~)
   - 무드보드 제작
   - 컨셉 이미지 생성
   - 스타일 탐색

3. **DALL-E 3** (ChatGPT Plus 포함, 월 $20)
   - 커스텀 일러스트
   - 아이콘 생성
   - UI 요소 제작

4. **Framer AI** (월 $20~)
   - 인터랙티브 프로토타입
   - 애니메이션 제작
   - 개발 핸드오프

5. **Claude/ChatGPT** (월 $20)
   - UX 라이팅
   - 사용자 리서치 분석
   - 디자인 시스템 문서화

### 선택 도구 (필요에 따라)

- **Descript**: 사용자 인터뷰 영상 자동 전사
- **Opus Clip**: 유저 테스트 영상 하이라이트 추출
- **HeyGen**: 프로토타입 설명 영상 제작
- **RunwayML**: 고급 이미지 편집

## 💡 실전 워크플로우

### 실제 프로젝트를 AI와 함께 진행하기

**Day 1: 리서치 & 아이데이션**
- ChatGPT로 경쟁사 분석
- Midjourney로 무드보드 제작
- AI로 사용자 페르소나 생성

**Day 2-3: 와이어프레이밍**
- Figma AI로 빠른 레이아웃 구성
- 여러 버전 빠르게 테스트
- AI로 더미 콘텐츠 채우기

**Day 4-5: 비주얼 디자인**
- DALL-E로 커스텀 일러스트 제작
- Figma AI로 컴포넌트 생성
- 색상 팔레트 자동 제안 받기

**Day 6-7: 프로토타이핑**
- Framer AI로 인터랙션 추가
- 사용자 플로우 자동 생성
- 반응형 디자인 자동 조정

**Day 8: 테스트 & 개선**
- AI로 접근성 체크
- 피드백 자동 분석
- 개선사항 우선순위 정리

## ⚠️ AI 사용 시 주의사항

### 함정에 빠지지 마세요!

**❌ AI 결과물을 그대로 사용**
- 항상 인간의 검토가 필요해요
- 브랜드 아이덴티티 체크는 필수

**❌ 저작권 문제 무시**
- AI 생성 이미지도 유사도 체크 필요
- 상업적 사용 라이선스 확인

**❌ 사용자 맥락 무시**
- AI는 비즈니스 목표를 모릅니다
- 타겟 사용자의 니즈는 인간이 파악

**❌ 과도한 의존**
- 창의성은 여전히 인간의 영역
- AI는 도구일 뿐, 주인은 우리

## 🚀 미래를 준비하는 디자이너가 되려면

### 2025년 이후를 대비하는 법

1. **AI와 협업하는 법 배우기**
   - 프롬프트 엔지니어링 스킬
   - AI 도구 활용 능력
   - AI 결과물 큐레이션 능력

2. **인간만의 강점 키우기**
   - 공감 능력
   - 스토리텔링
   - 비즈니스 이해도
   - 윤리적 판단력

3. **지속적인 학습**
   - 새로운 AI 도구 탐색
   - 커뮤니티 활동
   - 사례 연구 공유

## 💭 마무리: AI는 동료, 경쟁자가 아니에요

2025년의 성공하는 디자이너는 AI를 두려워하지 않아요. 오히려 적극적으로 활용하죠.

**AI가 하는 일**: 반복 작업, 대량 생산, 빠른 프로토타이핑
**인간이 하는 일**: 전략 수립, 감성 터치, 최종 결정

우리는 이제 하루 8시간 중 6시간을 창의적인 일에 쓸 수 있게 됐어요. 이게 진짜 혁명 아닐까요?

여러분도 오늘부터 AI와 함께 디자인해보세요. 처음엔 어색하겠지만, 일주일만 써보면 없던 시절로 돌아갈 수 없을 거예요! 🎨✨

---

*AI 디자인 도구 활용 경험이 있으신가요? 댓글로 공유해주세요! 함께 배워가요!*`

  const excerpt =
    '2025년 UX/UI 디자이너를 위한 AI 활용 완벽 가이드. Figma AI, Midjourney, DALL-E 3, Framer AI 등 최신 도구들을 활용한 실전 디자인 워크플로우와 성공 사례를 소개합니다.'

  const slug = '2025-ai-ux-ui-design-complete-guide'

  try {
    const post = await prisma.mainPost.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        status: PostStatus.PUBLISHED,
        isPinned: false,
        authorId,
        authorRole: GlobalRole.ADMIN,
        categoryId,
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null,
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: getRandomViewCount(300, 500),
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결
    const tags = [
      { name: 'UX디자인', slug: 'ux-design', color: '#ec4899' },
      { name: 'UI디자인', slug: 'ui-design', color: '#8b5cf6' },
      { name: 'Figma', slug: 'figma', color: '#f97316' },
      { name: 'Midjourney', slug: 'midjourney', color: '#06b6d4' },
      { name: 'AI도구', slug: 'ai-tools', color: '#10b981' },
    ]

    for (const tagData of tags) {
      const tag = await prisma.mainTag.upsert({
        where: { slug: tagData.slug },
        update: { postCount: { increment: 1 } },
        create: {
          ...tagData,
          postCount: 1,
        },
      })

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`✅ "${title}" 게시글이 성공적으로 생성되었습니다!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`🏷️ ${tags.length}개의 태그가 연결되었습니다.`)

    return post
  } catch (error) {
    console.error('게시글 생성 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
createAIUXUIDesignPost()
  .then(() => {
    console.log('🎉 AI로 UX/UI 디자인하기 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
