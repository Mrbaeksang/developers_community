const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkExistingPosts() {
  console.log('=== 현재 DB의 모든 게시글 확인 ===\n')

  // 모든 메인 게시글 가져오기
  const allPosts = await prisma.mainPost.findMany({
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`총 게시글 수: ${allPosts.length}개\n`)

  // 카테고리별 분류
  const postsByCategory = {}
  allPosts.forEach((post) => {
    const categoryName = post.category?.name || '미분류'
    if (!postsByCategory[categoryName]) {
      postsByCategory[categoryName] = []
    }
    postsByCategory[categoryName].push(post)
  })

  // 카테고리별 출력
  Object.entries(postsByCategory).forEach(([category, posts]) => {
    console.log(`\n📁 ${category} (${posts.length}개)`)
    console.log('─'.repeat(50))
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`)
      console.log(`   작성자: ${post.author.name || post.author.email}`)
      console.log(`   상태: ${post.status}`)
      console.log(
        `   댓글: ${post._count.comments}개, 좋아요: ${post._count.likes}개`
      )
      console.log(`   작성일: ${post.createdAt.toLocaleDateString('ko-KR')}`)
      if (post.content) {
        // HTML 태그 제거하고 첫 100자만 보여주기
        const cleanContent = post.content
          .replace(/<[^>]*>/g, '')
          .substring(0, 100)
        console.log(`   내용: ${cleanContent}...`)
      }
      console.log()
    })
  })

  // 주제 분석
  console.log('\n=== 주제 분석 ===')
  console.log('─'.repeat(50))

  const topics = {
    vibe: [],
    springboot: [],
    react: [],
    nextjs: [],
    javascript: [],
    typescript: [],
    other: [],
  }

  allPosts.forEach((post) => {
    const titleLower = post.title.toLowerCase()
    const contentLower = (post.content || '').toLowerCase()
    const combined = titleLower + ' ' + contentLower

    if (combined.includes('vibe') || combined.includes('바이브')) {
      topics.vibe.push(post.title)
    } else if (combined.includes('spring') || combined.includes('스프링')) {
      topics.springboot.push(post.title)
    } else if (combined.includes('react') || combined.includes('리액트')) {
      topics.react.push(post.title)
    } else if (combined.includes('next')) {
      topics.nextjs.push(post.title)
    } else if (
      combined.includes('javascript') ||
      combined.includes('자바스크립트')
    ) {
      topics.javascript.push(post.title)
    } else if (
      combined.includes('typescript') ||
      combined.includes('타입스크립트')
    ) {
      topics.typescript.push(post.title)
    } else {
      topics.other.push(post.title)
    }
  })

  console.log(
    '\n🎯 Vibe 관련 게시글:',
    topics.vibe.length ? topics.vibe.join(', ') : '없음'
  )
  console.log(
    '🎯 Spring Boot 관련 게시글:',
    topics.springboot.length ? topics.springboot.join(', ') : '없음'
  )
  console.log(
    '🎯 React 관련 게시글:',
    topics.react.length ? topics.react.join(', ') : '없음'
  )
  console.log(
    '🎯 Next.js 관련 게시글:',
    topics.nextjs.length ? topics.nextjs.join(', ') : '없음'
  )
  console.log(
    '🎯 JavaScript 관련 게시글:',
    topics.javascript.length ? topics.javascript.join(', ') : '없음'
  )
  console.log(
    '🎯 TypeScript 관련 게시글:',
    topics.typescript.length ? topics.typescript.join(', ') : '없음'
  )
  console.log(
    '🎯 기타 게시글:',
    topics.other.length ? topics.other.join(', ') : '없음'
  )

  // 추천 주제
  console.log('\n\n=== 작성 가능한 새 주제 추천 ===')
  console.log('─'.repeat(50))

  console.log('\n📝 Vibe 코딩 주제 (초심자용):')
  const vibeTopics = [
    '1. "Vibe 코딩이란? 개발자의 몰입과 생산성을 높이는 방법"',
    '2. "초보 개발자를 위한 Vibe 코딩 환경 세팅 가이드"',
    '3. "Vibe 코딩으로 번아웃 극복하기: 즐거운 코딩 습관 만들기"',
    '4. "페어 프로그래밍과 Vibe 코딩: 팀 생산성 200% 높이기"',
    '5. "음악과 함께하는 Vibe 코딩: 집중력을 높이는 플레이리스트"',
  ]
  vibeTopics.forEach((topic) => console.log(`   ${topic}`))

  console.log('\n☕ Spring Boot 주제 (주니어 백엔드용):')
  const springTopics = [
    '1. "Spring Boot 필수 어노테이션 TOP 10과 실전 활용법"',
    '2. "주니어 개발자가 꼭 알아야 할 Spring Boot 디자인 패턴"',
    '3. "Spring Boot REST API 설계: 초보자가 자주 하는 실수와 해결법"',
    '4. "Spring Boot와 JPA: 효율적인 데이터베이스 연동 가이드"',
    '5. "Spring Security 입문: JWT 인증 구현하기"',
  ]
  springTopics.forEach((topic) => console.log(`   ${topic}`))

  console.log('\n\n💡 선택 기준:')
  console.log('- 기존 게시글과 겹치지 않는 주제')
  console.log('- 초심자/주니어 개발자에게 실용적인 내용')
  console.log('- 검색 키워드가 명확한 제목')
  console.log('- 실습 가능한 예제 포함 가능한 주제')

  return { allPosts, topics }
}

checkExistingPosts()
  .then(() => {
    console.log('\n✅ 분석 완료!')
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect())
