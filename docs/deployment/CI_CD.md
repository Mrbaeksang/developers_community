# 🔄 CI/CD 자동화

## 📋 목차
- [GitHub Actions 구성](#github-actions-구성)
- [테스트 자동화](#테스트-자동화)
- [배포 파이프라인](#배포-파이프라인)
- [코드 품질 관리](#코드-품질-관리)
- [보안 스캔](#보안-스캔)

---

## GitHub Actions 구성

### 🏗️ 워크플로우 구조

```
.github/
├── workflows/
│   ├── ci.yml          # PR 검증
│   ├── deploy.yml      # 프로덕션 배포
│   ├── preview.yml     # 미리보기 배포
│   ├── test.yml        # 테스트 실행
│   └── codeql.yml      # 보안 분석
├── dependabot.yml      # 의존성 업데이트
└── CODEOWNERS         # 코드 소유자
```

---

## 테스트 자동화

### 🧪 CI 워크플로우

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Check formatting
        run: npm run format:check

  typecheck:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npm run db:generate
      
      - name: Type check
        run: npm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/testdb
      NEXTAUTH_SECRET: test-secret
      NEXTAUTH_URL: http://localhost:3000
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: |
          npm run db:push
          npm run db:generate
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 배포 파이프라인

### 🚀 프로덕션 배포

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    uses: ./.github/workflows/ci.yml
    secrets: inherit

  deploy:
    name: Deploy to Vercel
    needs: test
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://devcom.kr
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        id: deploy
        run: |
          DEPLOYMENT_URL=$(vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Deployed to production: ${{ steps.deploy.outputs.url }}'
            })
      
      - name: Create Release
        if: success()
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: |
            ## Changes
            ${{ github.event.head_commit.message }}
            
            ## Deployment
            - URL: ${{ steps.deploy.outputs.url }}
            - Commit: ${{ github.sha }}
```

### 🔍 미리보기 배포

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Deploy to Vercel
        id: deploy
        run: |
          DEPLOYMENT_URL=$(vercel deploy --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
      
      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            const comment = `
            ### 🔍 Preview Deployment
            
            **URL**: ${{ steps.deploy.outputs.url }}
            **Status**: ✅ Ready
            
            | Check | Status |
            |-------|--------|
            | Build | ✅ Passed |
            | Tests | ✅ Passed |
            | Preview | ✅ Deployed |
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            })
```

---

## 코드 품질 관리

### 📊 품질 검사

```yaml
# .github/workflows/quality.yml
name: Code Quality

on:
  pull_request:
    branches: [main, develop]

jobs:
  sonarcloud:
    name: SonarCloud
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  bundle-size:
    name: Bundle Size
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and analyze
        run: |
          npm run build
          npm run analyze
      
      - name: Check bundle size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          build_script: build
          skip_step: install

  lighthouse:
    name: Lighthouse CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/main/posts
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## 보안 스캔

### 🔒 보안 검사

```yaml
# .github/workflows/security.yml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # 매주 월요일

jobs:
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Dependency Review
        uses: actions/dependency-review-action@v3
        with:
          fail-on-severity: moderate

  secrets-scan:
    name: Secrets Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: TruffleHog OSS
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

### 🔄 의존성 업데이트

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    groups:
      radix-ui:
        patterns:
          - "@radix-ui/*"
      tanstack:
        patterns:
          - "@tanstack/*"
    ignore:
      - dependency-name: "next"
        versions: ["canary", "rc"]
    labels:
      - "dependencies"
      - "javascript"
    commit-message:
      prefix: "deps"
      include: "scope"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    labels:
      - "github-actions"
    commit-message:
      prefix: "ci"
```

---

## 📊 모니터링 대시보드

### GitHub Actions 상태

```yaml
# README.md 뱃지
![CI](https://github.com/user/repo/workflows/CI/badge.svg)
![Deploy](https://github.com/user/repo/workflows/Deploy/badge.svg)
![Security](https://github.com/user/repo/workflows/Security/badge.svg)
```

### 알림 설정

```yaml
# .github/workflows/notify.yml
name: Notify

on:
  workflow_run:
    workflows: ["Deploy Production"]
    types:
      - completed

jobs:
  notify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '배포 실패! 확인이 필요합니다.'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🚦 브랜치 보호 규칙

### main 브랜치 설정

```json
{
  "protection_rules": {
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "lint",
        "typecheck",
        "test",
        "e2e"
      ]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true
  }
}
```

---

## 🎯 성능 지표

### 빌드 시간 최적화

```yaml
# 캐시 전략
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-

# 병렬 실행
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, windows-latest]
```

### 비용 최적화

```yaml
# Self-hosted runners (비용 절감)
runs-on: [self-hosted, linux, x64]

# 조건부 실행
if: |
  github.event_name == 'push' ||
  (github.event_name == 'pull_request' && github.event.pull_request.draft == false)
```