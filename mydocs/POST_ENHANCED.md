# 🤖 AI 에이전트를 위한 고품질 게시글 생성 가이드 (Enhanced)

## 🎯 작업 개요

AI 에이전트가 **남녀노소 누구나 쉽게 읽을 수 있는 고품질 게시글**을 자동으로 작성할 수 있도록 하는 명확한 지시문입니다.

## 🚨 절대 준수 사항 (CRITICAL)

**처음 보는 AI 에이전트라도 100% 성공할 수 있도록 다음을 반드시 따르세요:**

1. **절대 추측하지 말 것** - 모든 정보는 아래 문서에서 정확히 복사
2. **순서대로 진행** - 단계를 건너뛰면 100% 실패
3. **스키마 필드 완전 활용** - MainPost 테이블의 모든 필드 사용

## 📚 가독성 높은 콘텐츠 작성 원칙

### 🎨 시각적 요소 활용 가이드

**이미지 삽입 규칙:**
```markdown
# 외부 이미지 (Unsplash, Pexels 등)
![AI가 웹사이트를 생성하는 모습](https://images.unsplash.com/photo-xxx)

# 섹션 구분용 이미지
![구분선 역할의 일러스트](https://example.com/divider.jpg)
```

**🎯 이미지 준비 방법 (신규 워크플로우!):**

### AI 에이전트의 이미지 처리 프로세스:
1. **초안 작성 먼저** - 플레이스홀더로 전체 콘텐츠 구성
2. **필요 이미지 목록 제시** - 사용자에게 구체적으로 요청
3. **사용자 제공 이미지로 교체** - 최종 완성

### 🔄 새로운 워크플로우:

**Step 1: AI가 초안 작성**
```markdown
# 제목
![메인 이미지 필요](https://picsum.photos/1200/600?random=1)
<!-- 필요: DeepSeek V3.1 로고 또는 AI 관련 메인 이미지 -->

## 섹션 1
![기능 설명 이미지 필요](https://picsum.photos/1200/600?random=2)
<!-- 필요: 성능 비교 차트 또는 벤치마크 스크린샷 -->
```

**Step 2: 사용자에게 이미지 요청**
```
📸 필요한 이미지 목록:
1. 메인 이미지: DeepSeek V3.1 관련 시각 자료
2. 성능 비교: 벤치마크 차트나 그래프
3. 사용 화면: 실제 사용 스크린샷
4. 로고/아이콘: 브랜드 이미지 (선택)
```

**Step 3: 사용자 제공 이미지로 교체**
- 사용자가 제공한 URL을 플레이스홀더와 교체
- curl로 검증 후 적용
- 제공되지 않은 이미지는 Picsum 유지 또는 제거

**1. Unsplash (권장 - 가장 안정적):**
```typescript
// ✅ 올바른 Unsplash 이미지 URL 형식:
https://images.unsplash.com/photo-[ID]?w=1200&h=600&fit=crop
https://images.unsplash.com/file-[ID]?w=1200&dpr=2&auto=format&fit=crop&q=60

// 예시:
https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=600&fit=crop
```

**2. Dribbble (디자인 관련 이미지):**
```typescript
// ✅ Dribbble CDN URL 형식:
https://cdn.dribbble.com/userupload/[ID]/file/original-[hash].png?resize=1200x853

// 예시:
https://cdn.dribbble.com/userupload/12868664/file/original-c74947f595a439ef558e488f6a935a02.png?resize=1200x853
```

**3. Lorem Picsum (플레이스홀더용):**
```markdown
![임시 이미지](https://picsum.photos/1200/600?random=1)
![임시 이미지2](https://picsum.photos/1200/600?random=2)
// random 파라미터로 매번 다른 이미지
```

**❌ 사용하면 안 되는 이미지 소스:**
- LinkedIn (403 Forbidden 빈번)
- 개인 블로그 (불안정)
- 작은 회사 사이트 (CORS 문제)
- Base64 인코딩 이미지 (너무 큼)

**⚠️ 이미지 검증 필수 단계:**
```bash
# 반드시 curl로 200 OK 확인
curl -I [이미지URL]

# 403, 404, 500 등의 에러가 나오면 절대 사용 금지!
```

### 📍 이미지 배치 전략

```markdown
# 제목

## 🎯 도입부
[흥미로운 내용으로 시작]

![주제를 대표하는 메인 이미지](이미지URL)

## 💡 핵심 내용 1
[설명 텍스트]

![개념을 설명하는 도표나 스크린샷](이미지URL)

## 🚀 핵심 내용 2
[설명 텍스트]

### 실제 사례
![실제 화면이나 결과물 스크린샷](이미지URL)
```

### 🌈 이모지 활용 가이드

**섹션별 추천 이모지:**
- **도입부**: 🎯 🚀 💡 ✨ 
- **핵심 설명**: 📌 🔍 📊 💻
- **장점/특징**: ✅ 👍 🎉 🌟
- **주의사항**: ⚠️ ❗ 🔴 ⛔
- **팁/꿀팁**: 💡 🔥 🎯 📝
- **마무리**: 🎉 🚀 ✨ 🙌

### 📝 텍스트 가독성 원칙

**문장 작성 규칙:**
- **짧은 문장**: 한 문장은 최대 2줄 이내
- **단락 분리**: 3-4문장마다 단락 나누기
- **굵은 글씨**: 핵심 키워드는 **굵게** 표시
- **리스트 활용**: 나열할 때는 번호나 불릿 포인트 사용

**대화체 활용:**
```markdown
❌ 나쁜 예: "사용자는 이 기능을 활용하여 효율성을 증대시킬 수 있습니다."
✅ 좋은 예: "이 기능을 쓰면 작업 시간이 절반으로 줄어들어요!"
```

### 🎯 독자 친화적 구조

```markdown
# 제목 (호기심 자극)

## 🤔 이런 고민 있으신가요?
- 고민 1
- 고민 2
- 고민 3

![공감가는 상황 이미지]

## 💡 해결책은 바로 이것!
[핵심 내용 설명]

![솔루션 설명 이미지]

## 🎯 실제로 이렇게 사용하세요

### 1단계: 시작하기
![단계별 스크린샷]

### 2단계: 설정하기
![설정 화면]

### 3단계: 완성!
![결과물]

## ⚡ 핵심 포인트 정리
- 포인트 1
- 포인트 2
- 포인트 3

## 🚀 지금 바로 시작하세요!
[행동 유도 문구]
```

## 🔑 필수 상수 정보

**모든 스크립트에서 사용할 상수 (복사해서 사용):**

```typescript
import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'  // 관리자 ID
const ADMIN_ROLE = 'ADMIN'                         // GlobalRole.ADMIN

// 랜덤 조회수 생성 함수
const getRandomViewCount = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min
```

## 🏷️ 태그 색상 가이드

**AI 에이전트는 태그 생성 시 반드시 색상을 포함해야 합니다!**

### 🎨 기본 색상 팔레트

```typescript
// 주제별 추천 색상 (복사해서 사용)
const TAG_COLORS = {
  // AI/ML 관련
  AI: '#8b5cf6',          // 보라색 - AI, 머신러닝, 딥러닝
  ChatGPT: '#10a37f',     // 초록색 - ChatGPT, OpenAI
  Claude: '#d97706',      // 주황색 - Claude, Anthropic
  
  // 프로그래밍 언어
  JavaScript: '#f59e0b',  // 황색 - JavaScript, Node.js
  TypeScript: '#3b82f6',  // 파란색 - TypeScript
  Python: '#059669',      // 녹색 - Python, Django
  Kotlin: '#8b5cf6',      // 보라색 - Kotlin, Android
  Java: '#dc2626',        // 빨간색 - Java, Spring
  
  // 프레임워크/라이브러리
  React: '#06b6d4',       // 청록색 - React, Next.js
  Vue: '#059669',         // 녹색 - Vue.js, Nuxt
  Angular: '#dc2626',     // 빨간색 - Angular
  SpringBoot: '#059669',  // 녹색 - Spring Boot
  
  // 개발 도구/플랫폼
  Docker: '#0ea5e9',      // 하늘색 - Docker, 컨테이너
  Kubernetes: '#3b82f6',  // 파란색 - K8s, 오케스트레이션
  AWS: '#f59e0b',         // 황색 - AWS, 클라우드
  Vercel: '#000000',      // 검정색 - Vercel, 배포
  
  // 개발 방법론/테스팅
  TDD: '#dc2626',         // 빨간색 - TDD, 테스트
  BDD: '#059669',         // 녹색 - BDD, 행동 주도
  Agile: '#8b5cf6',       // 보라색 - 애자일, 스크럼
  
  // 데이터베이스
  MySQL: '#0ea5e9',       // 하늘색 - MySQL
  PostgreSQL: '#3b82f6',  // 파란색 - PostgreSQL
  MongoDB: '#059669',     // 녹색 - MongoDB, NoSQL
  Redis: '#dc2626',       // 빨간색 - Redis, 캐시
  
  // 카테고리별
  트렌드: '#f59e0b',       // 황색 - 트렌드, 뉴스
  '바이브 코딩': '#06b6d4', // 청록색 - 바이브 코딩
  튜토리얼: '#8b5cf6',     // 보라색 - 튜토리얼, 가이드
  리뷰: '#059669',        // 녹색 - 리뷰, 분석
  성능: '#dc2626',        // 빨간색 - 성능, 최적화
  보안: '#7c2d12',        // 갈색 - 보안, 인증
  
  // 기본 색상
  기본: '#6b7280',        // 회색 - 기타, 일반
}
```

### 🎨 카테고리별 추천 태그 조합

```typescript
// 예시: AI뉴스 카테고리
const AI_NEWS_TAGS = [
  { name: 'AI', slug: 'ai', color: '#8b5cf6' },
  { name: 'ChatGPT', slug: 'chatgpt', color: '#10a37f' },
  { name: '트렌드', slug: 'trend', color: '#f59e0b' },
  { name: '딥러닝', slug: 'deep-learning', color: '#8b5cf6' },
]

// 예시: Backend 카테고리  
const BACKEND_TAGS = [
  { name: 'SpringBoot', slug: 'springboot', color: '#059669' },
  { name: 'Kotlin', slug: 'kotlin', color: '#8b5cf6' },
  { name: 'MySQL', slug: 'mysql', color: '#0ea5e9' },
  { name: 'Docker', slug: 'docker', color: '#0ea5e9' },
]

// 예시: Frontend 카테고리
const FRONTEND_TAGS = [
  { name: 'React', slug: 'react', color: '#06b6d4' },
  { name: 'TypeScript', slug: 'typescript', color: '#3b82f6' },
  { name: 'Next.js', slug: 'nextjs', color: '#000000' },
  { name: 'Tailwind', slug: 'tailwind', color: '#06b6d4' },
]
```

### ⚠️ 태그 색상 필수 규칙

1. **모든 태그에 색상 필수**: `color` 필드 누락 시 UI에서 색상 표시 안됨
2. **일관성 유지**: 동일한 주제는 동일한 색상 사용
3. **가독성 고려**: 배경과 대비되는 색상 선택
4. **HEX 코드 사용**: `#rrggbb` 형식 (예: `#8b5cf6`)
5. **최대 5개 제한**: 게시글당 태그는 최대 5개까지

**카테고리별 ID 매핑 (전체 목록):**

```typescript
const CATEGORIES = {
  '자유게시판': {
    id: 'cmdrfyblf0001u8fseet3uxau',
    slug: 'free',
    viewRange: { min: 200, max: 400 }
  },
  'Q&A': {
    id: 'cmdrfyblq0003u8fsdxrl27g9',
    slug: 'qna',
    viewRange: { min: 200, max: 400 }
  },
  '바이브코딩': {
    id: 'cme5a5vyt0003u8ww9aoazx9f',
    slug: 'vibecoding',
    viewRange: { min: 300, max: 500 }
  },
  'AI뉴스': {
    id: 'cme5a3ysr0002u8wwwmcbgc7z',
    slug: 'ai_news',
    viewRange: { min: 300, max: 500 }
  },
  'Frontend': {
    id: 'cmdrfyb5f0000u8fsih05gxfk',
    slug: 'frontend',
    viewRange: { min: 100, max: 250 }
  },
  'Backend': {
    id: 'cmdrfybll0002u8fseh2edmgf',
    slug: 'backend',
    viewRange: { min: 100, max: 250 }
  },
  'DevOps': {
    id: 'cme5a1b510000u8ww82cxvzzv',
    slug: 'devOps',
    viewRange: { min: 50, max: 150 }
  },
  'Database': {
    id: 'cme5a2cf40001u8wwtm4yvrw0',
    slug: 'database',
    viewRange: { min: 50, max: 150 }
  },
  '오픈소스': {
    id: 'cme5a7but0004u8ww8neir3k3',
    slug: 'opensource',
    viewRange: { min: 100, max: 250 }
  }
}
```

## 📋 게시글 콘텐츠 템플릿

### 🎯 흥미로운 AI 뉴스 템플릿 (신규 프로세스)

```typescript
// ⚠️ 중요: AI 에이전트는 새로운 3단계 프로세스 수행!

// 1단계: 플레이스홀더로 초안 작성
const draft = createDraftWithPlaceholders()

// 2단계: 필요한 이미지 구체적으로 요청
const imageRequest = `
📸 이 게시글에 필요한 이미지를 제공해주세요:

1. **메인 이미지** (필수)
   - 위치: 게시글 최상단
   - 추천: [주제] 관련 대표 이미지
   - 예시: 로고, 제품 스크린샷, 컨셉 이미지

2. **기능 설명 이미지** (권장)
   - 위치: 핵심 기능 섹션
   - 추천: UI 스크린샷, 다이어그램
   
3. **비교 차트/그래프** (선택)
   - 위치: 성능 비교 섹션
   - 추천: 벤치마크 결과, 통계 그래프
   
4. **사용 예시 이미지** (선택)
   - 위치: 활용 사례 섹션
   - 추천: 실제 사용 화면

💡 이미지가 없으시면 임시 이미지로 진행하겠습니다.
`

// 3단계: 제공받은 이미지로 최종 완성
const content = `# [흥미로운 제목 - 독자의 호기심 자극]

## 🎯 한 줄 요약
[핵심 내용을 한 문장으로]

![메인 이미지 - 주제를 시각적으로 표현]([검증된 실제 이미지 URL])

## 🤔 왜 이게 중요할까요?

여러분, 혹시 [일상적인 예시]를 경험해보셨나요? 

[공감가는 상황 설명]

![상황을 설명하는 이미지](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600)

## 💡 핵심 기능 소개

### 1. [첫 번째 특징]

**이렇게 동작합니다:**
- 간단한 설명 1
- 간단한 설명 2
- 간단한 설명 3

![기능 설명 스크린샷](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600)

### 2. [두 번째 특징]

일반적으로 우리가 [기존 방식]을 할 때는 이랬죠:

**Before (기존 방식):**
> "복잡하고 시간이 오래 걸리는 과정..."

**After (새로운 방식):**
> "단 몇 초만에 끝!"

![비포/애프터 비교 이미지](https://picsum.photos/1200/600)

## 🎯 실제 활용 사례

### 사례 1: [구체적인 예시]

[실제 사용자의 경험담 형식으로 작성]

![실제 사례 스크린샷](https://picsum.photos/id/1/1200/600)

### 사례 2: [또 다른 예시]

[수치와 함께 구체적인 개선 효과 제시]

## ⚡ 장단점 정리

### ✅ 장점
- **빠른 속도**: 기존 대비 10배 빠름
- **쉬운 사용**: 클릭 3번이면 끝
- **무료 제공**: 베타 기간 완전 무료

### ⚠️ 주의사항
- 아직 베타 버전이라 버그 가능성
- 한국어 지원 제한적
- 인터넷 연결 필수

## 🚀 시작하는 방법

### Step 1: 가입하기
[구체적인 가입 방법]

### Step 2: 설정하기
[초기 설정 가이드]

### Step 3: 첫 사용
[첫 사용 예시]

![시작 가이드 이미지](https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&h=600)

## 💭 마무리 생각

[개인적인 의견과 전망]

여러분은 어떻게 생각하시나요? 댓글로 의견을 들려주세요! 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️`
```

## ✅ AI 에이전트 체크리스트 (신규 워크플로우)

**스크립트 생성 시 새로운 순서:**

### 📝 Step 1: 초안 작성
- [ ] 플레이스홀더 이미지로 전체 구조 완성
- [ ] 각 이미지 위치에 필요한 이미지 설명 주석
- [ ] Lorem Picsum으로 임시 시각화

### 📸 Step 2: 이미지 요청
- [ ] 필요한 이미지 목록 구체적으로 작성
- [ ] 각 이미지의 용도와 위치 명시
- [ ] 대체 가능한 이미지 유형 제안

### ✅ Step 3: 최종 완성
- [ ] 사용자 제공 이미지 URL 검증 (curl)
- [ ] 플레이스홀더를 실제 이미지로 교체
- [ ] 미제공 이미지는 플레이스홀더 유지 또는 제거

### 📝 텍스트 품질
- [ ] 대화체 사용 (경어체)
- [ ] 문장 길이 2줄 이내
- [ ] 전문 용어는 쉽게 풀어서 설명
- [ ] 구체적인 예시 포함

### 🎯 구조적 완성도
- [ ] 호기심 자극하는 제목
- [ ] 공감가는 도입부
- [ ] 단계별 설명
- [ ] 핵심 정리
- [ ] 행동 유도 마무리

### 💡 추가 팁
- [ ] 실제 화면 스크린샷 URL 활용
- [ ] 비포/애프터 비교
- [ ] 통계나 수치 제시
- [ ] 사용자 후기 형식 활용

## 🚀 성공적인 게시글의 특징

1. **첫 문장에서 독자를 사로잡기**
2. **이미지로 시각적 휴식 제공**
3. **짧고 명확한 문장**
4. **친근한 대화체**
5. **구체적인 예시와 사례**
6. **명확한 행동 지침**
7. **이모지로 재미 더하기**

## 📚 시리즈물 작성 가이드

### 🎯 시리즈 구성 원칙

**효과적인 시리즈 구성:**
- **1편**: 입문/개요 - 호기심 자극, 진입 장벽 낮추기
- **2편**: 핵심 기능 - 실용적인 내용, 당장 써먹을 수 있는 것
- **3편**: 실전 적용 - 실제 프로젝트에 적용하는 방법
- **4편**: 고급/심화 - 더 깊이 알고 싶은 독자를 위한 내용

### 📝 시리즈 제목 패턴

```markdown
# 시리즈 제목 예시
[시리즈명] 1편: 부제목
[시리즈명] 2편: 부제목
또는
제목 - Part 1: 부제목
제목 - Part 2: 부제목
```

### 🔗 시리즈 연결 방법

**각 편 시작 부분:**
```markdown
> 📚 이 글은 "코틀린 마스터하기" 시리즈의 2편입니다.
> - [1편: 자바 개발자라면 30분이면 충분!](/main/posts/xxx)
> - **2편: 코틀린의 꽃 - 이것만 알면 생산성 2배!** (현재 글)
> - 3편: 실전 코틀린 - Spring Boot와 함께! (예정)
```

**각 편 마지막 부분:**
```markdown
---

## 🎯 다음 편 예고

다음 편에서는 **"실전 코틀린 - Spring Boot와 함께!"**를 다룰 예정입니다.
- Spring Boot + 코틀린 프로젝트 설정
- REST API 실전 구현
- 자바 라이브러리와의 완벽한 호환

다음 편도 기대해주세요! 🚀

*이전 편을 못 보셨다면? 👉 [1편: 자바 개발자라면 30분이면 충분!](/main/posts/xxx)*
```

### 💡 시리즈 작성 팁

1. **일관된 톤 유지**: 모든 편에서 동일한 어투와 스타일
2. **난이도 점진적 상승**: 1편은 쉽게, 점점 깊이 있게
3. **독립적 가치**: 각 편이 단독으로도 가치 있어야 함
4. **적절한 분량**: 각 편 5-10분 읽기 분량
5. **시각적 일관성**: 동일한 이모지, 섹션 구조 사용

## 🛠️ 완전한 스크립트 생성 가이드

### ⚠️ 절대 실패하지 않는 3단계 프로세스

**AI 에이전트는 다음 순서를 반드시 따르세요:**

#### 1️⃣ 필수 준비 작업

```bash
# 1. 스키마 정보 파악 (필수!)
Read prisma/schema.prisma  # MainPost 모델 필드 확인

# 2. 현재 오류 상태 점검
npm run lint              # ESLint 확인
npm run type-check         # TypeScript 확인
```

#### 2️⃣ 초안 작성 후 이미지 요청 (신규!)

**🔴 새로운 이미지 처리 워크플로우:**

1. **초안 작성 시 플레이스홀더 사용:**
```typescript
// ✅ Step 1: 모든 이미지를 플레이스홀더로 작성
const placeholders = {
  main: "https://picsum.photos/1200/600?random=1",
  section1: "https://picsum.photos/1200/600?random=2",
  section2: "https://picsum.photos/1200/600?random=3",
  comparison: "https://picsum.photos/1200/600?random=4",
  guide: "https://picsum.photos/1200/600?random=5"
}

// 각 이미지 위치에 주석으로 필요한 이미지 설명 추가
```

2. **사용자에게 구체적 요청:**
```typescript
// ✅ Step 2: 필요한 이미지 목록 제시
const imageRequestMessage = `
🎨 게시글 "[제목]"에 필요한 이미지:

1. 메인 이미지: [구체적 설명]
2. 섹션 이미지: [어떤 내용을 보여줄지]
3. 비교 이미지: [비교 대상 명시]
4. 가이드 이미지: [단계별 설명]

이미지 URL을 제공해주시거나, 
없으시면 그대로 진행하겠습니다.
`
```

3. **제공받은 이미지로 교체:**
```typescript
// ✅ Step 3: 사용자 제공 URL로 교체
// 제공된 이미지만 교체, 나머지는 플레이스홀더 유지
if (userProvidedImages.main) {
  content = content.replace(placeholders.main, userProvidedImages.main)
}
```

**❌ 절대 사용 금지 리스트:**
- LinkedIn 이미지 (403 에러)
- 개인 블로그 이미지 (불안정)
- 소규모 사이트 (CORS/Hotlink 방지)
- CDN 없는 직접 서버 이미지

**🔍 이미지 검증 프로세스:**
```bash
# 1. curl로 HTTP 상태 확인 (필수!)
curl -I [이미지URL]

# 2. 200 OK만 사용, 다른 응답은 즉시 교체
# 3. 브라우저에서도 확인 가능한지 테스트
```

#### 3️⃣ 완전한 스크립트 템플릿

```typescript
import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// 카테고리 ID - 아래에서 선택
const AI_NEWS_CATEGORY_ID = 'cme5a3ysr0002u8wwwmcbgc7z'  // AI뉴스
// const FRONTEND_CATEGORY_ID = 'cmdrfyb5f0000u8fsih05gxfk'  // Frontend
// const BACKEND_CATEGORY_ID = 'cmdrfybll0002u8fseh2edmgf'   // Backend

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min

async function createPost() {
  const content = `# 🎯 [매력적인 제목]

## 🎯 한 줄 요약
**[핵심 내용을 한 문장으로]**

![메인 이미지](https://picsum.photos/1200/600?random=1)

## 🤔 [독자가 공감할 만한 질문]

여러분, 혹시 이런 경험 있으신가요?

- **[공감 포인트 1]** 
- **[공감 포인트 2]**
- **[공감 포인트 3]**

![상황 설명 이미지](https://picsum.photos/1200/600?random=2)

## 💡 [핵심 솔루션/내용]

### 🔥 [주요 특징 1]

**이렇게 동작합니다:**
- [간단한 설명 1]
- [간단한 설명 2]
- [간단한 설명 3]

![기능 설명 이미지](https://picsum.photos/1200/600?random=3)

### ⚡ [주요 특징 2]

기존 방식과 비교해보세요:

**Before (기존 방식):**
> "[기존 방식의 불편함]"

**After ([새로운 방식]):**
> "[개선된 결과]"

![비교 이미지](https://picsum.photos/1200/600?random=4)

## 🎯 실제 활용 사례

### 사례 1: [구체적인 예시]

**[실제 사용자의 경험담]:**
"[구체적인 경험과 결과를 인용문 형식으로]"

![실제 사례 이미지](https://picsum.photos/1200/600?random=5)

### 사례 2: [또 다른 예시]

**[수치화된 개선 효과]:**
- **[지표 1]**: 기존 대비 [수치]% 향상
- **[지표 2]**: [구체적인 수치] 단축
- **[지표 3]**: [만족도] 증가

## ⚡ 장단점 정리

### ✅ [솔루션명]의 압도적 장점

| 기능 | [솔루션명] | [경쟁사1] | [경쟁사2] |
|------|------------|----------|----------|
| **[기능1]** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **[기능2]** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **[기능3]** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

### ⚠️ 아직 개선이 필요한 부분

- **[제한사항 1]**: [구체적인 설명]
- **[제한사항 2]**: [구체적인 설명]
- **[제한사항 3]**: [구체적인 설명]

## 🚀 [솔루션] 시작하는 방법

### Step 1: [첫 번째 단계]
[구체적인 방법 설명]

### Step 2: [두 번째 단계]
[구체적인 방법 설명]

### Step 3: [세 번째 단계]
[구체적인 방법 설명]

![시작 가이드 이미지](https://picsum.photos/1200/600?random=6)

## 💭 마무리 생각

**[솔루션명]은 단순한 [도구/기술]이 아닙니다.** 

[미래 전망과 개인적인 의견을 2-3문장으로]

**여러분의 [경험/의견]을 댓글로 들려주세요!** 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️`

  try {
    console.log('🎯 게시글 생성 시작...')

    // 게시글 생성 (MainPost 스키마에 맞는 필드만 사용!)
    const post = await prisma.mainPost.create({
      data: {
        title: '[🎯 매력적인 제목 - 독자의 호기심을 자극하는 제목]',
        slug: 'unique-url-slug-for-seo', // SEO용 고유 URL
        content,
        excerpt: '[게시글의 핵심 내용을 2-3문장으로 요약한 excerpt]',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: AI_NEWS_CATEGORY_ID, // 적절한 카테고리 선택
        viewCount: getRandomViewCount(300, 500), // AI뉴스는 300-500
        metaTitle: '[SEO 최적화된 메타 제목]',
        metaDescription: '[SEO 최적화된 메타 설명 - 160자 이내]',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결 (색상 포함)
    const tags = [
      { name: '[태그1]', slug: '[태그1]', color: '#8b5cf6' },
      { name: '[태그2]', slug: '[태그2]', color: '#10a37f' },
      { name: '[태그3]', slug: '[태그3]', color: '#f59e0b' },
      { name: '[태그4]', slug: '[태그4]', color: '#06b6d4' },
    ]
    console.log('🏷️ 태그 처리 중...')
    
    for (const tagData of tags) {
      // 태그가 이미 존재하는지 확인
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagData.name }
      })

      // 태그가 없으면 생성 (색상 포함)
      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
            color: tagData.color,
            postCount: 1,
          }
        })
      } else {
        // 기존 태그의 postCount 증가
        await prisma.mainTag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } }
        })
      }

      // 게시글-태그 연결
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        }
      })
    }

    console.log(`🏷️ 태그 처리 완료: ${tags.map(t => t.name).join(', ')}`)

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
      console.log('🎉 게시글 생성 스크립트 실행 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createPost }
```

### 🚨 절대 실패하지 않는 체크리스트 (신규)

**새로운 워크플로우 체크리스트:**

#### ✅ Step 1: 초안 작성 단계
- [ ] `prisma/schema.prisma` 읽고 MainPost 필드 확인
- [ ] 플레이스홀더 이미지로 전체 콘텐츠 작성
- [ ] 각 이미지 위치에 설명 주석 추가

#### 📸 Step 2: 이미지 요청 단계
- [ ] 필요한 이미지 목록 사용자에게 제시
- [ ] 구체적인 이미지 설명과 용도 명시
- [ ] 사용자 응답 대기

#### ✅ Step 3: 최종 완성 단계
- [ ] 제공받은 이미지 URL curl로 검증
- [ ] 플레이스홀더를 실제 이미지로 교체
- [ ] 카테고리 ID 정확성 확인
- [ ] slug 고유성 확인
- [ ] 태그명과 색상 확인

#### ✅ 실행 후 확인
- [ ] `npm run lint` 통과
- [ ] `npm run type-check` 통과  
- [ ] 브라우저에서 게시글 확인
- [ ] 카카오톡 공유 시 이미지 미리보기 작동

### 🎯 자주 하는 실수와 해결책

**❌ 자주 하는 실수:**
1. 존재하지 않는 스키마 필드 사용 (`featured`, `seoTitle` 등)
2. 404 이미지 URL 사용 
3. LinkedIn, 개인 블로그 등 불안정한 이미지 소스 사용
4. 중복된 slug 사용
5. 잘못된 카테고리 ID

**✅ 해결 방법:**
1. 반드시 `prisma/schema.prisma` 먼저 읽기
2. **Unsplash 이미지 우선 사용** (가장 안정적)
3. 모든 이미지 URL은 **curl -I로 200 OK 확인 필수**
4. slug는 `게시글-주제-unique-identifier` 형식
5. 위의 카테고리 ID 목록에서 정확히 복사

**🔴 이미지 문제 즉시 해결법:**
```typescript
// 이미지가 안 뜰 때 즉시 교체할 안전한 URL들:
const safeImages = {
  main: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=600&fit=crop",
  section1: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600",
  section2: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&h=600",
  fallback: "https://picsum.photos/1200/600?random="
}
```

---

**이 가이드를 따르면 누구나 쉽고 재미있게 읽을 수 있는 고품질 콘텐츠를 생성할 수 있습니다!** 🎉