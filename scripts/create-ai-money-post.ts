import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

// 랜덤 조회수 생성 함수
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createAIMoneyPost() {
  const categoryId = 'cme5a3ysr0002u8wwwmcbgc7z' // AI뉴스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  const title = '2025년 AI로 월 1000만원 버는 현실적인 방법 7가지'
  const content = `# 2025년 AI로 월 1000만원 버는 현실적인 방법 7가지

## 🎯 AI로 돈 버는 시대, 정말 가능할까요?

"AI로 돈 번다"는 말, 많이 들어보셨죠? 막상 시작하려니 어디서부터 해야 할지 막막하신가요? 

저도 처음엔 그랬습니다. 하지만 2025년 현재, 평범한 직장인부터 대학생까지 AI를 활용해 부수입을 만들고 있어요. 심지어 풀타임 수입을 넘어서는 분들도 늘어나고 있죠.

오늘은 허황된 꿈이 아닌, **지금 당장 시작할 수 있는 현실적인 방법 7가지**를 소개해드릴게요.

## 💰 1. AI 자동화 서비스로 기업 컨설팅하기 (월 500-2000만원)

### 이게 뭐예요?
쉽게 말해 "기업의 반복 업무를 AI로 자동화해주는 것"입니다. 엑셀 작업, 이메일 답변, 보고서 작성 등 직원들이 매일 반복하는 지루한 일들을 AI가 대신하도록 만들어주는 거죠.

### 실제 사례
김모 씨(32세)는 n8n이라는 도구를 배워서 중소기업들의 업무를 자동화해주고 있어요. 한 프로젝트당 300-500만원을 받고, 월 3-4개 프로젝트를 진행한다고 합니다.

### 어떻게 시작하나요?
1. **n8n, Zapier, Make** 같은 자동화 도구 하나를 선택해서 배우세요
2. 주변 소상공인이나 중소기업에 무료로 간단한 자동화를 만들어주며 경험을 쌓으세요
3. 포트폴리오가 쌓이면 유료 서비스로 전환하세요

💡 **꿀팁**: "매일 2시간씩 걸리던 업무를 10분으로 줄여드립니다"라고 설명하면 기업들이 관심을 가져요!

## 📝 2. AI 콘텐츠 에이전시 운영 (월 300-1000만원)

### 이게 뭐예요?
블로그, SNS, 유튜브 대본 등을 AI로 빠르게 만들어서 판매하는 거예요. 혼자서도 충분히 시작할 수 있습니다.

### 진짜 돈이 될까요?
박모 씨(28세)는 ChatGPT와 Jasper AI를 활용해 월 50개의 블로그 포스트를 작성해주고 있어요. 건당 20만원씩 받아 월 1000만원의 수익을 올리고 있죠.

### 시작하는 법
1. ChatGPT Plus(월 $20) 또는 Claude Pro 구독
2. 크몽, 숨고 같은 플랫폼에 "AI 활용 콘텐츠 제작" 서비스 등록
3. 초반엔 저렴한 가격으로 시작해 리뷰를 쌓기
4. 실력이 늘면 직접 고객사를 확보

⚠️ **주의사항**: AI가 만든 걸 그대로 주면 안 돼요! 반드시 인간의 손길로 다듬고, 팩트체크를 해야 합니다.

## 🎨 3. AI 이미지/디자인 판매 (월 100-500만원)

### 무슨 일을 하나요?
Midjourney, DALL-E 3, Stable Diffusion으로 이미지를 만들어 판매해요. 로고, 일러스트, 패턴 디자인, NFT 아트 등 다양한 분야가 있죠.

### 성공 사례
이모 씨(26세)는 Etsy에서 AI로 만든 패턴 디자인을 판매해 월 $3,000(약 400만원)을 벌고 있어요. 한 번 만들어두면 계속 팔리는 "패시브 인컴"이죠!

### 어디서 팔아요?
- **해외**: Etsy, Creative Market, Gumroad
- **국내**: 크라우드픽, 디자인레이스, 크몽
- **NFT**: OpenSea, Rarible

🎯 **필승 전략**: 특정 니치(틈새시장)를 공략하세요. 예를 들어 "요가 스튜디오 전용 로고", "반려동물 초상화" 같은 특화된 분야요.

## 🤖 4. 맞춤형 AI 챗봇 개발 (월 200-800만원)

### 이게 뭐예요?
기업이나 개인을 위한 전용 AI 비서를 만들어주는 거예요. 코딩을 못해도 가능합니다!

### 어떻게 코딩 없이 만들어요?
- **CustomGPT**: 드래그 앤 드롭으로 챗봇 제작
- **Chatbase**: 웹사이트에 바로 설치 가능한 챗봇
- **Botpress**: 좀 더 고급 기능이 필요할 때

### 누가 필요로 하나요?
- 온라인 쇼핑몰 (24시간 고객 상담)
- 학원 (수강 문의 자동 응답)
- 병원 (예약 및 문의 처리)
- 부동산 (매물 안내)

💰 **수익 구조**: 초기 개발비 100-300만원 + 월 유지보수 20-50만원

## 📚 5. AI 교육/강의 콘텐츠 (월 200-1500만원)

### 뭘 가르치나요?
"AI 활용법"을 모르는 사람들에게 알려주는 거예요. 의외로 수요가 엄청납니다!

### 인기 있는 주제들
- 직장인을 위한 ChatGPT 업무 활용법
- 소상공인을 위한 AI 마케팅
- 학생/학부모를 위한 AI 학습법
- 시니어를 위한 쉬운 AI 입문

### 어디서 판매하나요?
- **온라인 강의**: 인프런, 클래스101, 탈잉
- **전자책**: 크몽, 텀블벅, 리디북스
- **오프라인**: 기업 출강, 지자체 교육

🌟 **성공 비법**: "AI 전문가"가 아니어도 돼요. "나보다 조금 덜 아는 사람"에게 가르치면 됩니다!

## 🎬 6. AI 영상 편집 서비스 (월 150-600만원)

### 어떤 일이에요?
유튜브 쇼츠, 틱톡, 인스타 릴스 등 짧은 영상을 AI로 빠르게 편집해주는 서비스예요.

### 사용하는 도구들
- **Opus Clip**: 긴 영상에서 하이라이트 자동 추출
- **Descript**: 텍스트 편집하듯 영상 편집
- **RunwayML**: AI 특수효과 추가
- **HeyGen**: AI 아바타 영상 제작

### 목표 고객
- 유튜버 (쇼츠 제작 대행)
- 기업 (제품 홍보 영상)
- 교육 기관 (온라인 강의 편집)
- 인플루언서 (SNS 콘텐츠)

💡 **차별화 전략**: "48시간 내 완성", "무제한 수정" 같은 서비스로 경쟁력을 높이세요.

## 🔧 7. AI API 서비스 개발 (월 100-3000만원)

### 이건 좀 어려운 거 아니에요?
놀랍게도 Replicate, Hugging Face 같은 플랫폼을 쓰면 초보자도 가능해요!

### 어떤 서비스를 만들 수 있나요?
- 특정 업종 전용 번역 서비스
- 이미지 배경 제거 API
- 문서 요약 서비스
- 감정 분석 도구

### 수익 모델
- 월 구독료 (월 10-100만원)
- 사용량 기반 과금 (API 호출당 과금)
- 일회성 라이선스 판매

## 🚀 지금 당장 시작하는 법

### 1단계: 자신에게 맞는 분야 선택
- 글쓰기를 좋아한다 → AI 콘텐츠 에이전시
- 디자인 감각이 있다 → AI 이미지 판매
- 가르치는 걸 좋아한다 → AI 교육 콘텐츠
- 기술에 관심이 많다 → 자동화 서비스나 API 개발

### 2단계: 필수 도구 준비
- ChatGPT Plus 또는 Claude Pro 구독 (월 2-3만원)
- 선택한 분야의 전문 AI 도구 1-2개
- 포트폴리오 웹사이트 (Notion, Carrd로 무료 제작 가능)

### 3단계: 무료로 시작하기
처음 3-5개 프로젝트는 무료나 저렴한 가격으로 진행하세요. 경험과 포트폴리오가 가장 중요합니다!

## ⚠️ 현실적인 조언

### 피해야 할 함정들
1. **"하루 만에 억만장자"** 같은 과대광고 믿지 마세요
2. **AI가 모든 걸 해준다**고 생각하지 마세요 - 인간의 창의성과 검수는 필수입니다
3. **한 분야에 올인**하지 마세요 - 여러 수입원을 만드는 게 안전합니다

### 성공의 핵심
- **꾸준함**: 최소 3-6개월은 투자하세요
- **차별화**: 남들과 다른 나만의 특색을 만드세요
- **네트워킹**: 같은 분야 사람들과 정보를 공유하세요
- **계속 배우기**: AI는 빠르게 발전하니 트렌드를 놓치지 마세요

## 💡 마무리: 2025년은 기회의 해

2025년 현재, AI로 돈을 버는 사람과 못 버는 사람의 차이는 단 하나예요. **"시작했느냐, 안 했느냐"**입니다.

물론 모든 사람이 월 1000만원을 벌 수는 없어요. 하지만 월 100만원의 부수입이라도 생긴다면? 인생이 달라질 수 있죠.

가장 중요한 건 **완벽하지 않아도 시작하는 것**입니다. AI는 도구일 뿐, 결국 가치를 만드는 건 여러분의 아이디어와 노력이에요.

지금 이 글을 읽고 계신 여러분, 오늘부터 시작해보는 건 어떨까요? 6개월 후의 여러분이 감사해할 거예요! 🚀

---

*이 글이 도움이 되셨다면 좋아요와 댓글로 여러분의 AI 활용 경험을 공유해주세요! 함께 성장해요!*`

  const excerpt =
    '2025년 AI를 활용해 월 1000만원 이상 버는 현실적인 7가지 방법을 소개합니다. 자동화 서비스, 콘텐츠 에이전시, 이미지 판매 등 지금 당장 시작할 수 있는 구체적인 방법과 실제 사례를 담았습니다.'

  const slug = '2025-ai-money-making-realistic-methods'

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
      { name: 'AI수익화', slug: 'ai-monetization', color: '#8b5cf6' },
      { name: '부업', slug: 'side-job', color: '#10b981' },
      { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
      { name: '재테크', slug: 'finance', color: '#f59e0b' },
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
createAIMoneyPost()
  .then(() => {
    console.log('🎉 AI로 돈버는법 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
