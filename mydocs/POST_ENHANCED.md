# 🎨 자연스러운 블로그 글쓰기 가이드

## 🎯 핵심 원칙

**AI가 써도 사람이 쓴 것 같은 자연스러운 글 작성**

## ✅ 자연스러운 글쓰기 핵심

### 피해야 할 것들
- ❌ "여러분", "혹시~" 같은 뻔한 호명
- ❌ 1,2,3 기계적 나열
- ❌ "따라서", "그러므로" 같은 딱딱한 연결어
- ❌ 과도한 이모지와 구조화

### 자연스럽게 쓰는 법
- ✅ "사실", "솔직히", "그런데" 같은 자연스러운 시작
- ✅ 개인적 경험과 감정 섞기 ("써보니까", "생각보다")
- ✅ 구체적 사례와 숫자로 신뢰감 주기
- ✅ 적절한 문단 띄우기로 호흡 조절

### 문단 간격
- 주제 전환 시 빈 줄 1-2개
- 모바일 가독성 고려
- 제목과 본문 사이 충분한 여백

## 📝 글 구조 템플릿

```markdown
# [궁금증 유발하는 제목]

사실 처음 [주제]를 접했을 때는 '또 그런 거겠지' 싶었습니다.

그런데 실제로 알아보니까...

## 실제로는 어떤지

[개인적 경험과 구체적 수치를 섞어서 설명]

기존에는 이렇게 했는데:
- [구체적 문제점]
- [수치나 상황으로 표현]

새로운 방식으로는:
- [개선된 점]
- [실제 경험 기반]

## 솔직한 평가

물론 완벽하지는 않아요.

**좋았던 점:**
- [구체적 장점과 수치]

**아쉬운 점:**
- [솔직한 단점]

개인적으로는 [솔직한 의견].
특히 [특정 대상]에게는 추천할 만합니다.

여러분은 어떻게 보시나요?
```

## 🏷️ 태그 색상 가이드

```typescript
const TAG_COLORS = {
  // AI/ML
  AI: '#8b5cf6',
  ChatGPT: '#10a37f',
  Claude: '#d97706',
  
  // 프로그래밍 언어
  JavaScript: '#f59e0b',
  TypeScript: '#3b82f6',
  Python: '#059669',
  
  // Frontend
  React: '#06b6d4',
  'Next.js': '#000000',
  Vue: '#059669',
  
  // Backend
  SpringBoot: '#059669',
  Django: '#059669',
  Express: '#6b7280',
  
  // 카테고리
  '트렌드': '#f59e0b',
  '튜토리얼': '#8b5cf6',
  '경험담': '#06b6d4',
}
```

## 📋 카테고리 ID 매핑

```typescript
const CATEGORIES = {
  'AI뉴스': 'cme5a3ysr0002u8wwwmcbgc7z',
  'Frontend': 'cmdrfyb5f0000u8fsih05gxfk',
  'Backend': 'cmdrfybll0002u8fseh2edmgf',
  'DevOps': 'cmdrfycij0004u8fs8x3j1k2l',
  'Database': 'cmdrfydgn0006u8fs7h9p4m5n',
  '오픈소스': 'cme5a4pqr0004u8ww2k5m7x8y',
  '바이브코딩': 'cme5a5vyt0003u8ww9aoazx9f'
}
```

## 🛠️ 스크립트 템플릿

```typescript
import { prisma } from '@/lib/core/prisma'

const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

async function createPost() {
  const content = `# [자연스러운 제목]

사실 처음 이 소식을 봤을 때는...

[자연스러운 본문]
`

  try {
    const post = await prisma.mainPost.create({
      data: {
        title: '[제목]',
        slug: 'unique-slug',
        content,
        excerpt: '[자연스러운 요약]',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: '[카테고리 ID]',
        viewCount: 0,
        metaTitle: '[SEO 제목]',
        metaDescription: '[메타 설명]',
      },
    })

    // 태그 생성 및 연결
    const tags = [
      { name: 'AI', slug: 'ai', color: '#8b5cf6' },
    ]

    for (const tagData of tags) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagData.name }
      })

      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            color: tagData.color,
            postCount: 1,
          }
        })
      } else {
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } }
        })
      }

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        }
      })
    }

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
```

## 📸 이미지 처리

1. **초안 작성**: 텍스트로만 완성
2. **이미지 요청**: 필요한 이미지 구체적으로 요청
3. **최종 완성**: 이미지 삽입하여 마무리

---

**핵심: 자연스럽게, 솔직하게, 경험 기반으로 작성**