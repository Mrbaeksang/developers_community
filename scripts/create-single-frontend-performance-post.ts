import { PrismaClient, PostStatus, GlobalRole } from '@prisma/client'

const prisma = new PrismaClient()

async function createSingleFrontendPerformancePost() {
  const categoryId = 'cmdrfyb5f0000u8fsih05gxfk' // Frontend 카테고리
  const authorId = 'cmdri2tj90000u8vgtyir9upy' // 관리자 사용자

  // 랜덤 조회수 생성 함수
  const getRandomViewCount = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const title =
    '⚡ 2025년 웹 성능 최적화 실전 가이드! Core Web Vitals 완전 정복하기'

  const content = `# ⚡ 2025년 웹 성능 최적화 실전 가이드! Core Web Vitals 완전 정복하기

## 🎯 웹 성능이 비즈니스를 좌우하는 시대

안녕하세요! 2025년 현재 웹 성능은 선택이 아닌 **필수**가 되었어요. 구글이 **INP(Interaction to Next Paint)**를 새로운 Core Web Vitals로 공식 채택하면서, 웹 성능 최적화의 기준이 완전히 바뀌었거든요.

**놀라운 성과 사례들:**
- **Economic Times**: LCP 80% 개선 → 이탈률 43% 감소
- **Agrofy**: INP 70% 개선 → 세션 이탈률 3.8% → 0.9%
- **Yahoo! JAPAN**: 성능 개선 → 세션 지속시간 13.3% 증가

이제 웹 성능은 **SEO 순위, 사용자 경험, 매출**에 직접적인 영향을 미치는 핵심 지표입니다. 2025년 최신 성능 최적화 기법들을 실전 코드와 함께 완전 정복해보세요!

## 🚀 2025년 Core Web Vitals의 새로운 기준

### 1. INP (Interaction to Next Paint) - 새로운 핵심 지표

**FID가 INP로 교체된 이유:**
- **FID 한계**: 첫 상호작용만 측정, 그 이후 반응성 무시
- **INP 장점**: 페이지 전체 생명주기 동안의 반응성 측정
- **새로운 목표**: INP < 200ms (기존 FID < 100ms보다 까다로워짐)

\`\`\`javascript
// INP 측정 및 최적화
class INPOptimizer {
  constructor() {
    this.setupINPMonitoring();
    this.optimizeEventHandlers();
  }
  
  setupINPMonitoring() {
    // INP 측정을 위한 Event Timing API
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'event') {
          const delay = entry.processingStart - entry.startTime;
          const duration = entry.processingEnd - entry.processingStart;
          const presentation = entry.startTime + entry.duration - entry.processingEnd;
          
          console.log(\`Event: \${entry.name}\`);
          console.log(\`Input Delay: \${delay}ms\`);
          console.log(\`Processing Time: \${duration}ms\`);
          console.log(\`Presentation Delay: \${presentation}ms\`);
          console.log(\`Total INP: \${entry.duration}ms\`);
          
          // INP가 200ms 넘으면 경고
          if (entry.duration > 200) {
            this.flagSlowInteraction(entry);
          }
        }
      });
    });
    
    observer.observe({ 
      entryTypes: ['event'],
      durationThreshold: 16 // 16ms 이상 걸리는 이벤트만 관찰
    });
  }
  
  // 느린 상호작용 분석 및 최적화
  flagSlowInteraction(entry) {
    console.warn(\`🐌 느린 상호작용 감지: \${entry.name} (\${entry.duration}ms)\`);
    
    // 자동 최적화 제안
    const suggestions = this.getOptimizationSuggestions(entry);
    console.log('최적화 제안:', suggestions);
    
    // 실시간 모니터링 데이터 전송 (optional)
    this.sendPerformanceData(entry);
  }
  
  getOptimizationSuggestions(entry) {
    const suggestions = [];
    
    if (entry.processingStart - entry.startTime > 100) {
      suggestions.push('메인 스레드 블로킹 작업을 Web Worker로 이동 고려');
    }
    
    if (entry.processingEnd - entry.processingStart > 50) {
      suggestions.push('이벤트 핸들러 로직을 간소화하거나 분할 실행');
    }
    
    if (entry.startTime + entry.duration - entry.processingEnd > 50) {
      suggestions.push('DOM 업데이트를 batch 처리로 최적화');
    }
    
    return suggestions;
  }
}

// 사용 예시
const inpOptimizer = new INPOptimizer();
\`\`\`

### 2. LCP (Largest Contentful Paint) 최적화

\`\`\`javascript
// LCP 최적화 전략
class LCPOptimizer {
  constructor() {
    this.identifyLCPElement();
    this.optimizeResourceLoading();
  }
  
  identifyLCPElement() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP Element:', entry.element);
          console.log('LCP Time:', entry.renderTime || entry.loadTime);
          
          // LCP 요소 최적화 적용
          this.optimizeLCPElement(entry.element);
        }
      });
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }
  
  optimizeLCPElement(element) {
    if (element.tagName === 'IMG') {
      // 이미지 LCP 최적화
      this.optimizeLCPImage(element);
    } else if (element.tagName === 'VIDEO') {
      // 비디오 LCP 최적화  
      this.optimizeLCPVideo(element);
    } else {
      // 텍스트 LCP 최적화
      this.optimizeLCPText(element);
    }
  }
  
  optimizeLCPImage(img) {
    // 1. 우선순위 로딩 설정
    img.loading = 'eager';
    img.fetchPriority = 'high';
    
    // 2. 적절한 이미지 포맷 사용
    if (!img.src.includes('.webp') && !img.src.includes('.avif')) {
      console.warn('LCP 이미지는 WebP 또는 AVIF 포맷 사용을 권장합니다');
    }
    
    // 3. 반응형 이미지 최적화
    if (!img.sizes) {
      console.warn('LCP 이미지에 sizes 속성 추가를 권장합니다');
    }
    
    // 4. 프리로드 링크 자동 생성
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = img.src;
    preloadLink.fetchPriority = 'high';
    document.head.appendChild(preloadLink);
  }
  
  optimizeLCPVideo(video) {
    // 비디오 포스터 이미지 최적화
    if (video.poster) {
      const posterImg = new Image();
      posterImg.src = video.poster;
      posterImg.loading = 'eager';
      posterImg.fetchPriority = 'high';
    }
    
    // 자동재생 비디오 최적화
    if (video.autoplay) {
      video.preload = 'auto';
    }
  }
  
  optimizeLCPText(element) {
    // 폰트 최적화
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.fontFamily;
    
    // 웹폰트 프리로드 확인
    const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
    const hasFontPreload = Array.from(fontPreloads).some(link => 
      link.href.includes(fontFamily.replace(/['"]/g, ''))
    );
    
    if (!hasFontPreload) {
      console.warn('LCP 텍스트의 웹폰트 프리로드를 권장합니다');
    }
  }
}
\`\`\`

### 3. CLS (Cumulative Layout Shift) 완전 제거

\`\`\`javascript
// CLS 제로를 위한 고급 기법
class CLSEliminator {
  constructor() {
    this.monitorLayoutShifts();
    this.preventCommonShifts();
  }
  
  monitorLayoutShifts() {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // 사용자 입력으로 인한 shift는 제외
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log(\`CLS 증가: +\${entry.value} (총 \${clsValue})\`);
          
          // shift를 일으킨 요소들 분석
          entry.sources.forEach(source => {
            console.log('Shift 원인:', source.node, source.previousRect, source.currentRect);
            this.fixLayoutShift(source.node);
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    
    // 페이지 종료시 최종 CLS 값 보고
    window.addEventListener('beforeunload', () => {
      console.log(\`최종 CLS: \${clsValue}\`);
      if (clsValue > 0.1) {
        console.warn('CLS가 권장 기준(0.1)을 초과했습니다');
      }
    });
  }
  
  preventCommonShifts() {
    // 1. 이미지 영역 예약
    this.reserveImageSpace();
    
    // 2. 폰트 로딩 최적화
    this.optimizeFontLoading();
    
    // 3. 동적 콘텐츠 공간 예약
    this.reserveDynamicContentSpace();
  }
  
  reserveImageSpace() {
    const images = document.querySelectorAll('img:not([width]):not([height])');
    
    images.forEach(img => {
      // aspect-ratio CSS 속성 활용
      if (img.dataset.aspectRatio) {
        img.style.aspectRatio = img.dataset.aspectRatio;
      } else {
        // 이미지 로드 후 aspect-ratio 계산
        img.addEventListener('load', () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          img.style.aspectRatio = aspectRatio.toString();
          img.dataset.aspectRatio = aspectRatio.toString();
        }, { once: true });
      }
      
      // 로딩 중 플레이스홀더 표시
      img.style.backgroundColor = '#f0f0f0';
      img.style.minHeight = '200px';
    });
  }
  
  optimizeFontLoading() {
    // font-display: swap 사용시 FOUT 최소화
    const style = document.createElement('style');
    style.textContent = \`
      /* 웹폰트 fallback 폰트와 크기 맞춤 */
      @font-face {
        font-family: 'OptimizedWebFont';
        src: url('/fonts/main-font.woff2') format('woff2');
        font-display: optional; /* CLS 방지를 위해 optional 사용 */
        size-adjust: 100%; /* fallback 폰트와 크기 동일하게 조정 */
      }
      
      /* fallback 폰트 스타일 최적화 */
      body {
        font-family: 'OptimizedWebFont', 
                     -apple-system, 
                     BlinkMacSystemFont, 
                     'Malgun Gothic', 
                     sans-serif;
      }
    \`;
    document.head.appendChild(style);
  }
  
  reserveDynamicContentSpace() {
    // 광고, 위젯 등을 위한 공간 예약
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');
    
    dynamicContainers.forEach(container => {
      const expectedHeight = container.dataset.expectedHeight || '250px';
      const expectedWidth = container.dataset.expectedWidth || '100%';
      
      container.style.minHeight = expectedHeight;
      container.style.width = expectedWidth;
      container.style.backgroundColor = 'rgba(0,0,0,0.02)';
      
      // 스켈레톤 UI 추가
      this.addSkeletonUI(container);
    });
  }
  
  addSkeletonUI(container) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-loader';
    skeleton.style.cssText = \`
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
    \`;
    
    // 스켈레톤 애니메이션 CSS
    if (!document.querySelector('#skeleton-animation')) {
      const animationStyle = document.createElement('style');
      animationStyle.id = 'skeleton-animation';
      animationStyle.textContent = \`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      \`;
      document.head.appendChild(animationStyle);
    }
    
    container.appendChild(skeleton);
  }
  
  fixLayoutShift(element) {
    // 동적으로 크기가 변하는 요소에 고정 크기 적용
    const rect = element.getBoundingClientRect();
    
    if (rect.height > 0) {
      element.style.minHeight = rect.height + 'px';
    }
    
    if (rect.width > 0) {
      element.style.minWidth = rect.width + 'px';
    }
  }
}
\`\`\`

## 🔧 2025년 최신 빌드 도구 활용법

### 1. esbuild: 25배 빠른 번들링

\`\`\`javascript
// esbuild 설정 최적화
import { build } from 'esbuild';
import { readFileSync } from 'fs';

const buildConfig = {
  // 입력 파일들
  entryPoints: {
    main: 'src/main.tsx',
    worker: 'src/service-worker.ts',
    // 페이지별 청크 분리로 초기 로딩 최적화
    about: 'src/pages/about.tsx',
    contact: 'src/pages/contact.tsx'
  },
  
  // 출력 설정
  outdir: 'dist',
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  
  // 최적화 옵션
  bundle: true,
  minify: true,
  sourcemap: true,
  splitting: true, // 코드 스플리팅 자동화
  treeShaking: true,
  
  // 메타파일 생성으로 번들 분석 가능
  metafile: true,
  
  // 플러그인으로 기능 확장
  plugins: [
    // CSS 모듈 지원
    {
      name: 'css-modules',
      setup(build) {
        build.onLoad({ filter: /\\.module\\.css$/ }, async (args) => {
          const css = await readFileSync(args.path, 'utf8');
          // CSS 모듈 처리 로직
          return {
            contents: css,
            loader: 'css'
          };
        });
      }
    },
    
    // 이미지 최적화
    {
      name: 'image-optimizer',
      setup(build) {
        build.onLoad({ filter: /\\.(png|jpg|jpeg|gif|svg)$/ }, async (args) => {
          // 이미지 최적화 및 WebP 변환 로직
          return {
            contents: optimizedImageBuffer,
            loader: 'dataurl'
          };
        });
      }
    }
  ],
  
  // 외부 의존성 처리
  external: ['react', 'react-dom'], // CDN에서 로드할 라이브러리들
  
  // Define으로 환경변수 주입
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.API_URL': '"https://api.example.com"'
  }
};

// 빌드 실행 및 성능 측정
const startTime = Date.now();

const result = await build(buildConfig);

const buildTime = Date.now() - startTime;
console.log(\`빌드 완료: \${buildTime}ms\`);

// 번들 크기 분석
if (result.metafile) {
  const analysis = await analyzeMetafile(result.metafile);
  console.log('번들 분석:', analysis);
}
\`\`\`

### 2. HTTP/3와 에셋 최적화

\`\`\`javascript
// HTTP/3 활용 리소스 로딩 최적화
class HTTP3ResourceOptimizer {
  constructor() {
    this.setupResourceHints();
    this.optimizeAssetLoading();
  }
  
  setupResourceHints() {
    // DNS 프리페치
    const dnsPrefetchHosts = [
      'https://fonts.googleapis.com',
      'https://api.example.com',
      'https://cdn.example.com'
    ];
    
    dnsPrefetchHosts.forEach(host => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = host;
      document.head.appendChild(link);
    });
    
    // 중요한 리소스 프리로드
    const criticalResources = [
      { href: '/critical.css', as: 'style', type: 'text/css' },
      { href: '/hero-image.webp', as: 'image', type: 'image/webp' },
      { href: '/main-font.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.assign(link, resource);
      document.head.appendChild(link);
    });
  }
  
  optimizeAssetLoading() {
    // 이미지 지연 로딩 및 포맷 최적화
    this.setupLazyLoading();
    
    // 폰트 로딩 최적화
    this.optimizeFonts();
    
    // JavaScript 번들 최적화
    this.optimizeScripts();
  }
  
  setupLazyLoading() {
    // Intersection Observer로 이미지 지연 로딩
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // WebP 지원 확인 후 최적 포맷 선택
          this.loadOptimalImage(img);
          
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // 뷰포트 50px 전에 미리 로딩
    });
    
    // data-src 속성을 가진 이미지들 관찰
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  async loadOptimalImage(img) {
    const baseUrl = img.dataset.src.replace(/\\.[^.]+$/, ''); // 확장자 제거
    
    // 브라우저별 최적 포맷 확인
    const supportedFormats = await this.checkImageFormats();
    
    let finalUrl;
    if (supportedFormats.avif) {
      finalUrl = baseUrl + '.avif';
    } else if (supportedFormats.webp) {
      finalUrl = baseUrl + '.webp';
    } else {
      finalUrl = img.dataset.src; // 원본 포맷
    }
    
    // 이미지 로딩 및 에러 처리
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = finalUrl;
      img.classList.add('loaded');
    };
    tempImg.onerror = () => {
      img.src = img.dataset.src; // 폴백
    };
    tempImg.src = finalUrl;
  }
  
  async checkImageFormats() {
    const formats = {};
    
    // AVIF 지원 확인
    formats.avif = await this.canLoadImage('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=');
    
    // WebP 지원 확인  
    formats.webp = await this.canLoadImage('data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA');
    
    return formats;
  }
  
  canLoadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
  
  optimizeFonts() {
    // 시스템 폰트 우선 사용으로 FOUT 최소화
    document.fonts.ready.then(() => {
      console.log('모든 폰트 로딩 완료');
      
      // 폰트 로딩 후 추가 최적화 작업
      this.adjustFontDisplay();
    });
  }
  
  adjustFontDisplay() {
    // 폰트 로딩 후 레이아웃 재계산 최소화
    const textElements = document.querySelectorAll('h1, h2, h3, p, span');
    
    textElements.forEach(element => {
      // 폰트 변경으로 인한 CLS 방지
      const computedStyle = window.getComputedStyle(element);
      element.style.minHeight = computedStyle.lineHeight;
    });
  }
}
\`\`\`

## 📊 실시간 성능 모니터링 시스템

\`\`\`javascript
// 종합 성능 모니터링 클래스
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // Core Web Vitals 측정
    this.measureCoreWebVitals();
    
    // 사용자 정의 메트릭 측정
    this.measureCustomMetrics();
    
    // 실시간 성능 데이터 전송
    this.setupRealtimeReporting();
  }
  
  measureCoreWebVitals() {
    // Web Vitals 라이브러리 동적 로드
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB, getINP }) => {
      // LCP (Largest Contentful Paint)
      getLCP((metric) => {
        this.metrics.lcp = metric.value;
        console.log('LCP:', metric.value);
        this.sendMetric('lcp', metric);
      });
      
      // FID (First Input Delay) - 레거시 지원
      getFID((metric) => {
        this.metrics.fid = metric.value;
        console.log('FID:', metric.value);
        this.sendMetric('fid', metric);
      });
      
      // INP (Interaction to Next Paint) - 새로운 핵심 지표
      getINP((metric) => {
        this.metrics.inp = metric.value;
        console.log('INP:', metric.value);
        this.sendMetric('inp', metric);
        
        // INP가 200ms 초과시 알림
        if (metric.value > 200) {
          this.alertSlowInteraction(metric);
        }
      });
      
      // CLS (Cumulative Layout Shift)
      getCLS((metric) => {
        this.metrics.cls = metric.value;
        console.log('CLS:', metric.value);
        this.sendMetric('cls', metric);
        
        // CLS가 0.1 초과시 경고
        if (metric.value > 0.1) {
          this.alertLayoutShift(metric);
        }
      });
      
      // FCP (First Contentful Paint)
      getFCP((metric) => {
        this.metrics.fcp = metric.value;
        console.log('FCP:', metric.value);
        this.sendMetric('fcp', metric);
      });
      
      // TTFB (Time to First Byte)
      getTTFB((metric) => {
        this.metrics.ttfb = metric.value;
        console.log('TTFB:', metric.value);
        this.sendMetric('ttfb', metric);
      });
    });
  }
  
  measureCustomMetrics() {
    // 커스텀 타이밍 측정
    performance.mark('app-start');
    
    // React 컴포넌트 렌더링 시간
    this.measureReactPerformance();
    
    // API 호출 성능
    this.measureAPIPerformance();
    
    // 메모리 사용량
    this.measureMemoryUsage();
  }
  
  measureReactPerformance() {
    // React DevTools Profiler API 활용
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const profiler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent;
      
      if (profiler) {
        // 컴포넌트별 렌더링 시간 측정
        profiler.addListener('profilingData', (data) => {
          console.log('React 프로파일링 데이터:', data);
          this.sendMetric('react-performance', data);
        });
      }
    }
    
    // 수동 React 성능 측정
    const originalRender = React.createElement;
    React.createElement = (...args) => {
      const startTime = performance.now();
      const result = originalRender.apply(this, args);
      const endTime = performance.now();
      
      // 렌더링에 16ms 이상 걸리는 컴포넌트 감지
      if (endTime - startTime > 16) {
        console.warn(\`느린 컴포넌트 렌더링: \${args[0]?.name || args[0]} (\${endTime - startTime}ms)\`);
      }
      
      return result;
    };
  }
  
  measureAPIPerformance() {
    // Fetch API 래핑으로 네트워크 성능 측정
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // API 응답 시간 로깅
        console.log(\`API 응답: \${url} (\${duration}ms)\`);
        
        // 느린 API 호출 경고 (1초 이상)
        if (duration > 1000) {
          console.warn(\`느린 API 응답: \${url} (\${duration}ms)\`);
          this.sendMetric('slow-api', { url, duration });
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.error(\`API 에러: \${url} (\${duration}ms)\`, error);
        this.sendMetric('api-error', { url, duration, error: error.message });
        
        throw error;
      }
    };
  }
  
  measureMemoryUsage() {
    // 메모리 사용량 모니터링 (Chrome만 지원)
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        const memoryData = {
          used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) // MB
        };
        
        console.log('메모리 사용량:', memoryData);
        
        // 메모리 사용률이 80% 넘으면 경고
        if (memoryData.used / memoryData.limit > 0.8) {
          console.warn('높은 메모리 사용량 감지:', memoryData);
          this.sendMetric('high-memory-usage', memoryData);
        }
        
        this.metrics.memory = memoryData;
      }, 30000); // 30초마다 체크
    }
  }
  
  setupRealtimeReporting() {
    // 성능 데이터를 실시간으로 서버에 전송
    setInterval(() => {
      if (Object.keys(this.metrics).length > 0) {
        this.sendBatchMetrics();
      }
    }, 60000); // 1분마다
    
    // 페이지 종료시 마지막 데이터 전송
    window.addEventListener('beforeunload', () => {
      this.sendBatchMetrics(true); // beacon API 사용
    });
  }
  
  sendMetric(name, data) {
    // 개별 메트릭 전송
    const payload = {
      name,
      value: data.value || data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // 중요한 메트릭은 즉시 전송
    if (['lcp', 'inp', 'cls'].includes(name)) {
      this.sendToAnalytics(payload);
    }
  }
  
  sendBatchMetrics(useBeacon = false) {
    const payload = {
      metrics: this.metrics,
      timestamp: Date.now(),
      url: window.location.href,
      sessionId: this.getSessionId()
    };
    
    if (useBeacon && 'sendBeacon' in navigator) {
      // 페이지 종료시 beacon API로 확실한 전송
      navigator.sendBeacon('/api/performance', JSON.stringify(payload));
    } else {
      // 일반적인 fetch 전송
      this.sendToAnalytics(payload);
    }
  }
  
  async sendToAnalytics(data) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('성능 데이터 전송 실패:', error);
    }
  }
  
  getSessionId() {
    let sessionId = sessionStorage.getItem('performance-session-id');
    if (!sessionId) {
      sessionId = 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('performance-session-id', sessionId);
    }
    return sessionId;
  }
  
  alertSlowInteraction(metric) {
    // 느린 상호작용 알림
    const notification = document.createElement('div');
    notification.className = 'performance-alert';
    notification.innerHTML = \`
      <div class="alert-content">
        <h4>⚠️ 느린 상호작용 감지</h4>
        <p>응답 시간: \${metric.value}ms (권장: < 200ms)</p>
        <small>사용자 경험 개선이 필요합니다.</small>
      </div>
    \`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
  }
  
  alertLayoutShift(metric) {
    // 레이아웃 이동 알림
    console.warn(\`레이아웃 이동 감지: CLS \${metric.value} (권장: < 0.1)\`);
    
    // 시각적 디버깅 도구 활성화
    this.highlightShiftingElements();
  }
  
  highlightShiftingElements() {
    // CLS를 일으키는 요소들 시각적으로 표시
    const style = document.createElement('style');
    style.textContent = \`
      .layout-shift-debug {
        outline: 3px solid red !important;
        background: rgba(255, 0, 0, 0.1) !important;
      }
    \`;
    document.head.appendChild(style);
  }
}

// 성능 모니터링 시작
const performanceMonitor = new PerformanceMonitor();
\`\`\`

## 🎯 실전 최적화 체크리스트

### 즉시 적용 가능한 최적화 기법

\`\`\`javascript
// 1. Critical Resource Hints
const addResourceHints = () => {
  const hints = [
    // DNS 프리페치
    { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://api.example.com' },
    
    // 중요 리소스 프리로드
    { rel: 'preload', href: '/critical.css', as: 'style' },
    { rel: 'preload', href: '/hero-image.webp', as: 'image' },
    { rel: 'preload', href: '/main-font.woff2', as: 'font', crossorigin: '' },
    
    // 다음 페이지 프리페치
    { rel: 'prefetch', href: '/about' },
    { rel: 'prefetch', href: '/products' }
  ];
  
  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.assign(link, hint);
    document.head.appendChild(link);
  });
};

// 2. 이미지 최적화 자동화
const optimizeImages = () => {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    // 반응형 이미지 자동 설정
    if (!img.sizes) {
      img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    }
    
    // 지연 로딩 활성화
    if (img.loading !== 'eager') {
      img.loading = 'lazy';
    }
    
    // 디코딩 최적화
    img.decoding = 'async';
  });
};

// 3. 스크립트 최적화
const optimizeScripts = () => {
  const scripts = document.querySelectorAll('script[src]');
  
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    
    // 중요하지 않은 스크립트는 defer 처리
    if (!src.includes('critical') && !script.hasAttribute('async')) {
      script.defer = true;
    }
    
    // 외부 스크립트에 crossorigin 추가
    if (src.startsWith('http') && !script.hasAttribute('crossorigin')) {
      script.crossOrigin = 'anonymous';
    }
  });
};

// 4. 자동 최적화 실행
document.addEventListener('DOMContentLoaded', () => {
  addResourceHints();
  optimizeImages();
  optimizeScripts();
});
\`\`\`

## 📈 성과 측정과 지속적 개선

### A/B 테스트를 통한 성능 최적화

\`\`\`javascript
// 성능 최적화 A/B 테스트
class PerformanceABTest {
  constructor() {
    this.variant = this.getVariant();
    this.metrics = {};
    this.setupTest();
  }
  
  getVariant() {
    // 사용자를 두 그룹으로 분할
    const userId = this.getUserId();
    const hash = this.simpleHash(userId);
    return hash % 2 === 0 ? 'control' : 'optimized';
  }
  
  setupTest() {
    console.log(\`A/B 테스트 그룹: \${this.variant}\`);
    
    if (this.variant === 'optimized') {
      // 최적화 버전 적용
      this.applyOptimizations();
    }
    
    // 두 그룹 모두 성능 측정
    this.measurePerformance();
  }
  
  applyOptimizations() {
    // 최적화 그룹에만 적용할 기법들
    
    // 1. 적극적 프리로딩
    this.aggressivePreloading();
    
    // 2. 고급 캐싱 전략
    this.advancedCaching();
    
    // 3. 리소스 압축 최적화
    this.optimizeCompression();
  }
  
  aggressivePreloading() {
    // 사용자 행동 패턴 기반 예측 프리로딩
    const commonNextPages = ['/products', '/about', '/contact'];
    
    // 마우스 호버시 프리페치
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (link && commonNextPages.includes(link.getAttribute('href'))) {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = link.getAttribute('href');
        document.head.appendChild(prefetchLink);
      }
    });
  }
  
  measurePerformance() {
    // 두 그룹의 성능 데이터 수집
    import('web-vitals').then(({ getCLS, getLCP, getINP }) => {
      const testData = {
        variant: this.variant,
        timestamp: Date.now(),
        url: window.location.href
      };
      
      getLCP((metric) => {
        testData.lcp = metric.value;
      });
      
      getINP((metric) => {
        testData.inp = metric.value;
      });
      
      getCLS((metric) => {
        testData.cls = metric.value;
        
        // 데이터 수집 완료 후 전송
        this.sendABTestData(testData);
      });
    });
  }
  
  async sendABTestData(data) {
    try {
      await fetch('/api/ab-test/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('A/B 테스트 데이터 전송 실패:', error);
    }
  }
  
  getUserId() {
    let userId = localStorage.getItem('user-id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user-id', userId);
    }
    return userId;
  }
  
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }
}

// A/B 테스트 시작
new PerformanceABTest();
\`\`\`

## 🎉 마무리: 2025년 웹 성능의 미래

2025년 웹 성능 최적화는 단순히 \"빠른 웹사이트\"를 만드는 것을 넘어서 **비즈니스 성공의 핵심 요소**가 되었어요.

**핵심 메시지:**
- 🎯 **INP < 200ms**: 새로운 상호작용 반응성 기준
- 📱 **LCP < 2.5s**: 첫 화면 로딩 최적화 필수  
- 🔄 **CLS < 0.1**: 레이아웃 이동 완전 제거
- 🚀 **빌드 도구**: esbuild로 25배 빠른 개발 환경
- 📊 **실시간 모니터링**: 지속적인 성능 개선

**한국 개발자들에게 특히 중요한 이유:**
1. **모바일 우선 시장**: 한국의 높은 모바일 사용률
2. **경쟁 우위**: 성능이 곧 사용자 만족도와 매출
3. **글로벌 진출**: 해외 시장에서도 통하는 품질
4. **개발 효율성**: 자동화된 최적화로 개발 속도 향상

지금 바로 여러분의 웹사이트에 이 기법들을 적용해보세요. 성능 향상의 효과를 체감하게 될 거예요! 🚀

---

*성능 최적화 과정에서 도움이 필요하시거나 추가 질문이 있으시면 댓글로 남겨주세요. 함께 더 빠른 웹을 만들어가요!*`

  const excerpt =
    '2025년 웹 성능 최적화의 모든 것을 담았습니다. 새로운 Core Web Vitals 기준 INP부터 esbuild 활용법, HTTP/3 최적화, 실시간 성능 모니터링까지 실전에서 바로 적용 가능한 고급 기법들을 코드와 함께 상세히 안내합니다.'

  const slug =
    'web-performance-optimization-core-web-vitals-complete-guide-2025'

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
        // 스키마 필드 완전 활용 (모든 필드 포함 필수)
        approvedAt: new Date(),
        approvedById: authorId,
        rejectedReason: null, // 승인된 게시글이므로 null
        metaTitle: title,
        metaDescription: excerpt,
        viewCount: getRandomViewCount(90, 190), // Frontend 카테고리 조회수 범위
        likeCount: 0,
        commentCount: 0,
      },
    })

    // 관련 태그 생성 및 연결 (최대 5개)
    const tags = [
      { name: 'Core Web Vitals', slug: 'core-web-vitals', color: '#e74c3c' },
      { name: '웹 성능 최적화', slug: 'web-performance', color: '#3498db' },
      { name: 'INP', slug: 'inp', color: '#f39c12' },
      { name: 'esbuild', slug: 'esbuild', color: '#2ecc71' },
      { name: 'HTTP/3', slug: 'http3', color: '#9b59b6' },
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
    console.log(`📝 게시글 ID: ${post.id}`)
    console.log(`🔗 슬러그: ${post.slug}`)
    console.log(`👁️ 조회수: ${post.viewCount}`)
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
createSingleFrontendPerformancePost()
  .then(() => {
    console.log('🎉 성능 최적화 Frontend 게시글 생성 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 오류:', error)
    process.exit(1)
  })
