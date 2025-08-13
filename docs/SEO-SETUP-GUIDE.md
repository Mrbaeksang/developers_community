# SEO 설정 가이드 - devcom.kr

## 📋 현재 상태
- ✅ sitemap.xml 자동 생성 구현
- ✅ robots.txt 설정 완료
- ✅ 메타 태그 기본 설정
- ❌ Google Search Console 미인증
- ❌ 구조화된 데이터 미설정
- ❌ 사이트맵 미제출

## 🔧 필수 설정 작업

### 1. Google Search Console 설정

#### Step 1: Google Search Console 접속
1. https://search.google.com/search-console 접속
2. Google 계정으로 로그인
3. "속성 추가" 클릭

#### Step 2: 도메인 인증
1. URL 접두어 방식 선택: `https://devcom.kr` 입력
2. 인증 방법 중 "HTML 태그" 선택
3. 제공된 메타 태그 복사:
   ```html
   <meta name="google-site-verification" content="실제코드값" />
   ```

#### Step 3: 인증 코드 적용
`app/layout.tsx` 파일의 66번 줄 수정:
```typescript
verification: {
  google: '실제코드값', // 'google-site-verification-code-here' 대체
},
```

#### Step 4: 사이트맵 제출
1. Search Console에서 "Sitemaps" 메뉴 클릭
2. `https://devcom.kr/sitemap.xml` 입력 후 제출
3. 상태가 "성공"으로 표시될 때까지 대기

### 2. Naver 웹마스터 도구 설정

#### Step 1: 네이버 서치어드바이저 접속
1. https://searchadvisor.naver.com 접속
2. 네이버 계정으로 로그인
3. "사이트 등록" 클릭

#### Step 2: 사이트 인증
1. `https://devcom.kr` 입력
2. HTML 태그 인증 방식 선택
3. 제공된 메타 태그 값 복사

#### Step 3: 인증 코드 적용
`app/layout.tsx` 파일의 68번 줄 수정:
```typescript
other: {
  'naver-site-verification': '실제코드값', // 'naver-site-verification-code-here' 대체
},
```

### 3. 검색 엔진 색인 요청

#### Google
1. Search Console > URL 검사
2. `https://devcom.kr` 입력
3. "색인 생성 요청" 클릭

#### Naver
1. 서치어드바이저 > 웹페이지 수집
2. 수집 요청 클릭
3. 홈페이지 URL 입력

## 📊 모니터링

### 확인 주기
- **1주차**: 사이트맵 크롤링 상태 확인
- **2주차**: 첫 페이지 색인 여부 확인
- **3-4주차**: 검색 결과 노출 확인

### 주요 지표
- 색인된 페이지 수
- 평균 게재 순위
- 클릭률 (CTR)
- 노출수

## 🎯 추가 최적화 제안

### 1. 콘텐츠 최적화
- 각 페이지별 고유한 메타 설명 작성
- H1 태그 최적화
- 내부 링크 구조 개선

### 2. 성능 최적화
- Core Web Vitals 개선
- 이미지 최적화 (WebP 변환)
- 캐싱 정책 강화

### 3. 백링크 확보
- 관련 커뮤니티 활동
- 기술 블로그 게스트 포스팅
- GitHub 프로젝트 연동

## 📝 체크리스트

- [ ] Google Search Console 인증 코드 적용
- [ ] Naver 웹마스터 도구 인증 코드 적용
- [ ] 사이트맵 제출 (Google)
- [ ] 사이트맵 제출 (Naver)
- [ ] 색인 요청
- [ ] 1주 후 크롤링 상태 확인
- [ ] 2주 후 색인 상태 확인
- [ ] 구조화된 데이터 추가
- [ ] 페이지별 메타 태그 최적화

## 🔗 유용한 링크

- [Google Search Console](https://search.google.com/search-console)
- [Naver 서치어드바이저](https://searchadvisor.naver.com)
- [Google 구조화된 데이터 테스트](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Google 검색 가이드](https://developers.google.com/search/docs)