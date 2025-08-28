import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎯 MD 변환기 by Mrbaeksang 완벽 사용 가이드!!

![MD 변환기 메인 화면](https://i.postimg.cc/mDY9xT30/image.png)


솔직히 이런 경험 있으시죠?


GPT한테 "이거 마크다운 파일로 만들어줘"라고 했더니 파일은 받았는데...
열어보니 한글이 다 '???'로 바뀌어 있고, 표는 엉망이고.


더 황당한 건, GPT가 준 파일 다운로드 누르면:

![파일을 찾을 수 없습니다 에러](https://i.postimg.cc/rwkJZF62/image.png)

"파일을 찾을 수 없습니다"라는 경고창... 진짜 빡칩니다.


## 🔍 왜 이런 일이 생기는 걸까?

GPT가 만든 파일을 다운받으면:
- 인코딩이 맞지 않아 한글 깨짐
- 메모장에서 열면 줄바꿈도 이상함  
- Word로 변환하려니 또 다른 프로그램 설치해야 하고...


그래서 제가 직접 한국인들을 위해 무료 공익 사이트를 만들었습니다.


## 🚀 MD 변환기 by Mrbaeksang 소개

👉 [https://md-converter-korean.vercel.app/](https://md-converter-korean.vercel.app/)


한글 깨짐 없이 마크다운을 Word, PDF, Excel로 변환하는 완전 무료 서비스!


## 📱 완벽 사용법 (3단계로 끝!)

### 📌 STEP 1: GPT에게 마크다운 파일 요청하기

GPT에게 사진, 글, 어떤 형식이든 "마크다운 파일로 만들어줘"라고 요청합니다.

그러면 이런 식으로 마크다운 코드를 보여줍니다:

![GPT 마크다운 응답 예시](https://i.postimg.cc/JzR1rZw6/image.png)


**중요!** 이때 2가지 방법이 있습니다:
- **방법 1**: 복사 버튼 눌러서 복사하기
- **방법 2**: 파일로 다운로드


### 📌 STEP 2: MD 변환기 사이트 접속

[https://md-converter-korean.vercel.app/](https://md-converter-korean.vercel.app/) 접속!


### 📌 STEP 3: 변환하기

#### 💻 PC 사용법

**3-1. GPT에서 복사한 내용이 있다면:**
- 사이트 중앙 편집기에 붙여넣기 (Ctrl+V)

**3-2. 파일을 다운받았다면:**
- 오른쪽 위 [파일 가져오기] 클릭

![파일 가져오기 버튼](https://i.postimg.cc/Xq9VJv1g/image.png)


**3-3. 왼쪽 버튼들 중 원하는 포맷 클릭 → 즉시 다운로드!**

![변환 버튼들](https://i.postimg.cc/cJ6tJQRM/image.png)


#### 📱 모바일 사용법

**3-1. 오른쪽 위 더보기(⋮) → [파일 가져오기] 클릭**

![모바일 파일 가져오기](https://i.postimg.cc/5N1JgbkZ/image.png)


**3-2. 왼쪽 위 햄버거 메뉴(☰) → 원하는 포맷 선택**

![모바일 메뉴](https://i.postimg.cc/Gt3CcjYb/image.png)

![모바일 변환 옵션](https://i.postimg.cc/WbtBXzwY/image.png)


끝! 진짜 이게 전부입니다. 😎


## ✨ 실제 변환 결과

**PDF로 변환한 예시 - 한글 완벽 지원!**

![PDF 변환 예시](https://i.postimg.cc/D00MjpL4/image.png)


보시는 것처럼 한글이 하나도 깨지지 않고, 표도 깔끔하게 변환됩니다.


## 🎯 지원 포맷 총정리

| 포맷 | 설명 | 이럴 때 사용 |
|------|------|------------|
| **HTML** | 웹페이지로 바로 볼 수 있게 | 블로그 포스팅용 |
| **Styled HTML** | 예쁜 디자인 적용된 HTML | 프레젠테이션용 |
| **PDF** | 한글 폰트 완벽 지원 | 인쇄, 공유용 |
| **DOCX** | Word에서 편집 가능 | 보고서 작성용 |
| **Excel** | 마크다운 표만 추출 | 데이터 정리용 |
| **Plain Text** | 순수 텍스트만 | 메모장용 |


실시간 미리보기도 지원해서 변환 전에 결과를 미리 확인할 수 있습니다!


## 💬 마무리

GPT 쓰면서 불편했던 분들에게 도움이 되었으면 좋겠습니다.


잘 썼으면 좋겠고, 댓글과 좋아요, 그리고 공유가 개발자에게 정말 큰 힘이 됩니다! 🙏


여러분도 비슷한 경험 있으시거나 다른 변환 도구 써보신 경험 있으면 댓글로 공유해주세요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: 'MD 변환기 by Mrbaeksang 완벽 사용 가이드!!',
        slug: 'md-converter-korean-guide-2024',
        content,
        excerpt:
          'GPT 마크다운 한글 깨짐 완벽 해결! 3단계로 끝내는 무료 변환기 사용법',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle: 'MD 변환기 완벽 가이드 - 한글 깨짐 없는 마크다운 변환',
        metaDescription:
          'GPT로 받은 마크다운 파일 한글 깨짐 해결! 3단계로 끝내는 무료 온라인 마크다운 변환기 사용법',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
      { name: '가이드', slug: 'guide', color: '#7c3aed' },
      { name: '마크다운', slug: 'markdown', color: '#6b7280' },
      { name: '도구', slug: 'tools', color: '#f59e0b' },
    ]

    for (const tagData of tags) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagData.name },
      })

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
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } },
        })
      }

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log('✅ MD Converter 가이드 게시글 생성 완료!')
    console.log(`📝 제목: ${post.title}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`📊 조회수: ${post.viewCount}`)
  } catch (error) {
    console.error('게시글 생성 오류:', error)
    throw error
  }
}

if (require.main === module) {
  createPost()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
