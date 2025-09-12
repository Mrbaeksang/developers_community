import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN' as const

async function createMoodboardPost() {
  try {
    const content = `저 사진 하나로도 순식간에 인스타 갬성 가득한 무드보드를 만들 수 있다는 거, 알고 계셨나요? 

오늘은 제가 직접 사용해본 **나노바나나 AI**의 신박한 무드보드 변환 기능을 소개해드릴게요. 진짜 프롬프트 하나만 입력하면 내 사진이 순식간에 인스타 갬성 무드보드로 변신합니다!

## 무드보드 변환이 뭔가요?

무드보드는 여러 이미지, 텍스트, 색상을 콜라주 형태로 배치해서 특정 컨셉이나 분위기를 표현하는 시각적 보드예요. 원래는 디자이너들이 컨셉을 정리할 때 많이 사용했는데, 요즘은 인스타그램이나 핀터레스트에서 자기표현 수단으로 인기가 많죠.

나노바나나 AI를 사용하면 내 사진 한 장과 프롬프트만으로 프로페셔널한 무드보드를 만들 수 있어요!

## 사용법은 정말 간단해요

1. [나노바나나](https://ai.nanobanana.com/) 사이트 접속
2. 변환하고 싶은 사진 업로드
3. 아래 예시 프롬프트 중 하나 복사해서 입력
4. Generate 버튼 클릭!

끝입니다. 진짜 이게 다예요. 😎

## 실제 활용 예시 10가지

자, 이제 제가 직접 테스트해본 10가지 무드보드 스타일을 보여드릴게요. 각 예시마다 **원본 사진 → 프롬프트 입력 → 결과물** 순서로 정리했습니다.

### 1. 여행 무드보드 ✈️

**사진 예시**: 너나 모델이 배낭 메고 서 있는 전신 사진

**프롬프트**:
\`\`\`
A travel mood board collage. Place a central portrait of the traveler, surrounded by cutout images of camera, map, airplane ticket, backpack gear, and snacks. Add doodles, arrows, and handwritten English notes naming each item and brand. Fun and adventurous aesthetic.
\`\`\`

![프롬프트 입력 화면](https://i.postimg.cc/NMjT6vxp/image.png)
*나노바나나에 예시 사진으로 프롬프트 입력한 모습*

![여행 무드보드 결과물](https://i.postimg.cc/05pMzQxP/image.png)
*결과물 - 여행 갬성이 물씬 나는 무드보드로 변신!*

### 2. 요리 레시피 콜라주 🍲

**사진 예시**: 네가 직접 만든 음식 사진(라면, 파스타, 김치찌개 등)

**프롬프트**:
\`\`\`
A cooking recipe collage. Put the dish photo in the center, surrounded by cutouts of each ingredient such as vegetables, spices, sauces, and tools. Add playful doodles and handwritten notes in English naming each item. Cozy and homely style.
\`\`\`

![요리 프롬프트 입력](https://i.postimg.cc/K84t32Jf/image.png)
*음식 사진으로 프롬프트 입력*

![요리 무드보드 결과물](https://i.postimg.cc/xdMJLTHv/image.png)
*레시피 북 스타일의 감성적인 콜라주 완성*

### 3. 공부/작업 공간 보드 📚

**사진 예시**: 책상 위에 노트북, 노트, 커피 놓여 있는 사진

**프롬프트**:
\`\`\`
A study desk inspiration board. Place the desk photo in the center, surrounded by cutouts of laptop, notebook, coffee cup, and sticky notes. Add doodle arrows and handwritten notes in English labeling each item. Motivating and creative aesthetic.
\`\`\`

![공부 공간 프롬프트](https://i.postimg.cc/Jn3pY8wJ/image.png)
*작업 공간 사진 업로드 및 프롬프트 입력*

![공부 무드보드 결과물](https://i.postimg.cc/ZRqW2P2c/image.png)
*스터디그램 감성 무드보드 완성*

### 4. 스킨케어 루틴 보드 🧴

**사진 예시**: 세안 직후 얼굴 사진 또는 피부 관리 전후 사진

**프롬프트**:
\`\`\`
A skincare routine collage. Place the portrait in the center, surrounded by cutouts of skincare products like cleanser, toner, moisturizer, and sunscreen. Add playful doodles, arrows, and English text with brand names. Minimal and cute style.
\`\`\`

![스킨케어 프롬프트](https://i.postimg.cc/D0MMkK6z/image.png)
*스킨케어 사진으로 프롬프트 입력*

![스킨케어 무드보드](https://i.postimg.cc/QtVz6tgz/image.png)
*뷰티 매거진 스타일의 루틴 보드 생성*

### 5. 스트릿웨어 패션 보드 👟

**사진 예시**: 스트릿룩 착장(후드티, 조거팬츠, 스니커즈) 전신샷

**프롬프트**:
\`\`\`
A streetwear fashion board. Place the portrait in the center, with cutouts of sneakers, hoodie, cap, and accessories around it. Add graffiti-style doodles and handwritten notes in English with brand names. Bold and trendy aesthetic.
\`\`\`

![스트릿웨어 프롬프트](https://i.postimg.cc/Prn6DK79/image.png)
*스트릿 패션 사진 업로드*

![스트릿웨어 무드보드](https://i.postimg.cc/qvkjbq4G/image.png)
*하입비스트 스타일의 패션 보드 완성*

### 6. 운동 루틴 보드 🏋️

**사진 예시**: 헬스장에서 운동하는 사진 (덤벨 들기, 러닝머신)

**프롬프트**:
\`\`\`
A workout routine collage. Place the fitness photo in the center, with cutouts of dumbbells, protein shake, gym shoes, and stopwatch around. Add playful doodles and handwritten English notes labeling each item. Energetic and sporty aesthetic.
\`\`\`

![운동 프롬프트 입력](https://i.postimg.cc/9QhFv3nb/image.png)
*운동 사진으로 프롬프트 테스트*

![운동 무드보드 결과](https://i.postimg.cc/DzffwrFb/image.png)
*피트니스 매거진 스타일 무드보드*

### 7. 음악 취향 보드 🎧

**사진 예시**: 네가 이어폰이나 헤드폰 끼고 있는 사진

**프롬프트**:
\`\`\`
A music taste mood board. Place the portrait in the center, surrounded by cutouts of vinyl records, headphones, favorite album covers, and instruments. Add doodles, arrows, and handwritten notes in English naming each artist. Creative and stylish vibe.
\`\`\`

![음악 프롬프트](https://i.postimg.cc/BnrcWvGy/image.png)
*음악 듣는 사진 업로드*

![음악 무드보드](https://i.postimg.cc/vT2f0Yz0/image.png)
*음악 취향을 표현한 아트 보드*

### 8. 카페 라이프 보드 ☕

**사진 예시**: 카페에서 책 읽거나 노트북 하는 사진

**프롬프트**:
\`\`\`
A coffee shop mood board. Place the central cafe portrait, surrounded by cutouts of coffee cup, pastries, books, and laptop. Add marker-style handwritten English notes labeling each item. Cozy and aesthetic style.
\`\`\`

![카페 프롬프트](https://i.postimg.cc/rsRwLqTn/image.png)
*카페 사진으로 무드보드 생성*

![카페 무드보드](https://i.postimg.cc/7ZHb58n6/image.png)
*카페 라이프 감성 보드 완성*

### 9. 진로/커리어 비전 보드 💼

**사진 예시**: 정장 입은 프로필 사진

**프롬프트**:
\`\`\`
A career vision board. Place the portrait in the center, surrounded by cutouts of briefcase, office desk, laptop, certificates, and books. Add doodles, arrows, and handwritten English notes naming goals. Clean and professional aesthetic.
\`\`\`

![커리어 프롬프트](https://i.postimg.cc/mZ3HkwWm/image.png)
*프로필 사진으로 비전보드 생성*

![커리어 무드보드](https://i.postimg.cc/C5wdk3pm/image.png)
*프로페셔널한 커리어 비전 보드*

### 10. 취미/라이프스타일 보드 🎨

**사진 예시**: 네가 그림 그리거나 기타 치는 순간을 찍은 사진

**프롬프트**:
\`\`\`
A hobby lifestyle collage. Place the hobby portrait in the center, surrounded by cutouts of art tools, sketchbook, guitar, or hobby-related items. Add doodles, arrows, and handwritten notes in English. Fun and personal aesthetic.
\`\`\`

![취미 프롬프트](https://i.postimg.cc/jdPttgVj/image.png)
*취미 활동 사진 업로드*

![취미 무드보드](https://i.postimg.cc/1t81TMcs/image.png)
*개성 넘치는 라이프스타일 보드*

## 프로 팁 공유 💡

제가 여러 번 테스트하면서 발견한 꿀팁들이에요:

### 1. 사진 선택이 절반이다
- 배경이 깔끔한 사진일수록 결과물이 깔끔해요
- 전신샷이나 반신샷이 가장 좋아요
- 너무 어두운 사진은 피하세요

### 2. 프롬프트 커스터마이징
- 영어로 작성하는 게 인식률이 좋아요
- "handwritten notes", "doodles", "arrows" 같은 키워드를 넣으면 더 감성적이 돼요
- 색상 키워드(pastel, vibrant, monochrome)를 추가하면 분위기 조절 가능

### 3. 활용 방법
- 인스타그램 피드 포스팅
- 블로그 썸네일
- 포트폴리오 표지
- 비전보드 만들기
- 선물용 포스터 제작

## 왜 나노바나나인가?

솔직히 미드저니나 DALL-E 3도 좋지만, 나노바나나는:
- **완전 무료** (크레딧 시스템 없음)
- 한국어 인터페이스 지원
- 빠른 생성 속도
- 직관적인 UI

특히 무드보드 스타일은 나노바나나가 진짜 잘 만들어요. 콜라주 느낌이 자연스럽고, 손글씨 효과도 리얼해요.

## 마치며

"내 사진 한 장으로 이런 게 가능하다고?" 싶으시죠? 저도 처음엔 반신반의했는데, 결과물 보고 깜짝 놀랐어요. 

특히 인스타그램이나 블로그 운영하시는 분들, 포트폴리오 만드시는 분들한테는 진짜 유용할 것 같아요. 10분이면 프로 디자이너가 만든 것 같은 무드보드를 뚝딱 만들 수 있으니까요.

여러분도 한번 시도해보세요! 그리고 만든 작품은 댓글로 공유해주시면 좋겠어요. 서로의 창작물을 보는 것도 재밌잖아요? 😊

---

## 🔗 관련 게시글 추천

- [Google Whisk AI 완전 정복 가이드: 초보자도 10분이면 마스터!](https://devcom.kr/main/posts/cmeic87u10001u8l8teqimfqm)
- [🍌 화제의 모델 나노바나나 무료로 쓰는법 총정리 !!](https://devcom.kr/main/posts/cmet9gzn10001u8z4d6hyqo90)

#AI #나노바나나 #무드보드 #인스타그램 #이미지생성 #무료AI #콜라주`

    const post = await prisma.mainPost.create({
      data: {
        title: '이 프롬프트 하나면 내 사진이 인스타 갬성 무드보드로 변합니다',
        slug: 'transform-photo-to-instagram-moodboard-nanobanana',
        content,
        excerpt:
          '나노바나나 AI로 내 사진을 순식간에 인스타 갬성 무드보드로 변환하는 방법! 10가지 실제 예시와 프롬프트 공개',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스 카테고리
        viewCount: 0,
        metaTitle:
          '나노바나나로 인스타 갬성 무드보드 만들기 - 10가지 프롬프트 공개',
        metaDescription:
          '내 사진 하나와 프롬프트만으로 프로페셔널한 무드보드를 만드는 방법. 여행, 요리, 패션 등 10가지 스타일별 실제 예시와 프롬프트 공개',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            globalRole: true,
          },
        },
        category: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    })

    // 태그 연결
    const tagNames = [
      'AI',
      '나노바나나',
      '무드보드',
      '인스타그램',
      '이미지생성',
      '무료AI',
      '콜라주',
    ]

    for (const tagName of tagNames) {
      // 태그 찾기 또는 생성
      const tag = await prisma.mainTag.upsert({
        where: { name: tagName },
        update: {},
        create: {
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-'),
        },
      })

      // MainPostTag 연결 생성
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })

      // 태그의 postCount 증가
      await prisma.mainTag.update({
        where: { id: tag.id },
        data: {
          postCount: {
            increment: 1,
          },
        },
      })
    }

    console.log('✅ 무드보드 변환 블로그 글이 성공적으로 생성되었습니다!')
    console.log('📝 글 제목:', post.title)
    console.log('🔗 URL: https://devcom.kr/main/posts/' + post.id)
    console.log('👤 작성자:', post.author.name)
    console.log('📂 카테고리:', post.category.name)
    console.log('🏷️ 태그:', tagNames.join(', '))
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMoodboardPost()
