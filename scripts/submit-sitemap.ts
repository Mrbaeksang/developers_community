#!/usr/bin/env node

/**
 * 사이트맵 제출 스크립트
 * 
 * 사용법:
 * 1. Google Search Console에서 인증 완료 후 실행
 * 2. npx tsx scripts/submit-sitemap.ts
 */

const SITEMAP_URL = 'https://devcom.kr/sitemap.xml'

// Google에 사이트맵 핑
async function pingGoogle() {
  const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(
    SITEMAP_URL
  )}`
  
  try {
    const response = await fetch(googlePingUrl)
    if (response.ok) {
      console.log('✅ Google에 사이트맵 제출 성공')
    } else {
      console.log('⚠️ Google 응답:', response.status)
    }
  } catch (error) {
    console.error('❌ Google 제출 실패:', error)
  }
}

// Bing에 사이트맵 핑
async function pingBing() {
  const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(
    SITEMAP_URL
  )}`
  
  try {
    const response = await fetch(bingPingUrl)
    if (response.ok) {
      console.log('✅ Bing에 사이트맵 제출 성공')
    } else {
      console.log('⚠️ Bing 응답:', response.status)
    }
  } catch (error) {
    console.error('❌ Bing 제출 실패:', error)
  }
}

// 사이트맵 유효성 검사
async function validateSitemap() {
  try {
    const response = await fetch(SITEMAP_URL)
    if (!response.ok) {
      console.error('❌ 사이트맵 접근 불가:', response.status)
      return false
    }
    
    const text = await response.text()
    if (text.includes('<urlset') && text.includes('</urlset>')) {
      console.log('✅ 사이트맵 유효성 검사 통과')
      
      // URL 개수 확인
      const urlCount = (text.match(/<url>/g) || []).length
      console.log(`📊 총 ${urlCount}개의 URL 포함`)
      
      return true
    } else {
      console.error('❌ 유효하지 않은 사이트맵 형식')
      return false
    }
  } catch (error) {
    console.error('❌ 사이트맵 검증 실패:', error)
    return false
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 사이트맵 제출 시작...')
  console.log(`📍 사이트맵 URL: ${SITEMAP_URL}`)
  console.log('')
  
  // 1. 사이트맵 유효성 검사
  const isValid = await validateSitemap()
  if (!isValid) {
    console.error('⛔ 사이트맵이 유효하지 않아 제출을 중단합니다.')
    process.exit(1)
  }
  
  console.log('')
  
  // 2. 검색 엔진에 제출
  await Promise.all([pingGoogle(), pingBing()])
  
  console.log('')
  console.log('📝 추가 작업:')
  console.log('1. Google Search Console에 로그인')
  console.log('2. Sitemaps 메뉴에서 수동으로 제출')
  console.log('3. Naver 웹마스터 도구에서도 제출')
  console.log('')
  console.log('✨ 완료!')
}

// 스크립트 실행
main().catch(console.error)