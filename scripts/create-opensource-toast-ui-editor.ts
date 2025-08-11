import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createToastUiEditorPost() {
  const categoryId = 'cme5a7but0004u8ww8neir3k3' // 오픈소스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수 (오픈소스: 150-300)
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '✏️ TOAST UI Editor: NHN이 만든 차세대 마크다운 에디터! 17K+ 스타의 기업급 혁신'

  const content = `# ✏️ TOAST UI Editor: NHN이 만든 차세대 마크다운 에디터! 17K+ 스타의 기업급 혁신

**한국 IT 대기업의 오픈소스 성공작** - 한국의 IT 대기업 **NHN**에서 개발한 **TOAST UI Editor**가 **GitHub 17K+ 스타**를 기록하며 전 세계 개발자들의 문서 작성 경험을 혁신하고 있습니다. 기업 수준의 완성도로 전문가들이 인정하는 차세대 에디터입니다.

## 🚀 TOAST UI Editor가 바꾼 문서 편집의 세계

### **기존 마크다운 에디터의 한계**
기존의 마크다운 에디터들은 개발자들에게 답답한 경험을 제공했습니다. 실시간 프리뷰가 불안정하거나 느리고, 복잡한 문서 구조를 처리할 때 성능이 저하되었습니다. 특히 이미지 삽입, 표 편집, 수식 입력 등의 고급 기능들이 부족했습니다.

### **TOAST UI Editor의 혁신적 해결책**
TOAST UI Editor는 **WYSIWYG**와 **마크다운 모드**를 완벽하게 통합한 혁신적인 에디터입니다. 실시간으로 두 모드를 전환할 수 있고, 각 모드에서 입력한 내용이 완벽하게 동기화됩니다. 기업급 성능과 안정성으로 대용량 문서도 부드럽게 처리합니다.

## 🎯 전문가들이 인정하는 완성도

### **완벽한 이중 모드 시스템**
초보자는 WYSIWYG 모드에서 직관적으로 문서를 작성하고, 고급 사용자는 마크다운 모드에서 빠르게 텍스트를 입력할 수 있습니다. 두 모드 간의 전환이 실시간으로 이루어져 어떤 작업 방식을 선호하든 완벽하게 지원됩니다.

### **강력한 플러그인 생태계**
차트, 코드 하이라이팅, 수학 공식, UML 다이어그램 등 다양한 플러그인을 제공합니다. 각 플러그인은 NHN의 엄격한 품질 기준을 통과한 기업급 수준의 완성도를 자랑합니다.

### **뛰어난 확장성과 커스터마이징**
개발자들이 자신만의 기능을 쉽게 추가할 수 있는 풍부한 API를 제공합니다. 훅 시스템과 이벤트 리스너를 통해 에디터의 모든 동작을 세밀하게 제어할 수 있습니다.

## 💼 기업 환경에서 검증된 안정성

### **NHN의 실제 서비스에서 검증**
TOAST UI Editor는 NHN의 다양한 서비스에서 실제로 사용되면서 검증되었습니다. 수십만 명의 사용자가 매일 사용하는 환경에서 안정성과 성능이 입증되었습니다.

### **대용량 문서 처리 능력**
수천 줄의 긴 문서도 끊김 없이 편집할 수 있습니다. 가상 스크롤링과 메모리 최적화를 통해 브라우저 성능 저하 없이 대용량 콘텐츠를 처리합니다.

### **다양한 브라우저 호환성**
Internet Explorer부터 최신 Chrome까지 모든 주요 브라우저에서 동일한 경험을 제공합니다. 크로스 브라우저 이슈를 최소화하여 기업 환경에서 안심하고 사용할 수 있습니다.

## 🌟 개발자들이 선택하는 이유

### **완벽한 한글 지원**
한국 기업이 만든 만큼 한글 입력과 편집에 특별히 최적화되어 있습니다. IME 처리, 한글 타이포그래피, 줄바꿈 처리 등 모든 부분에서 한국 사용자의 요구사항을 완벽하게 반영했습니다.

### **풍부한 문서와 예제**
기업 수준의 완벽한 문서화로 누구나 쉽게 시작할 수 있습니다. 다양한 사용 사례별 예제와 튜토리얼을 제공하여 학습 곡선을 최소화했습니다.

### **활발한 커뮤니티 지원**
NHN의 전담 팀이 지속적으로 유지보수하고 있으며, 커뮤니티 피드백에 적극적으로 응답합니다. 정기적인 업데이트와 버그 수정으로 높은 신뢰성을 유지하고 있습니다.

## 🛠️ 놀라운 기능들

### **실시간 협업 지원**
여러 사용자가 동시에 문서를 편집할 수 있는 협업 기능을 지원합니다. 충돌 해결 알고리즘을 통해 동시 편집 시에도 데이터 손실 없이 작업할 수 있습니다.

### **스마트한 자동완성**
마크다운 문법 자동완성, 링크 자동 생성, 이미지 자동 리사이징 등 사용자 편의성을 높이는 스마트 기능들이 가득합니다.

### **다양한 출력 포맷**
마크다운, HTML은 물론이고 PDF 출력도 지원합니다. 각 포맷별로 최적화된 스타일링이 자동으로 적용됩니다.

## 📊 글로벌 기업들의 선택

### **GitHub 통계** (2025년 기준)
- ⭐ **17.1K+ Stars**
- 🔀 **1.7K+ Forks**
- 👥 **80+ Contributors**
- 📦 **매달 50K+ NPM 다운로드**

### **실제 도입 기업들**
- **삼성전자**: 사내 문서 시스템
- **LG CNS**: 기술 문서 플랫폼  
- **카카오**: 개발자 위키
- **네이버**: 기술 블로그 시스템
- **글로벌 스타트업**: 제품 문서화

### **교육 기관 활용**
많은 대학과 코딩 부트캠프에서 학습 자료 작성과 과제 제출용으로 활용하고 있습니다. 교육자와 학습자 모두에게 편리한 인터페이스를 제공합니다.

## 🎨 NHN의 오픈소스 철학

### **기업 수준의 품질 관리**
NHN은 상업적 제품을 개발하는 것과 동일한 수준의 품질 기준을 적용하여 TOAST UI Editor를 개발했습니다. 코드 리뷰, 자동화된 테스트, 성능 모니터링 등 모든 과정이 기업 표준을 따릅니다.

### **지속가능한 개발 모델**
단발성 오픈소스가 아닌 장기적 관점에서 지속적으로 발전시켜나가고 있습니다. 정기적인 릴리스 일정과 로드맵을 공개하여 사용자들이 안심하고 도입할 수 있게 합니다.

### **커뮤니티와의 상생**
기업 내부 사용뿐만 아니라 전 세계 개발자 커뮤니티의 피드백을 적극적으로 수용합니다. 오픈소스 생태계 발전에 기여하겠다는 NHN의 의지가 반영되어 있습니다.

## 🔮 미래의 발전 방향

### **AI 기능 통합**
GPT와 같은 AI 모델과 연동하여 자동 문서 작성, 맞춤법 검사, 번역 기능 등을 제공할 예정입니다. 사용자의 작업 효율성을 더욱 높일 것입니다.

### **모바일 최적화**
모바일 환경에서의 편집 경험을 개선하여 언제 어디서나 문서 작성이 가능하도록 발전시킬 계획입니다.

### **클라우드 통합**
Google Drive, OneDrive, Dropbox 등 클라우드 서비스와의 직접 연동을 통해 더욱 편리한 파일 관리를 제공할 예정입니다.

## 💻 지금 바로 시작해보세요

### **간단한 설치**
NPM이나 CDN을 통해 손쉽게 프로젝트에 추가할 수 있습니다. 복잡한 설정 없이 몇 줄의 코드만으로 강력한 에디터를 사용할 수 있습니다.

### **다양한 프레임워크 지원**
React, Vue.js, Angular 등 모든 주요 프론트엔드 프레임워크와 완벽하게 호환됩니다. 각 프레임워크별 래퍼 컴포넌트도 공식 제공합니다.

### **무료 상업적 사용**
MIT 라이센스로 제공되어 개인부터 대기업까지 자유롭게 사용할 수 있습니다. 라이센스 걱정 없이 안심하고 도입하세요.

## 🎯 특별한 활용 사례들

### **기술 블로그 플랫폼**
많은 기업들이 개발자 기술 블로그를 위해 TOAST UI Editor를 선택하고 있습니다. 코드 하이라이팅과 수식 지원으로 기술 포스트 작성에 최적화되어 있습니다.

### **위키 시스템**
사내 위키나 프로젝트 문서화에 활용하면 팀의 지식 공유가 한결 수월해집니다. 실시간 협업 기능으로 팀워크도 향상됩니다.

### **교육 플랫폼**
온라인 강의 자료 작성, 학습 노트 정리, 과제 제출 등 교육 분야에서도 널리 활용되고 있습니다.

## 🏆 결론: 한국 IT 기업의 글로벌 기여

TOAST UI Editor는 **한국 IT 기업이 세계 개발자 커뮤니티에 기여하는 방법**을 보여주는 모범 사례입니다.

기업의 내부 니즈에서 시작된 프로젝트가 **전 세계 개발자들의 생산성 향상**에 기여하고 있으며, **한국 기술의 우수성을 알리는** 훌륭한 사례가 되고 있습니다.

**여러분의 다음 프로젝트에서도 TOAST UI Editor와 함께 더 나은 문서 작성 경험을 만들어보세요!** ✏️✨

---

*✏️ TOAST UI Editor의 강력한 기능이 궁금하다면, 좋아요와 댓글로 여러분의 문서 편집 경험을 공유해주세요!*`

  const excerpt =
    'NHN이 만든 TOAST UI Editor가 글로벌 문서 편집의 새로운 기준을 제시합니다! 17K+ 스타를 기록한 차세대 마크다운 에디터의 기업급 혁신을 완전 분석합니다.'

  const slug = 'toast-ui-editor-nhn-markdown-wysiwyg-editor-17k-stars'

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
          'TOAST UI Editor: NHN 마크다운 에디터 17K Stars - 기업급 문서 편집 솔루션',
        metaDescription: excerpt,
        viewCount: getRandomViewCount(150, 300),
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
    const tags = [
      { name: 'TOAST UI Editor', slug: 'toast-ui-editor', color: '#ff6b35' },
      { name: '마크다운 에디터', slug: 'markdown-editor', color: '#2ecc71' },
      { name: 'NHN 오픈소스', slug: 'nhn-opensource', color: '#3498db' },
      { name: 'WYSIWYG 에디터', slug: 'wysiwyg-editor', color: '#8b5cf6' },
      { name: '기업용 도구', slug: 'enterprise-tools', color: '#e74c3c' },
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
createToastUiEditorPost()
  .then(() => {
    console.log('🎉 TOAST UI Editor 오픈소스 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
