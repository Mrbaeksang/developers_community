import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Prisma 모델명 매핑 (camelCase)
const TABLE_MAP: Record<string, string> = {
  User: 'user',
  Account: 'account',
  Session: 'session',
  MainCategory: 'mainCategory',
  MainPost: 'mainPost',
  MainComment: 'mainComment',
  MainTag: 'mainTag',
  MainPostTag: 'mainPostTag',
  MainLike: 'mainLike',
  MainBookmark: 'mainBookmark',
  Community: 'community',
  CommunityCategory: 'communityCategory',
  CommunityMember: 'communityMember',
  CommunityPost: 'communityPost',
  CommunityComment: 'communityComment',
  CommunityLike: 'communityLike',
  CommunityBookmark: 'communityBookmark',
  CommunityAnnouncement: 'communityAnnouncement',
  Notification: 'notification',
  File: 'file',
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || !['ADMIN', 'MANAGER'].includes(user.globalRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { table } = await context.params
    const modelName = TABLE_MAP[table]

    if (!modelName) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const limit = 50

    // 검색 조건 구성 (id나 name 필드가 있는 경우)
    let where = {}
    if (search) {
      // 간단한 검색 구현 (id, name, email, title 등 일반적인 필드)
      const searchFields = []

      // 각 모델별 검색 가능한 필드 정의
      if (['user'].includes(modelName)) {
        searchFields.push({ email: { contains: search, mode: 'insensitive' } })
        searchFields.push({ name: { contains: search, mode: 'insensitive' } })
      } else if (['mainPost', 'communityPost'].includes(modelName)) {
        searchFields.push({ title: { contains: search, mode: 'insensitive' } })
      } else if (
        ['mainCategory', 'communityCategory', 'mainTag'].includes(modelName)
      ) {
        searchFields.push({ name: { contains: search, mode: 'insensitive' } })
      } else if (['community'].includes(modelName)) {
        searchFields.push({ name: { contains: search, mode: 'insensitive' } })
      }

      if (searchFields.length > 0) {
        where = { OR: searchFields }
      } else {
        // ID로 검색 시도
        if (search.length === 24 || search.length === 36) {
          // MongoDB ObjectId or UUID
          where = { id: search }
        }
      }
    }

    // 전체 개수 조회
    // @ts-expect-error Prisma dynamic model access
    const total = await prisma[modelName].count({ where })

    // 데이터 조회
    // @ts-expect-error Prisma dynamic model access
    const data = await prisma[modelName].findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    })

    // 컬럼 추출 (첫 번째 데이터로부터)
    const columns = data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({
      data,
      columns,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    console.error('Data viewer error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
