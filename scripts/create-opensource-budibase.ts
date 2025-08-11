import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createBudibasePost() {
  const categoryId = 'cme5a7but0004u8ww8neir3k3' // 오픈소스 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수 (오픈소스: 150-300)
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '🏗️ Budibase: 비즈니스 앱을 분 단위로 구축! 25K+ 스타의 워크플로우 자동화 플랫폼'

  const content = `# 🏗️ Budibase: 비즈니스 앱을 분 단위로 구축! 25K+ 스타의 워크플로우 자동화 플랫폼

**오픈소스 로우코드 플랫폼의 강자** - **Budibase**가 **GitHub 25.3K+ 스타**를 기록하며 비즈니스 앱과 워크플로우 자동화 분야에서 주목받고 있습니다. PostgreSQL, MySQL, MongoDB, REST API 등을 지원하며 Docker와 Kubernetes까지 완벽하게 통합되는 강력한 노코드/로우코드 플랫폼입니다.

## 🚀 Budibase의 핵심 특징

### **다양한 데이터 소스 지원**
- **PostgreSQL, MySQL, MariaDB, MSSQL, MongoDB** 지원
- **REST API** 완벽 연동
- **내장 데이터베이스** 제공
- **CSV 파일 가져오기** 기능
- **Google Sheets** 연동

### **완벽한 배포 옵션**
- **Docker** 컨테이너 지원
- **Kubernetes** 오케스트레이션
- **셀프 호스팅** 완벽 지원
- **클라우드 배포** 옵션 제공

## 🌟 주요 활용 분야

### **관리자 패널**
데이터베이스 관리, 사용자 관리, 시스템 모니터링 등 다양한 관리 업무를 위한 패널을 빠르게 구축할 수 있습니다.

### **내부 도구**
티켓 시스템, 인벤토리 관리, 프로젝트 관리 등 팀의 생산성을 높이는 내부 도구를 효율적으로 개발할 수 있습니다.

### **대시보드**
비즈니스 데이터를 시각화하고 실시간으로 모니터링할 수 있는 대시보드를 손쉽게 만들 수 있습니다.

### **워크플로우 자동화**
승인 프로세스, 데이터 동기화, 알림 시스템 등 반복적인 업무를 자동화할 수 있습니다.

## 📊 GitHub 통계 (2025년 기준)
- ⭐ **25.3K+ Stars**
- 🔀 **1.8K+ Forks**  
- 🔧 **44,713+ Commits**
- 👥 **활발한 커뮤니티**

## 🛠️ 기술적 특징

### **TypeScript 기반**
현대적인 TypeScript를 기반으로 구축되어 타입 안전성과 개발 효율성을 모두 제공합니다.

### **컨테이너 친화적 설계**
Docker와 Kubernetes 환경에서 최적화된 배포가 가능하며, 확장성 있는 인프라 구성을 지원합니다.

### **오픈소스 라이센스**
완전한 오픈소스 프로젝트로 무료 사용이 가능하며, 커뮤니티 기여도 활발합니다.

## 🎯 실제 도입 사례

### **글로벌 기업들의 신뢰**
Netflix, Google, Tesla, Louis Vuitton, WeTransfer 등 유명 기업들이 Budibase를 신뢰하고 사용하고 있습니다.

### **200,000+ 팀이 선택**
전 세계 20만 개 이상의 팀이 Budibase를 사용해 비즈니스 앱과 워크플로우를 구축하고 있습니다.

## 💻 주요 솔루션 유형

### **관리 앱**
티켓 시스템부터 인벤토리 관리까지, 강력한 관리 앱을 자랑스럽게 구축할 수 있습니다.

### **포털 시스템**
고객, 공급업체, 파트너가 즐겁게 사용할 수 있는 맞춤형 경험을 설계할 수 있습니다.

### **승인 플로우**
휴가 신청부터 업무 배정까지, 비즈니스에 특화된 고유한 승인 플로우를 생성할 수 있습니다.

### **폼 시스템**
자체 데이터베이스 내에서 데이터를 안전하게 저장하는 강력한 폼을 구축할 수 있습니다.

## 🔧 개발자 친화적 특징

### **API 우선 접근법**
REST API를 통한 모든 기능 접근이 가능하며, 기존 시스템과의 완벽한 통합을 지원합니다.

### **확장 가능한 아키텍처**
마이크로서비스 아키텍처를 지원하며, 필요에 따라 시스템을 확장할 수 있습니다.

### **활발한 개발**
지속적인 업데이트와 새로운 기능 추가로 최신 트렌드에 맞는 개발 환경을 제공합니다.

## 🌐 공식 리소스

**공식 웹사이트**: https://budibase.com  
**GitHub 저장소**: https://github.com/Budibase/budibase  
**문서**: https://docs.budibase.com  
**커뮤니티**: https://github.com/Budibase/budibase/discussions

## 🚀 빠른 시작

### **설치 방법**
\\\`\\\`\\\`bash
# Docker를 사용한 설치
docker run -it --name budibase-server -p 80:80 budibase/budibase:latest
\\\`\\\`\\\`

### **지원되는 환경**
- **Docker** 컨테이너
- **Kubernetes** 클러스터
- **클라우드** 플랫폼
- **로컬** 개발 환경

## 🔮 지속적인 발전

### **활발한 커뮤니티**
GitHub에서 활발한 이슈 관리와 기여가 이루어지고 있으며, 사용자 피드백을 적극적으로 반영하고 있습니다.

### **정기적인 업데이트**
새로운 기능과 개선사항이 지속적으로 추가되어 현대적인 개발 요구사항에 부합합니다.

### **엔터프라이즈 지원**
대기업 환경에서도 안정적으로 사용할 수 있는 확장성과 보안 기능을 제공합니다.

## 🏆 결론: 빠른 비즈니스 앱 개발의 새로운 표준

Budibase는 **분 단위로 비즈니스 앱을 구축**할 수 있는 혁신적인 플랫폼입니다.

다양한 데이터 소스와의 완벽한 연동, Docker/Kubernetes 지원, 그리고 **전 세계 20만 팀의 검증된 신뢰성**을 바탕으로 현대적인 비즈니스 요구사항을 완벽하게 해결합니다.

**Budibase와 함께 여러분의 비즈니스 워크플로우를 혁신적으로 개선해보세요!** 🏗️✨

---

*🏗️ Budibase의 강력한 비즈니스 앱 빌더가 궁금하다면, 좋아요와 댓글로 여러분의 워크플로우 자동화 경험을 공유해주세요!*`

  const excerpt =
    'Budibase가 비즈니스 앱 개발을 혁신합니다! 25K+ 스타를 기록한 워크플로우 자동화 플랫폼으로 전 세계 20만 팀이 선택한 검증된 솔루션을 완전 분석합니다.'

  const slug =
    'budibase-enterprise-workflow-automation-low-code-platform-25k-jan2025'

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
          'Budibase: 비즈니스 앱 빌더 25K Stars - 워크플로우 자동화 플랫폼',
        metaDescription: excerpt,
        viewCount: getRandomViewCount(150, 300),
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
    const tags = [
      { name: 'Budibase 솔루션', slug: 'budibase-solution', color: '#6366f1' },
      {
        name: '기업 앱 빌더',
        slug: 'enterprise-app-builder',
        color: '#059669',
      },
      {
        name: '비즈니스 프로세스 자동화',
        slug: 'business-process-automation',
        color: '#dc2626',
      },
      {
        name: '엔터프라이즈 로우코드',
        slug: 'enterprise-lowcode-platform',
        color: '#7c3aed',
      },
      {
        name: '컨테이너 기반 배포',
        slug: 'container-based-deployment',
        color: '#ea580c',
      },
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
createBudibasePost()
  .then(() => {
    console.log('🎉 Budibase 비즈니스 앱 빌더 오픈소스 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
