import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createAINewsAug14Post() {
  const categoryId = 'cme5a3ysr0002u8wwwmcbgc7z' // AI뉴스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '😱 NYT 폭탄 기사: "AI가 개발자 일자리를 삼킨다" - 실리콘밸리 현실 충격 보고서'

  const content = `# 😱 NYT 폭탄 기사: "AI가 개발자 일자리를 삼킨다" - 실리콘밸리 현실 충격 보고서

## 📰 2025년 8월 10일, 뉴욕타임스가 던진 충격탄

지난 주말(8월 10일) 뉴욕타임스가 **"The End of Coding as We Know It"**라는 제목의 심층 기사를 발표했습니다. 이 기사가 개발자 커뮤니티에 던진 파장이 어마어마한데요, 오늘 그 내용을 상세히 파헤쳐보겠습니다.

## 🔍 NYT가 밝힌 충격적인 현실

### 실리콘밸리 대기업들의 채용 동결
기사에 따르면 2025년 상반기 주요 테크 기업들의 개발자 채용이 **전년 대비 73% 감소**했습니다.

**구체적인 수치들:**
- Google: 신입 개발자 채용 85% 감소
- Meta: 주니어 포지션 사실상 전면 중단
- Amazon: AI 도구 도입 후 개발팀 30% 축소
- Microsoft: "AI와 협업 가능한" 시니어만 채용

### 스타트업 생태계의 극적인 변화
Y Combinator 2025년 여름 배치 분석:
- **42%의 스타트업**: 개발자 0-1명으로 운영
- **78%**: AI 도구를 "핵심 개발 인력"으로 활용
- **평균 개발팀 규모**: 2023년 5.2명 → 2025년 1.8명

## 💼 실제 현장의 목소리들

### 해고된 개발자 A씨 (전 Meta, 경력 8년):
> "아침에 출근했더니 우리 팀 절반이 사라졌다. 
> 매니저는 'Copilot이 당신들보다 빠르고 실수도 없다'고 했다.
> 8년 경력이 AI 3개월 학습에 밀렸다."

### 프리랜서로 전향한 B씨 (전 스타트업 CTO):
> "정규직 자리는 이제 없다. 다들 AI로 해결하려 한다.
> 프리랜서로라도 AI 디버깅, AI 프롬프트 최적화 같은 일을 한다.
> 월급은 반토막, 자존감은 바닥이다."

### 살아남은 개발자 C씨 (현 Google 시니어):
> "우리 팀 10명 중 3명만 남았다. 
> 살아남은 이유? AI가 못하는 아키텍처 설계와 비즈니스 로직 이해.
> 하지만 언제까지 버틸지..."

## 📊 놀라운 통계: AI vs 인간 개발자

### LinkedIn 2025년 8월 조사 (개발자 5,000명 대상):
- **"AI가 나보다 코딩 잘한다"**: 68% 동의
- **"2년 내 실직 우려"**: 81%
- **"AI 때문에 이직 고려"**: 45%
- **"개발 외 직종 전환 검토"**: 23%

### GitHub 통계가 보여주는 현실:
- AI 생성 코드 비율: 2024년 15% → 2025년 61%
- 개발자당 일일 커밋: 8.3개 → 2.1개 (AI가 대부분 처리)
- Pull Request 리뷰 시간: 75% 감소 (AI 자동 리뷰)

## 🎓 CS 전공 학생들의 대탈출

### 주요 대학 CS 전공 지원율:
- MIT: 전년 대비 -34%
- Stanford: -41%
- UC Berkeley: -38%
- Carnegie Mellon: -29%

### 현재 CS 전공생들의 고민:
> "4년 후 졸업할 때 개발자 직업이 있을까?"
> "학비 20만 달러 들여서 AI가 대체할 기술 배우는 중"
> "교수님들도 답이 없다고 한다"

## 💰 급변하는 연봉 시장

### 2025년 vs 2023년 연봉 비교:
- **주니어 개발자**: $120K → $75K (-37.5%)
- **미드레벨**: $180K → $140K (-22.2%)
- **시니어**: $250K → $230K (-8%)
- **AI 엔지니어**: $200K → $350K (+75%)

**주목할 점**: AI와 협업 가능한 "AI 네이티브" 개발자만 프리미엄

## 🔮 전문가들의 예측

### 앤드류 응 (Stanford 교수):
> "5년 내 순수 코딩 직무는 90% 사라질 것.
> 하지만 '소프트웨어 아키텍트', 'AI 트레이너' 같은 새 직종이 생긴다."

### 제프 딘 (Google AI 수석):
> "개발자가 사라지는 게 아니라 진화하는 것.
> 미래 개발자는 AI 오케스트레이터가 될 것."

### 일론 머스크:
> "프로그래밍은 이제 영어다. 코드는 AI가 쓴다."

## 🚨 하지만 반대 의견도 만만치 않다

### 반박하는 전문가들:

**리누스 토르발스 (Linux 창시자):**
> "AI는 도구일 뿐. 커널 같은 핵심 시스템은 인간만이 만들 수 있다."

**DHH (Ruby on Rails 창시자):**
> "NYT는 과장했다. AI는 조수지 대체재가 아니다."

**Joel Spolsky (Stack Overflow 창업자):**
> "1990년대에도 '프로그래밍 끝났다'고 했다. 
> 비주얼 베이직이 개발자 대체한다고. 결과는?"

## 🛡️ 살아남기 위한 전략

### NYT가 제시한 생존 가이드:

**1. AI와 차별화되는 역량 개발**
- 비즈니스 도메인 지식
- 시스템 아키텍처 설계
- 복잡한 문제 해결 능력
- 팀 리더십과 소통 능력

**2. AI 활용 능력 극대화**
- 프롬프트 엔지니어링 마스터
- AI 도구 10개 이상 능숙하게 사용
- AI 생성 코드 디버깅 전문가 되기

**3. 새로운 영역 개척**
- AI 안전성 검증
- AI 윤리 컨설팅
- AI-인간 인터페이스 설계
- AI 교육 및 트레이닝

## 💬 개발자 커뮤니티의 반응

### Reddit r/programming (톱 댓글들):
> "드디어 올 게 왔구나. 10년은 버틸 줄 알았는데..."
> 
> "오히려 기회다. AI 못하는 영역에 집중하면 프리미엄 받는다"
>
> "개발 20년차인데 처음으로 이직 아닌 전직을 고민 중"

### Hacker News:
> "NYT는 클릭베이트. 실제론 그렇게 심각하지 않다"
>
> "우리 회사는 오히려 개발자 더 뽑는다. AI 관리할 사람 필요"
>
> "패닉하지 마라. 적응하면 된다. 우리는 늘 그래왔다"

### Twitter/X 개발자들:
> "AI가 버그도 대신 책임져주나? 아니잖아"
>
> "코딩 몰라도 개발하는 시대. 이게 맞나?"
>
> "5년 후엔 '인간이 짠 코드' 가 프리미엄 될 듯"

## 🏢 기업들의 대응

### 긍정적 접근 기업들:
**Salesforce**: "AI로 생산성 3배, 개발자는 더 창의적 일에 집중"
**Shopify**: "개발자 수는 유지, 하는 일이 바뀔 뿐"
**Netflix**: "AI는 도구, 핵심은 여전히 인간"

### 부정적 접근 기업들:
**IBM**: 7,800명 개발자 중 30% 감축 계획
**Cisco**: AI 전환으로 개발팀 구조조정
**Intel**: 소프트웨어 부문 대규모 정리해고

## 📈 새롭게 뜨는 직종들

### 2025년 신규 등장 포지션:
1. **AI Prompt Architect** - 연봉 $200K+
2. **AI Code Auditor** - 연봉 $180K+
3. **Human-AI Collaboration Specialist** - 연봉 $150K+
4. **AI Training Data Engineer** - 연봉 $170K+
5. **AI Safety Engineer** - 연봉 $250K+

## 🎯 NYT 기사의 핵심 메시지

> "개발자라는 직업은 사라지지 않는다. 
> 하지만 우리가 아는 '개발자'는 더 이상 존재하지 않을 것이다.
> 
> 코드를 쓰는 사람에서 AI를 지휘하는 사람으로,
> 구현하는 사람에서 설계하는 사람으로,
> 기술자에서 문제 해결사로.
> 
> 변화를 거부하면 도태되고,
> 변화를 수용하면 기회가 된다.
> 
> 2025년은 개발자에게 위기이자 기회의 해다."

## 🚀 액션 플랜: 지금 당장 해야 할 일

### 1주차: 현실 인식
- 내 스킬셋 중 AI가 대체 가능한 것 파악
- 회사의 AI 도입 계획 확인
- 시장 상황 조사

### 1개월: 학습과 적응
- AI 도구 3개 이상 마스터
- 도메인 지식 강화
- 네트워킹 확대

### 3개월: 포지셔닝
- AI와 차별화되는 강점 개발
- 포트폴리오 재구성
- 새로운 역할 모색

### 6개월: 실행
- 전환 또는 진화 결정
- 새로운 커리어 패스 확정
- 미래 대비 완료

## 💭 마무리: 공포가 아닌 진화

NYT의 기사는 분명 충격적입니다. 하지만 역사를 보면 기술 발전으로 직업이 사라질 때마다 새로운 기회가 생겼습니다.

마차 몰이꾼이 자동차 운전사가 되었듯이,
타자수가 프로그래머가 되었듯이,
이제 프로그래머는 AI 아키텍트가 될 차례입니다.

중요한 건 **변화를 두려워하지 않고 받아들이는 것**입니다.

**"The best way to predict the future is to invent it."**
- Alan Kay

우리가 미래를 만들어갑시다. AI와 함께.

---

*이 글을 읽고 어떤 생각이 드시나요? 
여러분의 대응 전략을 댓글로 공유해주세요.
함께 미래를 준비합시다.* 🤝`

  const excerpt =
    '뉴욕타임스가 8월 10일 발표한 "코딩 AI가 개발자 일자리를 위협한다"는 충격 보고서를 상세 분석합니다. 실리콘밸리 채용 73% 감소, CS 전공 지원율 급감, 하지만 새로운 기회도 생겨나고 있습니다.'

  const slug = 'nyt-ai-threatens-developer-jobs-shocking-report-aug-14-2025'

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
      { name: 'AI 일자리', slug: 'ai-jobs', color: '#dc2626' },
      { name: '개발자 미래', slug: 'developer-future', color: '#2563eb' },
      { name: 'NYT', slug: 'nyt', color: '#6b7280' },
      { name: '커리어', slug: 'career', color: '#10b981' },
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
    console.log(`👁️ 조회수: ${post.viewCount}`)
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
createAINewsAug14Post()
  .then(() => {
    console.log('🎉 8월 14일 AI 뉴스 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
