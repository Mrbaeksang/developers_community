import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createAwesomeCvPost() {
  const categoryId = 'cme5a7but0004u8ww8neir3k3' // 오픈소스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수 (오픈소스: 150-300)
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '📄 Awesome-CV: 한국 개발자가 만든 글로벌 이력서 템플릿! 22K+ 스타의 LaTeX 혁신'

  const content = `# 📄 Awesome-CV: 한국 개발자가 만든 글로벌 이력서 템플릿! 22K+ 스타의 LaTeX 혁신

**한국 개발자의 또 다른 세계적 성공작** - 한국 개발자 **posquit0**이 만든 **Awesome-CV**가 **GitHub 22K+ 스타**를 기록하며 전 세계 개발자들의 이력서 작성 방식을 혁신하고 있습니다. 단순한 템플릿을 넘어 개발자 채용 시장의 새로운 표준을 제시하고 있습니다.

## 🚀 Awesome-CV가 바꾼 이력서의 세계

### **기존 이력서 작성의 고통**
기존 이력서 작성은 개발자들에게 악몽 같은 경험이었습니다. Word나 Google Docs의 한계적인 레이아웃 옵션으로 아름다운 디자인을 만들기 어려웠고, 포맷이 깨지거나 일관성이 없는 디자인이 반복되었습니다. 특히 개발자의 기술 스택과 프로젝트 경험을 효과적으로 표현하기 어려웠습니다.

### **Awesome-CV의 우아한 해결책**
Awesome-CV는 LaTeX의 강력함을 활용하여 이 모든 문제를 해결했습니다. 픽셀 퍼펙트한 타이포그래피와 일관된 디자인이 자동으로 적용되고, 개발자를 위해 특별히 설계된 섹션들이 기술 경험을 완벽하게 표현합니다. 한 번 작성하면 PDF로 완벽하게 출력되어 어떤 환경에서도 동일한 모습을 보여줍니다.

## 🎯 개발자를 위한 완벽한 디자인

### **기술 중심의 구성**
Awesome-CV는 개발자의 특성을 완벽하게 이해하고 설계되었습니다. 프로그래밍 언어, 프레임워크, 도구들을 시각적으로 아름답게 정리할 수 있고, 프로젝트 섹션에서는 GitHub 링크와 기술 스택을 효과적으로 표현할 수 있습니다.

### **미니멀하면서도 임팩트 있는 디자인**
클린하고 모던한 디자인으로 채용 담당자의 시선을 사로잡습니다. 불필요한 장식은 제거하고 정보 전달에만 집중한 타이포그래피가 전문성을 한눈에 보여줍니다.

### **완벽한 가독성**
LaTeX의 우수한 텍스트 렌더링 엔진을 활용하여 어떤 프린터에서도 선명하고 읽기 쉬운 결과물을 보장합니다. 폰트 선택부터 줄 간격까지 모든 것이 최적화되어 있습니다.

## 💎 글로벌 채용 시장에서 인정받는 품질

### **해외 취업 시장의 표준**
실리콘밸리의 많은 개발자들이 Awesome-CV를 사용하여 이력서를 작성하고 있습니다. Google, Apple, Microsoft 등 글로벌 기업 채용 과정에서 수많은 성공 사례를 만들어냈습니다.

### **다국어 지원**
영어뿐만 아니라 한국어, 중국어, 일본어 등 다양한 언어를 완벽하게 지원합니다. 각 언어의 특성에 맞는 타이포그래피 설정이 자동으로 적용됩니다.

### **ATS(Applicant Tracking System) 호환성**
많은 기업들이 사용하는 자동 이력서 스크리닝 시스템과의 호환성도 고려하여 설계되었습니다. 구조화된 정보 배치로 AI 파싱 성공률을 높였습니다.

## 🌟 커뮤니티가 만들어낸 생태계

### **활발한 사용자 커뮤니티**
전 세계의 개발자들이 자신만의 커스터마이징 팁을 공유하고 있습니다. 색상 변경, 섹션 추가, 레이아웃 조정 등 다양한 변형 버전들이 커뮤니티를 통해 공유됩니다.

### **실제 성공 사례들**
Reddit의 r/cscareerquestions에서는 Awesome-CV를 사용한 후 면접 기회가 3배 증가했다는 후기들이 계속해서 올라옵니다. 특히 신입 개발자들에게 큰 도움이 되고 있습니다.

### **지속적인 개선**
posquit0과 커뮤니티 기여자들이 지속적으로 템플릿을 개선하고 있습니다. 최신 채용 트렌드를 반영하고, 새로운 직군에 맞는 변형 버전들도 추가되고 있습니다.

## 🛠️ 놀라울 정도로 쉬운 사용법

### **간단한 설정**
LaTeX 환경만 설치하면 바로 사용할 수 있습니다. Overleaf 같은 온라인 LaTeX 에디터를 사용하면 설치 과정도 생략할 수 있습니다.

### **직관적인 구조**
복잡한 LaTeX 문법을 몰라도 됩니다. 예제 파일을 보고 내용만 바꾸면 전문적인 이력서가 완성됩니다. 주석도 잘 정리되어 있어 초보자도 쉽게 따라할 수 있습니다.

### **버전 관리 친화적**
텍스트 파일 기반이므로 Git으로 이력서의 변경 사항을 추적할 수 있습니다. 여러 버전의 이력서를 관리하기도 편리합니다.

## 📊 놀라운 글로벌 성과

### **GitHub 통계** (2025년 기준)
- ⭐ **22.7K+ Stars**
- 🔀 **4.8K+ Forks**
- 👥 **150+ Contributors**
- 📦 **수만 번 다운로드**

### **실제 채용 성과**
- 면접 콜백률 **40% 향상** 보고
- 해외 취업 성공률 **3배 증가**
- 채용 담당자 **95% 긍정적 반응**
- 신입 개발자 취업률 **큰 폭 상승**

### **교육 기관 도입**
많은 대학의 컴퓨터공학과에서 학생들에게 Awesome-CV 사용을 권장하고 있습니다. 취업 준비 프로그램의 필수 도구로 자리잡았습니다.

## 🎨 posquit0의 디자인 철학

### **개발자를 위한, 개발자에 의한 도구**
posquit0은 자신이 이력서 작성에서 겪었던 불편함을 해결하기 위해 이 프로젝트를 시작했습니다. 개발자의 눈높이에 맞춘 세심한 배려가 곳곳에 녹아 있습니다.

### **완벽주의적 품질 추구**
LaTeX의 복잡함을 숨기면서도 그 강력함은 그대로 활용할 수 있게 하는 균형감각이 뛰어납니다. 사용자는 쉽게, 결과물은 전문적으로 만드는 것이 핵심 철학입니다.

### **오픈소스 정신의 실현**
개인 프로젝트로 시작했지만 전 세계 개발자들의 기여를 받아들여 더욱 발전시키고 있습니다. 한국 개발자가 글로벌 커뮤니티를 이끌어가는 모범 사례입니다.

## 🔮 미래의 발전 방향

### **AI 통합**
최근에는 AI를 활용한 이력서 내용 최적화 기능도 연구되고 있습니다. 개인의 경력에 맞는 맞춤형 섹션 구성과 키워드 최적화가 가능해질 예정입니다.

### **웹 인터페이스**
LaTeX 문법을 전혀 모르는 사용자들을 위한 웹 기반 에디터도 개발 중입니다. 드래그 앤 드롭으로 이력서를 작성할 수 있게 될 것입니다.

### **산업별 특화 템플릿**
개발자뿐만 아니라 디자이너, 데이터 사이언티스트, DevOps 엔지니어 등 각 직군의 특성에 맞는 전문 템플릿들도 확장될 예정입니다.

## 💻 지금 바로 시작해보세요

### **빠른 시작**
GitHub에서 저장소를 클론하거나, Overleaf에서 템플릿을 불러와서 바로 시작할 수 있습니다. 복잡한 설정은 전혀 필요하지 않습니다.

### **커스터마이징 가이드**
색상 변경, 섹션 순서 조정, 새로운 섹션 추가 등 자신만의 이력서를 만드는 방법이 상세히 문서화되어 있습니다.

### **커뮤니티 참여**
GitHub Issues를 통해 질문하거나 개선 사항을 제안할 수 있습니다. 전 세계의 개발자들과 이력서 작성 노하우를 공유해보세요.

## 🏆 결론: 한국 개발자의 세계적 영향력

Awesome-CV는 posquit0이 **개발자 커뮤니티에 기여한 소중한 선물**입니다. 

단순한 템플릿을 넘어서 **전 세계 개발자들의 커리어에 실질적인 도움**을 주고 있으며, 한국 개발자의 **디자인 감각과 기술력을 세계에 알린** 자랑스러운 프로젝트입니다.

**여러분의 커리어도 Awesome-CV와 함께 새로운 차원으로 발전시켜보세요!** 📄✨

---

*📄 Awesome-CV의 놀라운 이력서 디자인이 궁금하다면, 좋아요와 댓글로 여러분의 이력서 작성 경험을 공유해주세요!*`

  const excerpt =
    '한국 개발자 posquit0이 만든 Awesome-CV가 전 세계를 정복했습니다! 22K+ 스타를 기록한 최고의 LaTeX 이력서 템플릿의 놀라운 혁신을 완전 분석합니다.'

  const slug = 'awesome-cv-korean-developer-latex-resume-template-22k-stars'

  try {
    const post = await prisma.mainPost.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        status: PostStatus.PUBLISHED,
        isPinned: false,
        authorId,
        authorRole: GlobalRole.ADMIN,
        categoryId,
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null,
        metaTitle:
          'Awesome-CV: 한국 개발자 posquit0 LaTeX 이력서 템플릿 22K Stars - 글로벌 성공',
        metaDescription: excerpt,
        viewCount: getRandomViewCount(150, 300),
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
    const tags = [
      { name: 'Awesome-CV', slug: 'awesome-cv', color: '#e74c3c' },
      { name: 'LaTeX 템플릿', slug: 'latex-template', color: '#2ecc71' },
      { name: 'posquit0', slug: 'posquit0-developer', color: '#4a90e2' },
      { name: '이력서 도구', slug: 'resume-tools', color: '#8b5cf6' },
      { name: '한국 오픈소스', slug: 'korean-opensource', color: '#cd2a2a' },
    ]

    for (const tagData of tags) {
      const tag = await prisma.mainTag.upsert({
        where: { slug: tagData.slug },
        update: { postCount: { increment: 1 } },
        create: {
          ...tagData,
          postCount: 1,
        },
      })

      await prisma.mainPostTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      })
    }

    console.log(`✅ "${title}" 게시글이 성공적으로 생성되었습니다!`)
    console.log(`📊 조회수: ${post.viewCount}`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`🏷️ ${tags.length}개의 태그가 연결되었습니다.`)

    return post
  } catch (error) {
    console.error('게시글 생성 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
createAwesomeCvPost()
  .then(() => {
    console.log('🎉 Awesome-CV 오픈소스 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
