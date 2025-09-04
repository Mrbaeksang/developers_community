import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# "그림 그려줘"가 아니라 "이야기해줘" - Gemini가 알려주는 AI 이미지 생성의 비밀

![AI 이미지 생성의 새로운 패러다임](https://i.postimg.cc/wT3ch4XP/image.png)

솔직히 처음 AI 이미지 생성 도구 써봤을 때 실망했던 기억이 있습니다.


"고양이 그려줘"라고 했더니 나온 건 뭔가 어색한 고양이... 


그런데 구글이 최근 공개한 Gemini 2.5 Flash 이미지 생성 가이드를 보니까, 제가 완전히 잘못 접근하고 있었더라고요.


## 🤔 AI에게 키워드 던지기? 그게 문제였어요

개발자분들이나 디자이너분들이라면 이런 경험 있으실 거예요.


AI 이미지 생성 도구에 "modern office, minimalist, clean" 이런 식으로 키워드만 나열했는데, 결과물이 영 마음에 안 들었던 경험 말이에요.


구글 엔지니어들이 이번에 공개한 가이드에서 딱 집어서 말하더라고요. **"키워드 나열하지 마세요. 이야기를 들려주세요"**라고.


실제로 이렇게 바꿔봤더니 결과가 완전히 달라집니다:

### ❌ 기존 방식 (키워드 나열):
\`\`\`
cat, window, sunlight, cute, orange
\`\`\`

![키워드 나열 방식 결과](https://i.postimg.cc/Njq95dpR/image.png)

### ✅ Gemini 추천 방식 (이야기하듯):
\`\`\`
햇살이 따스하게 비치는 창가에서 오렌지색 고양이가 
꾸벅꾸벅 졸고 있는 모습. 창밖으로는 봄날의 정원이 보이고,
고양이 수염이 햇빛에 반짝이고 있어.
\`\`\`

![스토리텔링 방식 결과](https://i.postimg.cc/P5yw9mQZ/image.png)


차이가 확 느껴지시나요?


## 💡 실제로 써보니 이게 진짜 달라요

### Gemini가 알려준 "대화하듯 프롬프트 쓰기"

처음엔 '그게 그거 아닌가' 싶었는데, 막상 적용해보니까 정말 다르더라고요.


예를 들어 회사 프레젠테이션용 이미지가 필요했는데:

**Before (제가 쓴 프롬프트):**
- startup office
- people working
- modern style
- bright

![기존 프롬프트 결과](https://i.postimg.cc/wT6xPnff/image.png)

**After (가이드 보고 수정한 버전):**
\`\`\`
스타트업 사무실의 오후 3시쯤 풍경을 보여주고 싶어요.
개발자들이 스탠딩 데스크에서 편안하게 협업하고 있고,
큰 창문으로 자연광이 들어와서 공간 전체가 밝고 활기찬 느낌.
맥북과 커피잔이 자연스럽게 놓여있고, 
화이트보드에는 아이디어 스케치가 그려져 있으면 좋겠어요.
\`\`\`

![개선된 프롬프트 결과](https://i.postimg.cc/Z5nbYph6/image.png)


결과물 퀄리티가 완전히 달라집니다. 진짜로요.


### 카메라 용어 쓰니까 프로 사진작가 된 기분

이 부분이 특히 인상적이었는데, Gemini는 사진 전문 용어를 이해한다고 해요.

- **"35mm 렌즈로 찍은 것처럼"** → 자연스러운 원근감
- **"골든 아워의 빛"** → 따뜻한 노을빛 연출
- **"얕은 피사계 심도"** → 배경 흐림 효과
- **"버드 아이 뷰"** → 위에서 내려다본 구도


저처럼 사진 전문 지식이 없어도, 이런 용어 몇 개만 알아두면 훨씬 전문적인 이미지를 만들 수 있더라고요.


## 📊 실제 비교: 같은 주제, 다른 접근

제가 직접 테스트해본 결과를 공유해볼게요.


### 테스트 1: 제품 사진 만들기

**일반적인 접근:**
\`\`\`
coffee mug, white background, product photo
\`\`\`

![일반적인 프롬프트 결과](https://i.postimg.cc/5NN1pLyD/image.png)

**Gemini 스타일 접근:**
\`\`\`
깨끗한 스튜디오에서 촬영한 세라믹 커피 머그.
순백색 배경에 부드러운 그림자가 떨어지고,
머그 표면의 질감이 살짝 보이도록 측면 조명 사용.
제품 카탈로그에 실릴 전문적인 느낌으로.
\`\`\`

![Gemini 스타일 결과](https://i.postimg.cc/Jnfx0bg0/image.png)


### 테스트 2: 캐릭터 일관성 유지하기

이게 정말 신기했는데, Gemini는 캐릭터를 계속 수정하면서도 일관성을 유지할 수 있다고 해요.

**1단계: "빨간 후드티를 입은 20대 개발자 캐릭터"**

![캐릭터 생성 1단계](https://i.postimg.cc/W3TrHXQM/image.png)

**2단계: "같은 캐릭터가 카페에서 노트북 작업 중"**

![캐릭터 생성 2단계](https://i.postimg.cc/ZqKvPC3c/image.png)

**3단계: "이 캐릭터가 프레젠테이션하는 모습"**

![캐릭터 생성 3단계](https://i.postimg.cc/cH33CPfy/image.png)


대화하듯이 계속 요청하면 같은 캐릭터로 다양한 상황을 만들 수 있더라고요.


## 🚀 당장 써먹을 수 있는 실전 팁

### 스타일별 프롬프트 템플릿

**사실적인 사진 스타일:**
\`\`\`
[상황 설명] + "DSLR 카메라로 촬영한 것처럼" + [조명 설명]
\`\`\`

**일러스트 스타일:**
\`\`\`
[장면 설명] + "수채화 느낌으로" + [색감 설명]
\`\`\`

**UI/UX 목업:**
\`\`\`
[화면 설명] + "깔끔한 플랫 디자인" + "파스텔톤 색상"
\`\`\`


### 자주 하는 실수들

처음에 저도 이런 실수 많이 했어요:

- **텍스트 넣기 욕심내기** - 아직 AI가 긴 문장은 잘 못 써요
- **한 번에 완벽 기대하기** - 3-4번은 수정해야 원하는 게 나와요
- **너무 복잡한 요구** - 단순하게 시작해서 점점 추가하는 게 낫더라고요


## 🤔 결론: AI와 대화하는 시대가 왔네요

개인적으로는 이번 가이드 보면서 느낀 게, AI 도구를 쓰는 것도 일종의 '대화 스킬'이 필요하다는 거예요.


명령하듯이 키워드 던지는 게 아니라, 친구한테 설명하듯이 이야기하니까 결과물이 확실히 좋아지더라고요.


특히 디자이너가 아닌 개발자분들이나, 프레젠테이션 자료 만드느라 고생하시는 분들한테는 정말 유용할 것 같아요.


**Gemini 2.5 Flash의 핵심 기능들:**
- 텍스트를 이미지로 변환 (Text-to-Image)
- 이미지 편집 (특정 부분 수정/제거)
- 스타일 전환 (사진 ↔ 일러스트)
- 여러 이미지 합성
- 캐릭터 일관성 유지


무엇보다 중요한 건, **"AI와 대화하듯이"** 소통하는 거예요. 


여러분은 AI 이미지 생성 도구 써보셨나요? 어떤 팁이 있으시면 댓글로 공유해주세요!`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title:
          '"그림 그려줘"가 아니라 "이야기해줘" - Gemini가 알려주는 AI 이미지 생성의 비밀',
        slug: 'gemini-ai-image-generation-storytelling-guide',
        content,
        excerpt:
          '솔직히 AI 이미지 생성 도구에 실망했었는데, 구글 Gemini 가이드 보고 완전히 생각이 바뀌었어요. 키워드 나열이 아니라 이야기를 들려주듯 프롬프트를 쓰니까 결과물이 확 달라지더라고요.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: 'cme5a3ysr0002u8wwwmcbgc7z', // AI뉴스
        viewCount: getRandomViewCount(300, 500),
        metaTitle:
          'Gemini 2.5 Flash 이미지 생성 가이드 - AI와 대화하듯 프롬프트 작성하기',
        metaDescription:
          'Google Gemini가 공개한 AI 이미지 생성의 비밀. 키워드 나열이 아닌 스토리텔링으로 원하는 이미지를 만드는 방법을 실제 예시와 함께 알아봅니다.',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'Gemini', slug: 'gemini', color: '#059669' },
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
      { name: '이미지생성', slug: 'image-generation', color: '#06b6d4' },
      { name: 'Google', slug: 'google', color: '#0ea5e9' },
      { name: '프롬프트', slug: 'prompt', color: '#f59e0b' },
      { name: '가이드', slug: 'guide', color: '#7c3aed' },
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

    console.log('✅ AI 이미지 생성 가이드 게시글이 성공적으로 생성되었습니다!')
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 슬러그: ${post.slug}`)
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
