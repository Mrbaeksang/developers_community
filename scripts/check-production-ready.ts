#!/usr/bin/env tsx

/**
 * 프로덕션 배포 전 체크리스트 스크립트
 * 프로덕션 환경에서 발생할 수 있는 문제를 사전에 검사
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'

const prisma = new PrismaClient()

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

const results: CheckResult[] = []

// 1. API 라우트 검사 - fetch() 사용 여부 체크
async function checkAPIRoutes() {
  console.log(chalk.blue('🔍 API 라우트 검사 중...'))

  const apiDir = path.join(process.cwd(), 'app', 'api')
  const issues: string[] = []

  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else if (file === 'route.ts' || file === 'route.js') {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // fetch() 사용 검사
        if (content.includes('fetch(') && content.includes('/api/')) {
          issues.push(`${fullPath}: API 라우트 내에서 fetch() 사용 감지`)
        }

        // getApiUrl() 사용 검사
        if (content.includes('getApiUrl()')) {
          issues.push(
            `${fullPath}: API 라우트에서 getApiUrl() 사용 - 직접 DB 조회 권장`
          )
        }
      }
    }
  }

  scanDirectory(apiDir)

  results.push({
    name: 'API 라우트 검사',
    status: issues.length > 0 ? 'warning' : 'pass',
    message:
      issues.length > 0
        ? `${issues.length}개의 잠재적 문제 발견`
        : '모든 API 라우트 정상',
    details: issues,
  })
}

// 2. 서버 컴포넌트 검사 - 직접 DB 조회 사용 확인
async function checkServerComponents() {
  console.log(chalk.blue('🔍 서버 컴포넌트 검사 중...'))

  const appDir = path.join(process.cwd(), 'app')
  const issues: string[] = []
  const good: string[] = []

  function scanPages(dir: string) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !file.startsWith('api')) {
        scanPages(fullPath)
      } else if (file === 'page.tsx' || file === 'layout.tsx') {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // 서버 컴포넌트인지 확인 ('use client' 없음)
        if (
          !content.includes("'use client'") &&
          !content.includes('"use client"')
        ) {
          // API fetch 사용 검사
          if (content.includes('fetch(') && content.includes('/api/')) {
            issues.push(
              `${fullPath}: ❌ 서버 컴포넌트에서 API fetch 사용 - Prisma 직접 사용으로 변경 필요`
            )
          }
          // Prisma 직접 사용 확인 (좋은 패턴)
          else if (
            content.includes('prisma.') ||
            content.includes("import('@/lib/core/prisma')")
          ) {
            good.push(`${fullPath}: ✅ Prisma 직접 사용 (최적화됨)`)
          }
        }
      }
    }
  }

  scanPages(appDir)

  // 좋은 패턴도 로그에 출력
  if (good.length > 0) {
    console.log(chalk.green(`  ✅ ${good.length}개 페이지가 올바르게 최적화됨`))
  }

  results.push({
    name: '서버 컴포넌트 검사',
    status: issues.length > 0 ? 'warning' : 'pass',
    message:
      issues.length > 0
        ? `${issues.length}개 페이지 최적화 필요 (API 호출 → Prisma 직접 사용)`
        : `모든 서버 컴포넌트 최적화됨 (${good.length}개 페이지)`,
    details: issues,
  })
}

// 3. 환경 변수 검사
async function checkEnvironmentVariables() {
  console.log(chalk.blue('🔍 환경 변수 검사 중...'))

  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'KAKAO_CLIENT_ID',
    'KAKAO_CLIENT_SECRET',
    'OPENROUTER_API_KEY',
    'BLOB_READ_WRITE_TOKEN',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'KV_REST_API_READ_ONLY_TOKEN',
  ]

  const missing: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  // 프로덕션 URL 체크
  if (
    process.env.NEXTAUTH_URL &&
    !process.env.NEXTAUTH_URL.includes('https://')
  ) {
    missing.push('NEXTAUTH_URL이 HTTPS가 아님')
  }

  results.push({
    name: '환경 변수 검사',
    status: missing.length > 0 ? 'fail' : 'pass',
    message:
      missing.length > 0
        ? `${missing.length}개의 환경 변수 누락`
        : '모든 환경 변수 설정됨',
    details: missing,
  })
}

// 4. 데이터베이스 연결 검사
async function checkDatabaseConnection() {
  console.log(chalk.blue('🔍 데이터베이스 연결 검사 중...'))

  try {
    await prisma.$connect()

    // 기본 테이블 존재 여부 확인
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.mainCategory.count()

    results.push({
      name: '데이터베이스 연결',
      status: 'pass',
      message: `연결 성공 (사용자: ${userCount}명, 카테고리: ${categoryCount}개)`,
    })
  } catch (error) {
    results.push({
      name: '데이터베이스 연결',
      status: 'fail',
      message: '데이터베이스 연결 실패',
      details: [String(error)],
    })
  }
}

// 5. 빌드 타임 오류 검사
async function checkBuildErrors() {
  console.log(chalk.blue('🔍 빌드 가능 여부 검사 중...'))

  const { execSync } = await import('child_process')

  try {
    // TypeScript 체크
    execSync('npm run type-check', { stdio: 'pipe' })

    results.push({
      name: 'TypeScript 타입 체크',
      status: 'pass',
      message: '타입 오류 없음',
    })
  } catch (error: any) {
    const output = error.stdout?.toString() || error.toString()
    const errors = output
      .split('\n')
      .filter((line: string) => line.includes('error TS'))

    results.push({
      name: 'TypeScript 타입 체크',
      status: 'fail',
      message: `${errors.length}개의 타입 오류`,
      details: errors.slice(0, 5), // 처음 5개만 표시
    })
  }

  try {
    // ESLint 체크
    execSync('npm run lint', { stdio: 'pipe' })

    results.push({
      name: 'ESLint 검사',
      status: 'pass',
      message: 'Lint 오류 없음',
    })
  } catch (error: any) {
    const output = error.stdout?.toString() || ''
    const problems = output.match(/(\d+) problems?/)?.[1] || '알 수 없음'

    results.push({
      name: 'ESLint 검사',
      status: 'warning',
      message: `${problems}개의 경고/오류`,
    })
  }
}

// 6. API 엔드포인트 응답 검사
async function checkAPIEndpoints() {
  console.log(chalk.blue('🔍 주요 API 엔드포인트 검사 중...'))

  const endpoints = [
    '/api/main/posts',
    '/api/main/categories',
    '/api/communities',
    '/api/user/profile',
  ]

  const issues: string[] = []

  // 로컬에서는 실제 요청을 보낼 수 없으므로 파일 존재 여부만 체크
  for (const endpoint of endpoints) {
    const routePath = path.join(process.cwd(), 'app', endpoint, 'route.ts')
    if (!fs.existsSync(routePath)) {
      issues.push(`${endpoint}: route.ts 파일 없음`)
    }
  }

  results.push({
    name: 'API 엔드포인트 검사',
    status: issues.length > 0 ? 'warning' : 'pass',
    message:
      issues.length > 0
        ? `${issues.length}개 엔드포인트 문제`
        : '모든 엔드포인트 정상',
    details: issues,
  })
}

// 7. 프로덕션 최적화 검사
async function checkProductionOptimization() {
  console.log(chalk.blue('🔍 프로덕션 최적화 검사 중...'))

  const issues: string[] = []

  // next.config.js 검사
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf-8')

    if (!content.includes('swcMinify')) {
      issues.push('SWC 압축 미설정')
    }

    if (!content.includes('images')) {
      issues.push('이미지 최적화 미설정')
    }
  }

  // package.json 검사
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  )

  if (packageJson.dependencies['@next/bundle-analyzer']) {
    issues.push(
      '번들 분석기가 dependencies에 있음 (devDependencies로 이동 필요)'
    )
  }

  results.push({
    name: '프로덕션 최적화',
    status: issues.length > 0 ? 'warning' : 'pass',
    message:
      issues.length > 0
        ? `${issues.length}개의 최적화 제안`
        : '프로덕션 최적화 완료',
    details: issues,
  })
}

// 8. 보안 검사
async function checkSecurity() {
  console.log(chalk.blue('🔍 보안 검사 중...'))

  const issues: string[] = []

  // console.log 사용 검사
  const srcFiles = [
    ...fs.readdirSync(path.join(process.cwd(), 'app'), { recursive: true }),
    ...fs.readdirSync(path.join(process.cwd(), 'components'), {
      recursive: true,
    }),
    ...fs.readdirSync(path.join(process.cwd(), 'lib'), { recursive: true }),
  ] as string[]

  for (const file of srcFiles) {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const fullPath = file.includes('app/')
        ? path.join(process.cwd(), file)
        : file.includes('components/')
          ? path.join(process.cwd(), file)
          : path.join(process.cwd(), file)

      try {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // console.log 검사 (console.error, console.warn 제외)
        const consoleMatches = content.match(/console\.log/g)
        if (consoleMatches && consoleMatches.length > 0) {
          issues.push(`console.log 발견: ${file} (${consoleMatches.length}개)`)
        }

        // 하드코딩된 시크릿 검사
        if (
          content.includes('sk_') ||
          content.includes('pk_') ||
          content.includes('secret_') ||
          content.includes('api_key')
        ) {
          if (!content.includes('process.env')) {
            issues.push(`하드코딩된 시크릿 의심: ${file}`)
          }
        }
      } catch {
        // 파일 읽기 실패 무시
      }
    }
  }

  results.push({
    name: '보안 검사',
    status: issues.length > 0 ? 'warning' : 'pass',
    message:
      issues.length > 0 ? `${issues.length}개의 보안 경고` : '보안 검사 통과',
    details: issues.slice(0, 10), // 처음 10개만 표시
  })
}

// 메인 실행
async function main() {
  console.log(chalk.bold.cyan('\n🚀 프로덕션 배포 사전 검사 시작\n'))

  await checkEnvironmentVariables()
  await checkDatabaseConnection()
  await checkAPIRoutes()
  await checkServerComponents()
  await checkBuildErrors()
  await checkAPIEndpoints()
  await checkProductionOptimization()
  await checkSecurity()

  // 결과 출력
  console.log(chalk.bold.cyan('\n📊 검사 결과\n'))

  let hasFailure = false
  let hasWarning = false

  for (const result of results) {
    const icon =
      result.status === 'pass'
        ? '✅'
        : result.status === 'warning'
          ? '⚠️'
          : '❌'

    const color =
      result.status === 'pass'
        ? chalk.green
        : result.status === 'warning'
          ? chalk.yellow
          : chalk.red

    console.log(`${icon} ${color.bold(result.name)}: ${result.message}`)

    if (result.details && result.details.length > 0) {
      for (const detail of result.details) {
        console.log(`   ${chalk.gray('→')} ${detail}`)
      }
    }

    if (result.status === 'fail') hasFailure = true
    if (result.status === 'warning') hasWarning = true
  }

  // 최종 평가
  console.log(chalk.bold.cyan('\n📝 최종 평가\n'))

  if (hasFailure) {
    console.log(
      chalk.red.bold('❌ 프로덕션 배포 불가 - 실패 항목을 수정하세요')
    )
    process.exit(1)
  } else if (hasWarning) {
    console.log(
      chalk.yellow.bold('⚠️  프로덕션 배포 가능 - 경고 항목 검토 권장')
    )
  } else {
    console.log(chalk.green.bold('✅ 프로덕션 배포 준비 완료!'))
  }

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(chalk.red('검사 중 오류 발생:'), error)
  await prisma.$disconnect()
  process.exit(1)
})
