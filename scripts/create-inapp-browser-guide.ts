import { prisma } from '@/lib/core/prisma'

// 관리자 정보 및 상수
const ADMIN_USER_ID = 'cmdri2tj90000u8vgtyir9upy'
const ADMIN_ROLE = 'ADMIN'

// Frontend 카테고리 ID
const FRONTEND_CATEGORY_ID = 'cmdrfyb5f0000u8fsih05gxfk'

// 랜덤 조회수 생성
const getRandomViewCount = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

async function createInAppBrowserGuide() {
  const content = `# 🚀 인앱 브라우저 감지하고 외부 브라우저로 안내하기 - 완벽 가이드

## 🎯 한 줄 요약
**카카오톡, 네이버, 인스타그램 등 인앱 브라우저를 감지하고 사용자를 외부 브라우저로 안내하는 완벽한 솔루션!**

![인앱 브라우저 감지 메인 이미지](https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop)

## 🤔 이런 고민 있으신가요?

여러분, 혹시 이런 경험 있으신가요?

- **카카오톡으로 링크 공유했는데** Google 로그인이 안 돼요! 😱
- **인스타그램 프로필 링크**에서 결제가 막혀요! 💸
- **네이버 앱**에서 파일 다운로드가 안 돼요! 📥

![인앱 브라우저 문제 상황](https://images.unsplash.com/photo-1555421689-491a97ff2040?w=1200&h=600&fit=crop)

## 💡 왜 인앱 브라우저가 문제일까요?

### 🔒 인앱 브라우저의 제한사항

인앱 브라우저는 앱 내부에서 실행되는 **제한된 웹뷰**입니다:

- **OAuth 로그인 차단** (Google, Facebook 등)
- **파일 다운로드 제한**
- **쿠키/세션 저장 문제**
- **결제 모듈 호환성 이슈**
- **Web API 일부 미지원**

## 🎯 완벽한 해결책: User Agent 감지 + 스마트 안내

### Step 1: 인앱 브라우저 감지하기

**모든 주요 인앱 브라우저를 감지하는 완벽한 코드:**

\`\`\`typescript
// utils/detectInAppBrowser.ts
export function detectInAppBrowser(): {
  isInApp: boolean
  browserName: string | null
} {
  const userAgent = navigator.userAgent.toLowerCase()
  
  // 카카오톡
  if (userAgent.includes('kakaotalk')) {
    return { isInApp: true, browserName: 'KakaoTalk' }
  }
  
  // 네이버 앱
  if (userAgent.includes('naver') || userAgent.includes('line')) {
    return { isInApp: true, browserName: 'Naver/Line' }
  }
  
  // 페이스북
  if (userAgent.includes('fban') || userAgent.includes('fbav')) {
    return { isInApp: true, browserName: 'Facebook' }
  }
  
  // 인스타그램
  if (userAgent.includes('instagram')) {
    return { isInApp: true, browserName: 'Instagram' }
  }
  
  // 트위터
  if (userAgent.includes('twitter')) {
    return { isInApp: true, browserName: 'Twitter' }
  }
  
  // LinkedIn
  if (userAgent.includes('linkedin')) {
    return { isInApp: true, browserName: 'LinkedIn' }
  }
  
  // Slack
  if (userAgent.includes('slack')) {
    return { isInApp: true, browserName: 'Slack' }
  }
  
  // Discord
  if (userAgent.includes('discord')) {
    return { isInApp: true, browserName: 'Discord' }
  }
  
  // 텔레그램
  if (userAgent.includes('telegram')) {
    return { isInApp: true, browserName: 'Telegram' }
  }
  
  // 기타 WebView 감지 (iOS/Android)
  const isIOSWebView = /iphone|ipad|ipod/.test(userAgent) && 
                       !userAgent.includes('safari')
  const isAndroidWebView = userAgent.includes('wv') || 
                           userAgent.includes('android') && 
                           !userAgent.includes('chrome')
  
  if (isIOSWebView || isAndroidWebView) {
    return { isInApp: true, browserName: 'WebView' }
  }
  
  return { isInApp: false, browserName: null }
}
\`\`\`

![코드 구조 다이어그램](https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=600&fit=crop)

### Step 2: 외부 브라우저 안내 모달 컴포넌트

**사용자 친화적인 안내 모달 구현:**

\`\`\`tsx
// components/InAppBrowserModal.tsx
import { useState, useEffect } from 'react'
import { X, ExternalLink, Copy, Check } from 'lucide-react'
import { detectInAppBrowser } from '@/utils/detectInAppBrowser'

export function InAppBrowserModal() {
  const [isVisible, setIsVisible] = useState(false)
  const [browserInfo, setBrowserInfo] = useState<{
    isInApp: boolean
    browserName: string | null
  }>({ isInApp: false, browserName: null })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // 이미 닫았으면 표시하지 않음
    if (sessionStorage.getItem('inapp-modal-closed') === 'true') {
      return
    }

    const info = detectInAppBrowser()
    setBrowserInfo(info)
    
    if (info.isInApp) {
      // 1초 후 부드럽게 표시
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem('inapp-modal-closed', 'true')
  }

  const openInExternalBrowser = () => {
    const currentUrl = window.location.href
    
    // 카카오톡 전용 딥링크
    if (browserInfo.browserName === 'KakaoTalk') {
      window.location.href = \`kakaotalk://web/openExternal?url=\${encodeURIComponent(currentUrl)}\`
      return
    }
    
    // 네이버/라인 전용
    if (browserInfo.browserName === 'Naver/Line') {
      window.location.href = \`intent://\${currentUrl.replace(/^https?:\\/\\//, '')}#Intent;scheme=http;package=com.android.chrome;end\`
      return
    }
    
    // 기본: URL 복사
    copyToClipboard()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 폴백: 구식 방법
      const textarea = document.createElement('textarea')
      textarea.value = window.location.href
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isVisible || !browserInfo.isInApp) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 모달 */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          {/* 헤더 */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <ExternalLink className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  외부 브라우저를 사용해주세요
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {browserInfo.browserName} 인앱 브라우저 감지됨
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* 설명 */}
          <div className="mb-6 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              현재 인앱 브라우저에서는 일부 기능이 제한될 수 있습니다:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                소셜 로그인 (Google, GitHub 등)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                파일 다운로드 및 업로드
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                결제 및 본인인증
              </li>
            </ul>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {browserInfo.browserName === 'KakaoTalk' && (
              <button
                onClick={openInExternalBrowser}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-3 font-medium text-black hover:bg-yellow-500 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
                Safari/Chrome으로 열기
              </button>
            )}
            
            <button
              onClick={copyToClipboard}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  URL이 복사되었습니다!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  URL 복사하기
                </>
              )}
            </button>
          </div>

          {/* 추가 안내 */}
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            복사한 URL을 Chrome, Safari 등 외부 브라우저에 붙여넣어 주세요
          </p>
        </div>
      </div>
    </div>
  )
}
\`\`\`

![모달 UI 예시](https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=1200&h=600&fit=crop)

### Step 3: 애니메이션 스타일 추가

**부드러운 애니메이션으로 UX 향상:**

\`\`\`css
/* globals.css 또는 tailwind.config.js */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.4s ease-out;
}
\`\`\`

## 🎯 실제 구현 예시

### 사용법 1: 앱 전체에 적용하기

\`\`\`tsx
// app/layout.tsx 또는 _app.tsx
import { InAppBrowserModal } from '@/components/InAppBrowserModal'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <InAppBrowserModal />
      </body>
    </html>
  )
}
\`\`\`

### 사용법 2: 특정 페이지에만 적용하기

\`\`\`tsx
// app/login/page.tsx
import { InAppBrowserModal } from '@/components/InAppBrowserModal'

export default function LoginPage() {
  return (
    <>
      <div>로그인 페이지 내용</div>
      <InAppBrowserModal />
    </>
  )
}
\`\`\`

## ⚡ 고급 기능 추가하기

### 🔥 특정 기능만 차단하기

\`\`\`typescript
// utils/inAppRestrictions.ts
export function checkFeatureAvailability(feature: string) {
  const { isInApp, browserName } = detectInAppBrowser()
  
  if (!isInApp) return { available: true }
  
  const restrictions = {
    'KakaoTalk': ['oauth', 'payment', 'download'],
    'Facebook': ['oauth', 'download'],
    'Instagram': ['oauth', 'payment'],
    'Naver/Line': ['download'],
  }
  
  const browserRestrictions = restrictions[browserName] || []
  return {
    available: !browserRestrictions.includes(feature),
    reason: browserRestrictions.includes(feature) 
      ? \`\${browserName}에서는 \${feature} 기능이 제한됩니다\`
      : null
  }
}

// 사용 예시
const canUseOAuth = checkFeatureAvailability('oauth')
if (!canUseOAuth.available) {
  showWarning(canUseOAuth.reason)
}
\`\`\`

### 🎨 커스텀 디자인 테마

\`\`\`tsx
// 다크모드 지원 + 브랜드 컬러 적용
const modalThemes = {
  kakao: 'bg-yellow-400 text-black',
  naver: 'bg-green-500 text-white',
  facebook: 'bg-blue-600 text-white',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
}

const buttonClassName = modalThemes[browserInfo.browserName] || 'bg-blue-500 text-white'
\`\`\`

## ⚡ 성능 최적화 팁

### ✅ 장점
- **사용자 경험 개선**: 명확한 안내로 이탈률 감소
- **오류 방지**: 인앱 브라우저 제한 사전 차단
- **브랜드별 최적화**: 각 앱에 맞는 해결책 제공

### ⚠️ 주의사항
- User Agent는 변경될 수 있음 (정기적 업데이트 필요)
- 일부 사용자는 모달을 거부감 있게 느낄 수 있음
- 딥링크가 모든 기기에서 작동하지 않을 수 있음

## 🚀 실전 적용 체크리스트

### 필수 구현 사항
- [ ] User Agent 감지 함수 구현
- [ ] 모달 컴포넌트 생성
- [ ] sessionStorage로 중복 표시 방지
- [ ] 카카오톡 딥링크 처리
- [ ] URL 복사 기능 구현

### 선택 구현 사항
- [ ] 애니메이션 효과 추가
- [ ] 다크모드 지원
- [ ] 다국어 지원
- [ ] 분석 이벤트 추가
- [ ] A/B 테스트 설정

## 💭 마무리

**인앱 브라우저 문제는 모든 웹 서비스의 공통 과제입니다.**

이 가이드의 솔루션을 적용하면 사용자들이 겪는 불편함을 최소화하고, 
서비스의 핵심 기능을 안정적으로 제공할 수 있습니다.

특히 **카카오톡 공유가 활발한 한국 시장**에서는 필수적인 구현이라고 할 수 있죠! 🇰🇷

**여러분의 서비스에서는 어떤 인앱 브라우저 이슈를 겪고 계신가요?** 
댓글로 경험을 공유해주세요! 🙌

---

*이 글이 도움이 되셨다면 좋아요와 공유 부탁드립니다!* ❤️

## 🔗 참고 자료

- [Kakaotalk Developer Docs - 외부 브라우저 열기](https://developers.kakao.com/docs/latest/ko/kakaotalk-social/common#open-external-browser)
- [MDN - User Agent 문자열 가이드](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/User-Agent)
- [Can I Use - Clipboard API](https://caniuse.com/mdn-api_clipboard)
`

  try {
    console.log('🎯 인앱 브라우저 가이드 게시글 생성 시작...')

    // 게시글 생성
    const post = await prisma.mainPost.create({
      data: {
        title:
          '🚀 인앱 브라우저 감지하고 외부 브라우저로 안내하기 - 완벽 가이드',
        slug: 'detect-inapp-browser-guide-2025',
        content,
        excerpt:
          '카카오톡, 네이버, 인스타그램 등 인앱 브라우저를 감지하고 사용자를 외부 브라우저로 안내하는 React/Next.js 구현 가이드. User Agent 감지, 모달 UI, 딥링크 처리까지 완벽 정리!',
        status: 'PUBLISHED',
        authorId: ADMIN_USER_ID,
        authorRole: ADMIN_ROLE,
        categoryId: FRONTEND_CATEGORY_ID,
        viewCount: getRandomViewCount(100, 250),
        metaTitle: '인앱 브라우저 감지 및 외부 브라우저 안내 가이드 | Frontend',
        metaDescription:
          '카카오톡, 네이버 등 인앱 브라우저를 감지하고 외부 브라우저로 안내하는 완벽한 솔루션. User Agent 감지, React 컴포넌트, 딥링크 처리 방법을 상세히 설명합니다.',
      },
    })

    console.log(`✅ 게시글 생성 완료!`)
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 URL: /main/posts/${post.id}`)

    // 태그 생성 및 연결
    const tagNames = [
      '인앱브라우저',
      'UserAgent',
      'React',
      'Frontend',
      '카카오톡',
      'WebView',
    ]
    console.log('🏷️ 태그 처리 중...')

    for (const tagName of tagNames) {
      let tag = await prisma.mainTag.findUnique({
        where: { name: tagName },
      })

      if (!tag) {
        tag = await prisma.mainTag.create({
          data: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-'),
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
  createInAppBrowserGuide()
    .then(() => {
      console.log('🎉 인앱 브라우저 가이드 게시글 생성 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

export { createInAppBrowserGuide }
