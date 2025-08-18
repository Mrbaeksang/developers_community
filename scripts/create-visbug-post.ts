import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// Frontend 카테고리 ID
const FRONTEND_CATEGORY_ID = 'cmdrfyb5f0000u8fsih05gxfk'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎨 VisBug: 브라우저에서 바로 디자인하는 마법 같은 도구

## 🎯 한 줄 요약
**VisBug는 코드 한 줄 건드리지 않고 브라우저에서 바로 웹사이트를 시각적으로 편집할 수 있게 해주는 무료 크롬 익스텐션입니다!**

![VisBug 로고](https://lh3.googleusercontent.com/2RZuDUyeQUWpXQ4bIjiUD7WgfVVHF9l_KFHGpKNRre_LlU0QpYQHJlFHmGtXKfsKARIOZe9YCEocsRg_O3Hwh7pZEF4=s1280-w1280-h800)

## 🤔 이런 경험 있으신가요?

웹사이트를 보다가 이런 생각 해보신 적 있나요?

- **"아, 이 버튼 색깔만 바꿔보면 어떨까?"** 🎨
- **"여백이 좀 답답한데... 간격 조정해보고 싶다"** 📐
- **"폰트 크기가 너무 작은데 키워보면?"** 📝
- **"이 요소들 정렬이 안 맞는 것 같은데..."** 🔧

개발자 도구를 열어서 CSS를 수정하기는 너무 번거롭고, 디자인 툴로 다시 그리기는 시간이 아깝죠?

**VisBug가 이 모든 걸 클릭 몇 번으로 해결해드립니다!** ✨

## 💡 VisBug란 무엇인가요?

VisBug는 Google의 개발자 애드보케이트 Adam Argyle이 만든 오픈소스 브라우저 익스텐션입니다. 

한마디로 정의하면:
> **"웹페이지를 Figma처럼 편집할 수 있게 해주는 도구"**

### 🎯 핵심 특징
- ✅ **무료 & 오픈소스**: 완전 무료로 사용 가능
- ✅ **설치만 하면 끝**: 복잡한 설정 없음
- ✅ **비파괴적 편집**: 원본 코드는 그대로 유지
- ✅ **즉시 미리보기**: 실시간으로 변경사항 확인

## 🚀 5초 만에 시작하기

### Step 1: 설치
1. Chrome 웹 스토어에서 "VisBug" 검색
2. "Chrome에 추가" 클릭
3. 끝! 🎉

### Step 2: 실행
1. 아무 웹사이트 방문
2. 브라우저 우측 상단 VisBug 아이콘 클릭
3. 보라색 툴바가 나타나면 준비 완료!

## 📖 자연스럽게 익히는 VisBug 사용법

### 🎯 1. 요소 선택하기 - "그냥 클릭하세요"

VisBug를 켜면 마우스 커서가 선택 도구로 바뀝니다. 웹페이지의 아무 요소나 마우스를 올려보세요. 

- 마우스를 올리면 → 요소가 하이라이트됩니다
- 클릭하면 → 선택됩니다
- 다중 선택하려면 → Shift 누르고 클릭

**💡 팁**: "이 버튼 수정하고 싶어"라고 생각나는 순간, 그냥 클릭하면 됩니다!

### 🎨 2. 색상 바꾸기 - "색상 도구 선택 후 클릭"

툴바에서 물방울 모양 아이콘(색상 도구)을 선택하세요.

1. 바꾸고 싶은 요소 클릭
2. 색상 선택기가 나타남
3. 원하는 색 선택
4. 즉시 적용!

**실제 사용 예시**:
"이 파란 버튼을 초록색으로 바꿔보고 싶어요"
→ 색상 도구 클릭 → 버튼 클릭 → 초록색 선택 → 완료!

### 📐 3. 간격 조정하기 - "드래그만 하면 됩니다"

패딩/마진 도구를 선택하면 요소 주변에 핸들이 나타납니다.

- **안쪽 여백(패딩)**: 요소 안쪽 핸들 드래그
- **바깥 여백(마진)**: 요소 바깥쪽 핸들 드래그
- **숫자로 입력**: 핸들 클릭 후 숫자 입력

**실제 사용 예시**:
"이 텍스트가 너무 빽빽해 보여요"
→ 패딩 도구 선택 → 텍스트 박스 클릭 → 안쪽 핸들을 바깥으로 드래그 → 숨통이 트입니다!

### ✏️ 4. 텍스트 수정하기 - "더블클릭으로 편집"

텍스트 도구(T 아이콘)를 선택하세요.

1. 수정할 텍스트 클릭
2. 바로 타이핑 시작
3. Enter로 저장

**실제 사용 예시**:
"제목을 좀 더 임팩트 있게 바꿔보고 싶어요"
→ 텍스트 도구 → 제목 클릭 → "평범한 제목" → "🚀 놀라운 제목!" → Enter

### 📏 5. 정렬하기 - "가이드라인이 알아서"

이동 도구를 선택하고 요소를 드래그하면:
- 자동으로 정렬 가이드라인이 나타남
- 다른 요소와 자석처럼 달라붙음
- 픽셀 단위로 미세 조정 가능 (화살표 키)

**실제 사용 예시**:
"이미지랑 텍스트가 삐뚤어 보여요"
→ 이동 도구 → 이미지 드래그 → 빨간 가이드라인이 나타나면 놓기 → 완벽 정렬!

### 🔍 6. 요소 검사하기 - "호버만 해도 정보가"

검사 도구를 선택하면 마우스를 올리는 것만으로도:
- 폰트 종류, 크기
- 색상 코드
- 크기 (너비 x 높이)
- CSS 속성들

이 모든 정보가 툴팁으로 표시됩니다!

## 🎮 실전 활용 시나리오

### 시나리오 1: 클라이언트 미팅에서
**상황**: "이 버튼을 좀 더 크게 만들고 색을 바꿔주세요"

**VisBug 활용**:
1. 화면 공유 상태에서 VisBug 실행
2. 실시간으로 버튼 크기와 색상 조정
3. 클라이언트: "아 딱 이거예요!"
4. 스크린샷 찍어서 디자이너에게 전달

### 시나리오 2: 디버깅할 때
**상황**: "왜 이 요소가 안 보이지?"

**VisBug 활용**:
1. 검사 도구로 요소 확인
2. z-index가 -1로 설정되어 있음 발견
3. 즉시 수정해서 테스트
4. 문제 해결!

### 시나리오 3: 디자인 A/B 테스트
**상황**: "CTA 버튼 색상 어떤 게 나을까?"

**VisBug 활용**:
1. 페이지 복제 (새 탭에서 열기)
2. 각각 다른 색상 적용
3. 팀원들과 비교 검토
4. 최종 결정

## 🛠️ 프로처럼 쓰는 고급 팁

### 💡 단축키 마스터하기
- **Alt + 클릭**: 요소 뒤의 요소 선택
- **Cmd/Ctrl + Z**: 실행 취소
- **Shift + 드래그**: 비율 유지하며 크기 조정
- **화살표 키**: 1px 단위 미세 조정
- **Shift + 화살표**: 10px 단위 조정

### 🎯 자주 쓰는 기능 조합
1. **완벽한 카드 레이아웃**:
   - 정렬 도구 → 모든 카드 선택 → 균등 배치

2. **일관된 색상 스킴**:
   - 색상 도구 → Shift로 다중 선택 → 한 번에 색상 적용

3. **반응형 테스트**:
   - 브라우저 창 크기 조절 → VisBug로 실시간 조정

## ⚡ 장단점 정리

### ✅ 장점
- **학습 곡선 제로**: 5분이면 마스터
- **비파괴적**: 원본 코드 안전
- **실시간 피드백**: 즉시 결과 확인
- **무료**: 모든 기능 무료
- **가벼움**: 리소스 거의 안 씀

### ⚠️ 한계점
- Chrome/Edge 브라우저만 지원
- 변경사항 저장 불가 (스크린샷으로 기록)
- 복잡한 애니메이션 편집 불가
- 모바일 브라우저 미지원

## 🎯 이런 분들께 강력 추천!

- ✅ **프론트엔드 개발자**: 빠른 프로토타이핑과 디버깅
- ✅ **UI/UX 디자이너**: 실제 환경에서 디자인 테스트
- ✅ **PM/기획자**: 개발자 없이도 UI 제안 가능
- ✅ **QA 엔지니어**: 시각적 버그 리포팅
- ✅ **누구나**: 웹사이트 커스터마이징하고 싶은 모든 분

## 💭 마무리

VisBug는 "코드와 디자인 사이의 장벽을 허무는 도구"입니다.

개발자는 디자인을 빠르게 실험할 수 있고, 디자이너는 코드 없이 웹을 편집할 수 있습니다. 이것이 바로 VisBug가 50만 명 이상의 사용자에게 사랑받는 이유입니다.

**지금 바로 설치하고 여러분의 웹 경험을 업그레이드하세요!** 🚀

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

### 🔗 참고 자료
- [VisBug Chrome 웹스토어](https://chrome.google.com/webstore/detail/visbug)
- [VisBug 공식 웹사이트](https://visbug.web.app)
- [Adam Argyle Twitter](https://twitter.com/argyleink)`

  try {
    console.log('🎯 VisBug 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title: '🎨 VisBug: 브라우저에서 바로 디자인하는 마법 같은 도구',
        slug: 'visbug-browser-design-tool-guide-2025',
        content,
        excerpt:
          'VisBug는 코드 없이 브라우저에서 바로 웹사이트를 시각적으로 편집할 수 있는 무료 크롬 익스텐션입니다. 색상, 간격, 텍스트, 정렬을 클릭 몇 번으로 수정할 수 있어 개발자와 디자이너 모두에게 필수 도구입니다.',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: FRONTEND_CATEGORY_ID,
        viewCount: getRandomViewCount(100, 250),
        metaTitle: 'VisBug 완벽 가이드 - 브라우저에서 바로 디자인하기',
        metaDescription:
          'VisBug 크롬 익스텐션으로 코드 없이 웹사이트를 실시간으로 편집하는 방법. 설치부터 고급 활용법까지 완벽 가이드',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      'VisBug',
      'Chrome Extension',
      '프론트엔드',
      '디자인 도구',
      'UI/UX',
      '웹 디자인',
      '개발 도구',
      '디버깅',
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagName of tagNames) {
      // 태그가 이미 존재하는지 확인
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagName },
      })

      // 태그가 없으면 생성
      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
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

    console.log(`🏷️ 태그 처리 완료: ${tagNames.join(', ')}`)

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
      console.log('🎉 VisBug 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
