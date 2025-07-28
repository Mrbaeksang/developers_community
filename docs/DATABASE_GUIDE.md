# 데이터베이스 개발 및 운영 가이드

## 🔧 개발 환경 (localhost:3000)

### 1. 초기 설정
```bash
# .env 파일 설정
DATABASE_URL="postgresql://user:password@localhost:5432/devdb"

# 데이터베이스 초기화
npx prisma migrate dev --name init
npx prisma db seed
```

### 2. 스키마 변경 워크플로우
```bash
# 1. schema.prisma 수정
# 2. 마이그레이션 생성 및 적용
npx prisma migrate dev --name add_new_feature

# 3. Prisma Client 재생성
npx prisma generate

# 4. 테스트 데이터 확인
npx prisma studio
```

### 3. 데이터 테스트
```bash
# Prisma Studio로 GUI 확인
npx prisma studio
# → http://localhost:5555

# 직접 API 테스트
curl http://localhost:3000/api/main/posts
```

## 🚀 프로덕션 환경 (Vercel)

### 1. 환경 변수 설정
```bash
# Vercel Dashboard → Settings → Environment Variables
DATABASE_URL="postgresql://..."  # Supabase/Neon URL
```

### 2. 배포 프로세스
```bash
# Git push 시 자동으로 실행됨:
# - npx prisma generate
# - npx prisma migrate deploy
```

### 3. 프로덕션 데이터 확인

#### 방법 1: Prisma Studio (임시)
```bash
# 로컬에서 프로덕션 DB 연결
DATABASE_URL="프로덕션_URL" npx prisma studio
```

#### 방법 2: 데이터베이스 대시보드
- **Supabase**: supabase.com → Table Editor
- **Neon**: console.neon.tech → SQL Editor
- **PlanetScale**: app.planetscale.com → Console

#### 방법 3: API 확인
```bash
# 프로덕션 API 호출
curl https://developers-community-two.vercel.app/api/main/posts
```

## 📋 개발 vs 프로덕션 관리

### 개발 환경
- ✅ 자유로운 스키마 변경 (`migrate dev`)
- ✅ 테스트 데이터 리셋 가능 (`migrate reset`)
- ✅ Seed 데이터 반복 실행
- ✅ Prisma Studio 상시 사용

### 프로덕션 환경
- ⚠️ 스키마 변경 신중히 (`migrate deploy`)
- ❌ 데이터 리셋 금지
- ❌ Seed 실행 금지
- ⚠️ 읽기 전용으로만 Prisma Studio 사용

## 🔄 일반적인 작업 흐름

```mermaid
graph LR
    A[로컬 개발] --> B[schema.prisma 수정]
    B --> C[migrate dev]
    C --> D[로컬 테스트]
    D --> E[Git push]
    E --> F[Vercel 자동 배포]
    F --> G[migrate deploy]
```

## ⚡ 유용한 명령어

```bash
# 현재 마이그레이션 상태 확인
npx prisma migrate status

# 스키마 검증
npx prisma validate

# 데이터베이스 리셋 (개발만!)
npx prisma migrate reset

# SQL 직접 실행
npx prisma db execute --file ./script.sql
```

## 🚨 주의사항

1. **프로덕션 DB 직접 수정 금지**
2. **백업 없이 migrate reset 금지**
3. **환경 변수 노출 주의**
4. **대량 데이터 작업 시 트랜잭션 사용**

## 📱 모바일에서 확인

프로덕션 사이트: https://developers-community-two.vercel.app

API 엔드포인트 예시:
- GET `/api/main/posts` - 게시글 목록
- GET `/api/main/categories` - 카테고리 목록
- GET `/api/main/tags` - 태그 목록