import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createSingleFrontendPost() {
  const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '2025년 가장 핫한 React UI 라이브러리 3개 - 초보도 쉽게 따라하기'
  const content = `# 2025년 가장 핫한 React UI 라이브러리 3개 - 초보도 쉽게 따라하기

## 🎯 React 초보자도 바로 써볼 수 있는 UI 라이브러리들

React로 개발하면서 "이쁜 UI 어떻게 만들지?" 고민 많으셨죠? 매번 CSS 짜기는 힘들고, 디자인 감각은 부족하고... 그런 분들을 위해 2025년 8월 현재 가장 인기 있는 React UI 라이브러리 3개를 소개해드릴게요!

## 🥇 1등: ShadCN/UI - 요즘 개발자들이 가장 사랑하는 라이브러리

### 왜 이렇게 인기일까요?

ShadCN/UI가 2025년 들어서 정말 핫해졌어요. GitHub 스타가 78,000개를 넘어섰거든요. 특이한 점은 일반적인 라이브러리와 달리 **코드를 직접 복사해서 쓰는 방식**이라는 거예요.

### 실제로 써보니 어떤가요?

터미널에서 다음 명령어를 실행하세요:

npx shadcn-ui@latest init
npx shadcn-ui@latest add button

이렇게 두 줄만 치면 끝! 정말 간단하죠? 버튼 컴포넌트가 바로 여러분의 프로젝트에 추가돼요.

### ShadCN/UI의 장점들
- **완전한 코드 소유권**: 복사한 코드는 100% 내 것
- **Tailwind CSS 기반**: 커스터마이징이 정말 쉬워요
- **Radix UI 기반**: 접근성도 알아서 처리됨
- **번들 크기 0**: 필요한 것만 골라서 쓰니까 용량 걱정 없음

## 🥈 2등: Radix UI - 진짜 개발자를 위한 선택

### 헤드리스 UI가 뭔가요?

Radix UI는 "헤드리스 UI"라고 불러요. 쉽게 말하면 **기능은 다 있는데 스타일은 하나도 없는** 컴포넌트들이에요. 처음엔 이상해 보이지만, 알고 보면 정말 강력한 도구예요.

### 언제 쓰면 좋을까요?

이런 식으로 기능만 있고 스타일은 내가 자유자재로 만들 수 있어요:

Dialog.Root 안에 Dialog.Trigger와 Dialog.Content를 넣어서 모달을 만들고, 클래스명으로 원하는 대로 스타일링하는 방식이에요.

회사에서 정해진 디자인 시스템이 있거나, 정말 독특한 UI를 만들고 싶을 때 최고예요. Vercel도 이걸 쓴답니다!

### Radix UI의 특징
- **100% 접근성 준수**: 키보드 네비게이션, 스크린 리더 다 지원
- **완전 커스터마이징**: 내 마음대로 스타일링 가능  
- **안정성**: 대기업들이 실제로 사용하는 검증된 라이브러리

## 🥉 3등: Material-UI (MUI) - 안정성의 대명사

### 여전히 강력한 MUI

"새로운 게 좋다고 기존 거를 무시하면 안 되죠!" MUI는 여전히 주간 다운로드 400만 회를 기록하는 압도적 1위 라이브러리예요. GitHub 스타도 94,000개로 최고 수준이고요.

### MUI를 선택해야 하는 경우

설치하자마자 바로 이쁜 UI가 완성돼요! Button, Card, Typography 같은 컴포넌트들을 import해서 쓰기만 하면 Google의 Material Design 스타일이 바로 적용되거든요.

### MUI의 강점들
- **즉시 사용 가능**: 설치하자마자 Google Material Design 스타일
- **엄청난 컴포넌트 수**: 100개 넘는 컴포넌트
- **풍부한 생태계**: 테마, 아이콘, 차트까지 모든 게 다 있음
- **안정성**: 수년간 검증된 라이브러리

## 🤔 그래서 뭘 선택해야 하나요?

### 초보자라면?
**MUI**를 추천해요! 설치하자마자 바로 예쁜 화면이 나오니까 성취감도 느낄 수 있고, 학습 곡선도 완만해요.

### 회사 프로젝트라면?
**ShadCN/UI**가 요즘 대세예요. 성능도 좋고, 커스터마이징도 쉽고, 코드 소유권도 완전히 내 것이니까요.

### 디자인에 진짜 자신 있다면?
**Radix UI**로 가세요! 완전 자유자재로 UI를 만들 수 있어요.

## 🎯 실전 팁: 어떻게 시작하면 좋을까요?

### 1. 연습용 프로젝트 만들기

터미널에서 다음 명령어를 실행해보세요:

npx create-react-app my-ui-test
cd my-ui-test

### 2. 하나씩 써보기
각 라이브러리로 똑같은 화면을 만들어보세요. 버튼 하나, 모달 하나만 만들어봐도 차이를 확실히 느낄 수 있어요.

### 3. 커뮤니티 활용하기
- **ShadCN/UI**: 공식 디스코드에서 활발한 토론
- **Radix UI**: GitHub 이슈에서 개발자들과 소통
- **MUI**: Stack Overflow에 엄청 많은 자료

## ⚡ 성능은 어떤가요?

2025년 8월 현재 번들 크기 비교해보면:
- **ShadCN/UI**: 0KB (필요한 것만 복사하니까!)
- **Radix UI**: 상황에 따라 다름 (필요한 컴포넌트만 import)
- **MUI**: 약 300KB (전체 라이브러리 기준)

성능 걱정은 별로 안 하셔도 돼요. 요즘 인터넷 속도면 충분히 감당 가능한 수준이에요.

## 🔮 앞으로 어떻게 발전할까요?

2025년 하반기에는 AI와 UI 라이브러리의 결합이 더 활발해질 것 같아요. 이미 일부 도구들은 AI로 컴포넌트를 자동 생성해주는 기능도 있거든요.

하지만 기본기는 여전히 중요해요. 이 세 라이브러리 중 하나라도 제대로 익혀두시면, 나중에 어떤 새로운 도구가 나와도 금방 적응할 수 있을 거예요.

## 💪 마무리: 지금 바로 시작하세요!

너무 고민만 하지 마시고, 일단 하나 골라서 시작해보세요! 틀린 선택이란 없어요. 세 라이브러리 모두 훌륭한 도구들이니까요.

개발은 직접 써봐야 느낌이 와요. 이 글을 읽는 지금 바로 터미널을 열어서 시작해보시는 건 어떨까요? 💻

여러분은 어떤 UI 라이브러리를 선택하실 건가요? 댓글로 이유도 함께 알려주세요! 🚀

---

*이 글이 도움이 되셨다면 좋아요 눌러주시고, 더 궁금한 점이 있으시면 언제든 댓글 남겨주세요!*`

  const excerpt =
    '2025년 8월 현재 가장 인기 있는 React UI 라이브러리 ShadCN/UI, Radix UI, Material-UI를 초보자 관점에서 쉽게 비교 분석했습니다. 각각의 특징과 언제 사용하면 좋은지 실전 경험을 바탕으로 설명드려요.'

  const slug = '2025-hot-react-ui-libraries-beginners-guide'

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
        // 스키마 필드 완전 활용 (모든 필드 포함 필수)
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null, // 승인된 게시글이므로 null
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: getRandomViewCount(100, 250), // Frontend 카테고리 조회수 범위
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
    const tags = [
      { name: 'React', slug: 'react', color: '#61dafb' },
      { name: 'UI Library', slug: 'ui-library', color: '#8b5cf6' },
      { name: 'ShadCN', slug: 'shadcn', color: '#000000' },
      { name: 'Radix UI', slug: 'radix-ui', color: '#8b5cf6' },
      { name: 'Frontend', slug: 'frontend', color: '#06b6d4' },
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
createSingleFrontendPost()
  .then(() => {
    console.log('🎉 Frontend 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
