import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// AI뉴스 카테고리 ID
const AI_NEWS_CATEGORY_ID = 'cme5a3ysr0002u8wwwmcbgc7z'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🚀 퍼플렉시티 프로 완전 무료로 쓰는 법 총정리 7가지 방법 !!

## 🎯 한 줄 요약
**퍼플렉시티 프로를 한국에서 완전 무료로 사용하는 다양한 방법들을 한 번에 정리했습니다!**

![퍼플렉시티 프로 무료 사용법](https://pimg.mk.co.kr/news/cms/202503/21/news-p.v1.20250221.6c9873f8c01c455a998af65566edef4b_P1.png)

## 🤔 퍼플렉시티가 뭔가요?

퍼플렉시티(Perplexity)는 ChatGPT와 비슷한 AI 검색엔진인데, **실시간 웹 검색 결과를 바탕으로 답변**해주는 게 특징이에요.

**ChatGPT vs 퍼플렉시티:**
- **ChatGPT**: 학습 데이터까지의 정보만 알고 있음
- **퍼플렉시티**: 실시간으로 웹을 검색해서 최신 정보 제공

**퍼플렉시티 프로의 장점:**
- ✅ **GPT-4, Claude-3.5 등 최신 모델** 무제한 사용
- ✅ **파일 업로드** 기능 (PDF, 이미지 분석)
- ✅ **API 액세스** 제공
- ✅ **무제한 Pro 검색** (일반은 하루 5회 제한)

**문제는 가격이에요... 월 $20 😱**

**하지만! 한국인이라면 완전 무료로 쓸 수 있는 방법들이 있어요!** 🎉

## 🎓 학생이라면 - 1년 무료!

### 1️⃣ 대학교 이메일 (.ac.kr) 활용
**가장 확실한 방법입니다!**

**📚 이렇게 하세요:**
1. 대학교 이메일로 퍼플렉시티 가입
2. Student Program 신청
3. 자동으로 **1년 무료** 승급!

**✅ 지원 대학교:**
- 서울대, 연세대, 고려대, KAIST
- 지방 국립대, 사립대 대부분 지원
- 전문대학도 가능!

![대학교 이메일 활용법](https://images.ctfassets.net/lzny33ho1g45/best-email-app-p-img/9d9a71b806c1ea8a206766c0eac834b2/best_apps_131.jpg?fm=avif&q=31&fit=thumb&w=1520&h=760)

### 2️⃣ 학생 추천 프로그램
**친구 중에 대학생이 있다면?**

- 기존 Pro 사용자가 추천하면 **최대 24개월** 무료
- 대학 인증만 받으면 OK
- 추천자도 혜택 받음

![학생 추천 프로그램](https://newsimg.sedaily.com/2020/06/30/1Z488A9W20_7.jpg)

## 💳 금융 서비스 연계 혜택

### 3️⃣ 나무증권 제휴 혜택
**주식 투자하시나요?**

**🏦 혜택 내용:**
- 나무증권 계좌 개설 시 퍼플렉시티 프로 무료
- 특정 거래량 달성하면 연장 가능
- 2025년 신규 이벤트 진행 중

**📝 신청 방법:**
1. 나무증권 앱에서 계좌 개설
2. 이벤트 페이지에서 퍼플렉시티 혜택 신청
3. 즉시 Pro 계정 활성화

![나무증권 혜택](https://cgeimage.commutil.kr/phpwas/restmb_allidxmake.php?pp=002&idx=3&simg=202503121524540687348439a487410625221173.jpg&nmt=29)

### 4️⃣ SKT 텔레콤 제휴
**SKT 사용자라면?**

- SKT 5G 플랜 가입자 대상
- T멤버십 연동으로 할인/무료 혜택
- 가족 요금제 사용자도 혜택 가능

![SKT 텔레콤 제휴](https://img.hankyung.com/photo/202406/01.37019979.1.jpg)

## 📱 디바이스 구매 혜택

### 5️⃣ Samsung Galaxy 사용자 혜택
**갤럭시 최신 기종 보유자라면?**

**📱 대상 기기:**
- Galaxy S24/S25 시리즈
- Galaxy Note 시리즈 (최신 2세대)
- Galaxy Tab S 시리즈

**🎁 혜택 받는 법:**
1. Samsung Members 앱 설치
2. 기기 등록 확인
3. AI 서비스 혜택 메뉴에서 신청

![Samsung Galaxy 혜택](https://images.samsung.com/kdp/cms_contents/504759/3381962e-acbc-4c5c-abd6-8dce233d5d94.jpg)

## 🎪 기타 숨겨진 혜택들

### 6️⃣ Campus Strategist 프로그램
**대학생 홍보 대사 활동**

- 대학 내에서 퍼플렉시티 홍보 활동
- 선발되면 Pro 계정 무료 + 추가 혜택
- 포트폴리오 쌓기도 가능

![Campus Strategist 프로그램](https://i.postimg.cc/3JhJWH1D/22f8e2ce-82da-4559-94a9-187c9b4deda1.png)

### 7️⃣ 개발자/연구자 혜택
**GitHub 학생 팩에 포함**

- GitHub Student Developer Pack 신청
- 다양한 개발 도구와 함께 퍼플렉시티 크레딧 제공
- 대학생 개발자라면 필수!

![GitHub 학생 팩](https://github.blog/wp-content/uploads/2014/10/4b0317bc-4599-11e4-8bc3-0ca4dd5223e8.png?resize=2284%2C889)

## 🎫 프로모션 코드 현황

### 현재 작동하는 코드는...
**안타깝게도 대부분 만료 😢**

- **PPLXQGVKC3YRWV6LYHTO** - 만료됨
- **STUDENT2024** - 만료됨  
- **WELCOME25** - 확인 중

### 🔍 새 코드 찾는 팁
1. **퍼플렉시티 공식 SNS 팔로우** (트위터, 링크드인)
2. **기술 컨퍼런스 참석** (종종 프로모션 코드 배포)
3. **대학 IT 동아리 정보** 확인
4. **해커톤 이벤트** 참여

## 🚀 추천 순서 - 이렇게 시도해보세요!

### 💯 성공률 높은 순서
1. **대학생이라면**: .ac.kr 이메일로 Student Program 신청
2. **투자자라면**: 나무증권 혜택 확인  
3. **SKT 사용자라면**: T멤버십 혜택 확인
4. **갤럭시 사용자라면**: Samsung Members 혜택 확인
5. **일반인이라면**: 학생 추천 프로그램 활용

### ⚠️ 주의사항
- **프로모션은 수시로 변경**되니 공식 채널 확인 필수
- **중복 신청 불가** - 한 번에 하나씩만
- **계정 공유 금지** - 개인 계정으로만 사용

## 💡 꿀팁 정리

### ✅ 놓치기 쉬운 팁들
- **졸업 예정이라도** 재학 중이면 학생 혜택 가능
- **가족 중 대학생**이 있다면 추천 프로그램 활용
- **회사 법인 카드**로 결제하면 비용 처리 가능
- **연구 목적**이면 연구비 지원 신청 가능

### 🎯 최대한 활용하는 법
1. **파일 분석 기능** 적극 활용 (PDF, 이미지)
2. **API 연동**으로 자동화 구축
3. **실시간 검색**으로 최신 트렌드 파악
4. **다양한 AI 모델** 비교 사용

## 💭 마무리

**퍼플렉시티 프로를 무료로 사용하는 방법이 이렇게 많다니!** 

특히 한국에서는 나무증권, SKT 등 다양한 제휴 혜택이 있어서 생각보다 쉽게 무료로 사용할 수 있어요.

**가장 확실한 건 역시 대학생 혜택**이니, 주변에 대학생 친구가 있다면 추천 프로그램도 활용해보세요!

**여러분은 어떤 방법으로 퍼플렉시티 프로를 사용하고 계신가요?** 댓글로 경험담을 공유해주세요! 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

### 🔗 참고 자료
- [퍼플렉시티 공식 사이트](https://perplexity.ai)
- [Student Program 신청](https://perplexity.ai/pro?student=true)
- [나무증권 앱 다운로드](https://play.google.com/store/apps/details?id=com.wooriwm.txsmart)
- [Samsung Members 앱](https://play.google.com/store/apps/details?id=com.samsung.android.voc)`

  try {
    console.log('🎯 퍼플렉시티 프로 가이드 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🚀 퍼플렉시티 프로 완전 무료로 쓰는 법 총정리 7가지 방법 !!',
        slug: 'perplexity-pro-free-7-methods-guide-2025',
        content,
        excerpt:
          '퍼플렉시티 프로를 한국에서 완전 무료로 사용하는 다양한 방법들을 정리했습니다. 대학생 혜택, 나무증권 제휴, SKT 할인, 갤럭시 사용자 혜택 등 놓치기 쉬운 꿀팁까지 한 번에!',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: AI_NEWS_CATEGORY_ID,
        viewCount: getRandomViewCount(300, 500),
        metaTitle:
          '퍼플렉시티 프로 무료 사용법 총정리 7가지 방법 - 2025년 최신',
        metaDescription:
          '퍼플렉시티 프로를 무료로 사용하는 모든 방법을 정리! 대학생 1년 무료, 나무증권 제휴, SKT 할인, 갤럭시 혜택 등 한국인을 위한 완벽 가이드',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tags = [
      { name: '퍼플렉시티', slug: 'perplexity-ai', color: '#8b5cf6' },
      { name: 'AI 검색', slug: 'ai-search-engine', color: '#06b6d4' },
      { name: '무료 혜택', slug: 'free-benefits-2025', color: '#059669' },
      {
        name: '대학생 할인',
        slug: 'student-discount-program',
        color: '#f59e0b',
      },
      { name: '나무증권', slug: 'namu-securities-benefit', color: '#dc2626' },
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagData of tags) {
      // 태그가 이미 존재하는지 확인
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagData.name },
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
  createPost()
    .then(() => {
      console.log('🎉 퍼플렉시티 프로 가이드 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
