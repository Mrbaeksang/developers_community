import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// DATABASE_URL 검증 - 빌드 타임과 런타임 구분
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Vercel 빌드 중이거나 개발 환경에서는 경고만
if (!process.env.DATABASE_URL && !process.env.BUILDING) {
  if (isProduction) {
    throw new Error('DATABASE_URL is required in production')
  }
  console.warn('DATABASE_URL is not defined')
}

// Prisma 클라이언트 생성
const createPrismaClient = () => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL

  if (!databaseUrl && isProduction) {
    throw new Error('No database connection string found')
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: isDevelopment ? ['error', 'warn'] : ['error'],
  })
}

// 명시적으로 DATABASE_URL 사용
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
