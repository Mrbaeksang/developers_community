import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createKyPost() {
  try {
    console.log('🚀 Ky 게시글 생성 시작...')

    // 하드코딩된 ID들 (docs/POST.md에서 가져온 값)
    const adminUserId = 'cmdri2tj90000u8vgtyir9upy'
    const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리

    // 1. 태그들 생성
    const tagNames = ['Ky', 'HTTP', 'Client', 'Fetch', 'JavaScript']
    const tags = []

    for (const tagName of tagNames) {
      const tag = await prisma.mainTag.upsert({
        where: { name: tagName },
        update: {},
        create: {
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          postCount: 0,
        },
      })
      tags.push(tag)
    }

    // 2. 메인 게시글 생성
    const slug = 'ky-lightweight-http-client-modern-fetch-wrapper'
    const title = 'Ky - Axios 대신 쓰는 가벼운 HTTP 클라이언트 🌊'
    const excerpt =
      'Sindre Sorhus가 만든 현대적인 Fetch API 기반 HTTP 클라이언트. Axios보다 작고 빠르며 타입스크립트 친화적인 Ky로 HTTP 요청을 우아하게 처리하세요.'

    const content = `# Ky - Axios를 대체할 현대적인 HTTP 클라이언트

웹 개발에서 HTTP 요청은 필수적인 부분입니다. 지금까지 많은 개발자들이 Axios를 사용해왔지만, **2025년에는 더 나은 대안이 있습니다**. 바로 **Ky**입니다.

## 🤔 왜 Ky를 선택해야 할까요?

### 크기의 차이가 말해주는 것들
- **Axios**: 35.6KB (gzip 13.5KB) 
- **Ky**: 단 8.7KB (gzip 3.8KB)
- **차이**: Ky는 Axios보다 **4배나 가볍습니다**

### 현대적인 웹 표준 기반
Ky는 브라우저의 네이티브 **Fetch API**를 기반으로 만들어져:
- 폴리필 불필요
- 더 나은 성능
- 웹 표준 준수
- 미래 지향적 설계

## ✨ Ky의 핵심 장점들

### 1. 우아한 API 디자인
\`\`\`javascript
// Axios처럼 직관적이지만 더 간결
const response = await ky.get('https://api.example.com/users');
const users = await response.json();

// POST 요청도 깔끔하게
const newUser = await ky.post('https://api.example.com/users', {
  json: { name: 'John', email: 'john@example.com' }
}).json();
\`\`\`

### 2. 자동 재시도 기능
네트워크 불안정 상황에서 자동으로 재시도:
\`\`\`javascript
const api = ky.create({
  retry: {
    limit: 3,
    methods: ['get', 'put'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504]
  }
});
\`\`\`

### 3. 강력한 타입스크립트 지원
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// 타입 안전한 요청
const users = await ky.get('https://api.example.com/users').json<User[]>();
\`\`\`

### 4. 훅(Hook) 시스템
요청의 생명주기를 세밀하게 제어:
\`\`\`javascript
const api = ky.create({
  hooks: {
    beforeRequest: [
      (request) => {
        // 인증 토큰 추가
        request.headers.set('Authorization', \`Bearer \${token}\`);
      }
    ],
    afterResponse: [
      (request, options, response) => {
        // 로깅, 에러 처리 등
        console.log(\`Response: \${response.status}\`);
      }
    ]
  }
});
\`\`\`

## 🚀 실제 프로젝트에서 활용하기

### API 클라이언트 구축
\`\`\`javascript
// api/client.js
import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: 'https://api.myapp.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('token');
        if (token) {
          request.headers.set('Authorization', \`Bearer \${token}\`);
        }
      }
    ]
  }
});

// 사용
export const getUsers = () => apiClient.get('users').json();
export const createUser = (data) => apiClient.post('users', { json: data }).json();
\`\`\`

### 에러 처리
\`\`\`javascript
try {
  const response = await ky.get('https://api.example.com/data');
  const data = await response.json();
} catch (error) {
  if (error instanceof ky.HTTPError) {
    console.log(\`HTTP Error: \${error.response.status}\`);
    console.log(await error.response.text());
  } else if (error instanceof ky.TimeoutError) {
    console.log('Request timed out');
  }
}
\`\`\`

## 💡 마이그레이션 가이드: Axios → Ky

### 기본 요청
\`\`\`javascript
// Axios
const response = await axios.get('/users');
const users = response.data;

// Ky
const users = await ky.get('/users').json();
\`\`\`

### 설정과 인스턴스
\`\`\`javascript
// Axios
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'Authorization': 'Bearer token' }
});

// Ky
const kyInstance = ky.create({
  prefixUrl: 'https://api.example.com',
  timeout: 5000,
  headers: { 'Authorization': 'Bearer token' }
});
\`\`\`

## 🎯 언제 Ky를 사용해야 할까?

### ✅ Ky 추천 상황
- **번들 크기가 중요한 프로젝트**
- **모던 브라우저 환경**
- **타입스크립트 프로젝트**
- **Fetch API 기반 개발**
- **가벼운 HTTP 클라이언트가 필요한 경우**

### ❌ Axios가 여전히 나은 경우
- **레거시 브라우저 지원 필요**
- **복잡한 인터셉터 로직**
- **기존 Axios 코드베이스가 방대한 경우**

## 🌟 커뮤니티와 생태계

**Sindre Sorhus**가 제작한 Ky는:
- ⭐ **15.2k stars** (GitHub)
- 🔄 **활발한 개발**과 업데이트
- 💪 **견고한 테스트**와 문서화
- 🎯 **명확한 철학**과 방향성

## 🔮 2025년 웹 개발의 트렌드

Ky는 다음과 같은 **현대 웹 개발의 흐름**을 반영합니다:

1. **네이티브 웹 API 활용**
2. **번들 크기 최적화**
3. **타입 안전성 강화**
4. **모던 JavaScript/TypeScript 문법**
5. **단순함과 성능의 조화**

## 🚀 시작해보세요!

\`\`\`bash
# 설치
npm install ky

# 또는
yarn add ky
pnpm add ky
\`\`\`

**한 줄 요약**: Ky는 Axios의 복잡함 없이, Fetch의 불편함 없이, **정확히 필요한 만큼의 기능**을 제공하는 현대적인 HTTP 클라이언트입니다.

지금 바로 새 프로젝트에서 Ky를 시도해보세요. 더 가벼워진 번들과 더 나은 개발 경험을 만나실 수 있습니다! ✨`

    // 랜덤 조회수 생성 (100-250 사이)
    const viewCount = Math.floor(Math.random() * 151) + 100

    const post = await prisma.mainPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        authorId: adminUserId,
        authorRole: GlobalRole.ADMIN,
        categoryId,
        status: PostStatus.PUBLISHED,
        isPinned: false,
        viewCount,
        likeCount: 0,
        commentCount: 0,
        metaTitle: title,
        metaDescription: excerpt,
        approvedAt: new Date(),
        approvedById: adminUserId,
        rejectedReason: null,
      },
    })

    // 3. 게시글-태그 관계 생성
    for (const tag of tags) {
      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })

      // 태그의 postCount 증가
      await prisma.mainTag.update({
        where: { id: tag.id },
        data: { postCount: { increment: 1 } },
      })
    }

    console.log('✅ Ky 게시글이 생성되었습니다!')
    console.log(`📝 제목: ${title}`)
    console.log(`🔗 슬러그: ${slug}`)
    console.log(`👤 작성자 ID: ${adminUserId}`)
    console.log(`📁 카테고리 ID: ${categoryId}`)
    console.log(`🏷️ 태그: ${tagNames.join(', ')}`)
    console.log(`📊 상태: PUBLISHED`)
    console.log(`👁️ 조회수: ${viewCount}`)
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createKyPost()
