import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// 바이브코딩 카테고리 ID (가이드/튜토리얼에 적합)
const VIBECODING_CATEGORY_ID = 'cme5a5vyt0003u8ww9aoazx9f'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🚀 ChatGPT로 네이버 블로그 글 완전 자연스럽게 쓰는 법 공략!!

## 🎯 한 줄 요약
**ChatGPT가 준 ##, ### 이런 이상한 기호들을 네이버 블로그에서 깔끔하게 보이게 만드는 방법!**

![마크다운 변환 메인 이미지](https://i.postimg.cc/9fQYTTT4/image.png)

## 🤔 이런 경험 있으신가요?

ChatGPT한테 블로그 글 써달라고 했더니...

> "AI 모델 비교를 위한 글을 네이버 블로그에 포스트할거야. 가독성 좋게 바로 복사할 수 있는 MD 형식으로 줘"

라고 요청했더니 이런 답변을 받았죠:

![ChatGPT가 마크다운 형식으로 준 모습](https://i.postimg.cc/DZhjXRx6/image.png)

\`\`\`markdown
## AI 모델 비교 분석
### 1. GPT-4 vs Claude 3
- **GPT-4**: 범용성이 뛰어남
- **Claude 3**: 안전성과 윤리성 강조
### 2. 성능 비교표
| 모델명 | 파라미터 | 특징 |
|--------|----------|------|
| GPT-4 | 1.76T | 멀티모달 |
\`\`\`

이렇게 ##, ###, -, ** 같은 이상한 기호들이 잔뜩! 😅

## 😱 네이버 블로그에 그대로 붙여넣으면?

그런데 이걸 **네이버 블로그에 그대로 복사-붙여넣기** 하면...

![네이버 블로그에 마크다운을 그대로 붙여넣었을 때의 모습](https://i.postimg.cc/ZKnfp8xG/image.png)

**앗! 이게 뭐야?** 😭
- 제목이 제목처럼 안 보이고
- 그냥 ##, ### 기호가 그대로 보이고
- 표도 엉망이 되고
- 전혀 예쁘지 않죠?

## 💡 해결책: Dillinger를 사용하세요!

### 🌐 Dillinger가 뭐예요?

**[Dillinger](https://dillinger.io/)**는 마크다운을 실시간으로 HTML로 변환해주는 무료 온라인 도구예요!

- **회원가입 필요 없음** ✅
- **완전 무료** ✅
- **실시간 미리보기** ✅
- **한글 완벽 지원** ✅

## 🎯 따라하기 쉬운 4단계 가이드

### Step 1: Dillinger 접속하기

브라우저에서 **https://dillinger.io/** 접속하면 이런 화면이 나타납니다:

![Dillinger에서 변환하는 작업 모습](https://i.postimg.cc/3NV2gvKh/image.png)

**화면 구성:**
- **왼쪽**: ChatGPT가 준 마크다운을 붙여넣는 곳
- **오른쪽**: 실시간으로 예쁘게 변환된 미리보기

### Step 2: 마크다운 붙여넣기

1. **왼쪽 창의 기본 텍스트 모두 지우기** (Ctrl+A → Delete)
2. **ChatGPT가 준 마크다운 전체 복사** (Ctrl+C)
3. **Dillinger 왼쪽 창에 붙여넣기** (Ctrl+V)

즉시 오른쪽에 예쁘게 변환된 결과가 나타납니다! 🎉

### Step 3: 변환된 내용 복사하기

**중요한 단계입니다!** 🔥

**가장 간단한 방법:**
1. **오른쪽 미리보기 창** 전체 선택 (Ctrl+A)
2. **복사** (Ctrl+C)
3. 이제 네이버 블로그에 붙여넣을 준비 완료!

### Step 4: 네이버 블로그에 붙여넣기

1. **네이버 블로그 글쓰기** 열기
2. **스마트에디터 3.0** 모드 확인
3. **Ctrl+V로 붙여넣기**

## ✨ 변환 결과 비교

### Before vs After

![Dillinger로 변환한 후 네이버 블로그에 붙여넣은 모습](https://i.postimg.cc/vTNt3Ktp/image.png)

**짠! 완전히 달라졌죠?** 🎊
- ✅ 제목이 크고 굵게 표시됨
- ✅ 소제목도 계층별로 깔끔하게
- ✅ 리스트가 불릿 포인트로 예쁘게
- ✅ 표도 깔끔한 테이블로 변환
- ✅ 굵은 글씨, 기울임체 모두 적용!

## 🎨 네이버 블로그 최적화 꿀팁

### 📌 팁 1: 이미지는 따로 추가하기

마크다운의 이미지 링크는 네이버에서 안 보여요!
- Dillinger에서 변환 후
- 네이버 블로그에서 직접 이미지 업로드
- 적절한 위치에 배치

### 📌 팁 2: 코드 블록 처리

\`\`\`python
print("Hello World")
\`\`\`

이런 코드 블록은:
1. 네이버 블로그의 **"인용구"** 기능 사용
2. 또는 **배경색 있는 표** 만들기
3. 폰트를 **"Courier New"** 로 변경

### 📌 팁 3: 표(Table) 깔끔하게 만들기

마크다운 표:
\`\`\`markdown
| 항목 | 가격 | 평점 |
|------|------|------|
| 파스타 | 15,000원 | ★★★★★ |
| 피자 | 20,000원 | ★★★★☆ |
\`\`\`

Dillinger로 변환하면 자동으로 예쁜 표가 됩니다!

### 📌 팁 4: 이모지 활용하기

ChatGPT에게 요청할 때:
> "이모지를 많이 사용해서 재미있게 써줘"

네이버 블로그는 이모지를 완벽 지원합니다! 
🎯 💡 ✨ 🔥 ⚡ 🌟 등을 적극 활용하세요!

## ⚠️ 주의사항

### ❌ 이런 건 안 돼요

1. **마크다운 링크 문법** \`[텍스트](URL)\`
   - 네이버는 보안상 외부 링크를 제한
   - 수동으로 링크 추가 필요

2. **HTML 태그 직접 사용**
   - \`<div>\`, \`<style>\` 등은 자동 제거됨
   - 네이버 에디터 기능만 사용

3. **자바스크립트 코드**
   - 보안상 모두 차단됨

### ✅ 이렇게 하세요

1. **단계별로 확인하기**
   - Dillinger에서 먼저 미리보기
   - 네이버에 붙여넣고 다시 확인
   - 필요시 수동 조정

2. **서식 살리기**
   - 제목은 네이버의 "제목" 스타일 사용
   - 중요한 부분은 형광펜 효과
   - 구분선으로 섹션 나누기

## 🚀 실전 활용 예시

### 💬 ChatGPT 프롬프트 팁

**효과적인 요청 방법:**
\`\`\`
"[주제]에 대한 네이버 블로그 글을 작성해줘.
마크다운 형식으로 작성하되:
- 제목은 #으로
- 소제목은 ##, ###으로
- 중요한 부분은 **굵게**
- 리스트는 -나 1. 2. 3.으로
- 표가 필요하면 마크다운 테이블로"
\`\`\`

이렇게 요청하면 Dillinger로 바로 변환 가능한 깔끔한 마크다운을 받을 수 있어요!

## 💭 추가 꿀팁: 시간 절약 방법

### 🔄 반복 작업 자동화

1. **ChatGPT 프롬프트 저장**
   - "네이버 블로그용 마크다운으로 [주제] 글 써줘"
   - "이모지 많이 사용하고 단락 짧게"

2. **Dillinger 북마크**
   - 즐겨찾기에 추가
   - 바로가기 만들기

3. **템플릿 만들기**
   - 자주 쓰는 구조 저장
   - ChatGPT에 템플릿 학습시키기

### 📊 효과적인 구조

**독자가 좋아하는 글 구조:**
1. 흥미로운 제목 (질문형/숫자형)
2. 한 줄 요약
3. 공감가는 도입부
4. 핵심 내용 (번호/불릿)
5. 실제 사례/예시
6. 간단한 마무리

## 🎉 이제 여러분도 할 수 있어요!

**정리하면:**
1. ChatGPT → 마크다운 받기
2. Dillinger.io → 변환하기
3. 네이버 블로그 → 붙여넣기
4. 약간의 수정 → 완성! 🎊

**이 방법을 쓰면:**
- ⏰ 글쓰기 시간 **70% 단축**
- 📈 가독성 **200% 향상**
- 💝 독자 반응 **폭발적 증가**

여러분도 오늘부터 전문 블로거처럼 깔끔한 글을 쓸 수 있어요!

궁금한 점이 있다면 댓글로 물어봐주세요! 😊

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

**#네이버블로그 #ChatGPT #마크다운 #블로그팁 #Dillinger #글쓰기팁**`

  try {
    console.log('🎯 네이버 블로그 마크다운 가이드 게시글 생성 시작...')

    // 타임스탬프를 포함한 고유한 슬러그 생성
    const timestamp = new Date().getTime()
    const uniqueSlug = `naver-blog-markdown-guide-with-dillinger-${timestamp}`

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🚀 ChatGPT로 네이버 블로그 글 완전 자연스럽게 쓰는 법 공략!!',

        slug: uniqueSlug,
        content,
        excerpt:
          'ChatGPT가 준 ##, ### 같은 마크다운을 네이버 블로그에서 깔끔하게 보이게 만드는 방법! Dillinger.io를 사용한 5단계 변환 가이드와 네이버 블로그 최적화 꿀팁까지 총정리했습니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: VIBECODING_CATEGORY_ID,
        viewCount: getRandomViewCount(300, 500),
        metaTitle:
          'ChatGPT 마크다운을 네이버 블로그로 변환하는 방법 | Dillinger 사용법',
        metaDescription:
          'GPT가 준 마크다운(##, ###)을 네이버 블로그에 깔끔하게 넣는 방법. Dillinger.io 사용법과 네이버 블로그 최적화 팁. 5분이면 전문 블로거처럼 글쓰기 가능!',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tags = [
      { name: '네이버블로그', slug: 'naver-blog', color: '#03c75a' },
      { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
      { name: '마크다운', slug: 'markdown', color: '#000000' },
      { name: '블로그팁', slug: 'blog-tips', color: '#f59e0b' },
      { name: 'Dillinger', slug: 'dillinger', color: '#3b82f6' },
    ]

    console.log('🏷️ 태그 처리 중...')

    for (const tagData of tags) {
      // 태그가 이미 존재하는지 확인 (name 또는 slug로)
      let tag = await prisma.mainTag.findFirst({
        where: {
          OR: [
            { name: tagData.name },
            {
              slug: tagData.slug.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            },
          ],
        },
      })

      // 태그가 없으면 생성
      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
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
      console.log('🎉 네이버 블로그 마크다운 가이드 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
