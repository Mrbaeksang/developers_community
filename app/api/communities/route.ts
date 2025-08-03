import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuthAPI } from '@/lib/auth-utils'
import {
  CommunityVisibility,
  CommunityRole,
  MembershipStatus,
} from '@prisma/client'
import {
  paginatedResponse,
  errorResponse,
  createdResponse,
} from '@/lib/api-response'
import { handleError, ApiError } from '@/lib/error-handler'

// GET: 커뮤니티 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const visibility = searchParams.get('visibility') as
      | 'PUBLIC'
      | 'PRIVATE'
      | null

    const skip = (page - 1) * limit

    // 검색 조건 구성
    const where: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
      }>
      visibility?: CommunityVisibility
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (
      visibility &&
      Object.values(CommunityVisibility).includes(
        visibility as CommunityVisibility
      )
    ) {
      where.visibility = visibility as CommunityVisibility
    }

    // 커뮤니티 목록 조회
    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: {
                where: {
                  status: MembershipStatus.ACTIVE,
                },
              },
              posts: true,
            },
          },
        },
      }),
      prisma.community.count({ where }),
    ])

    return paginatedResponse(communities, page, limit, total)
  } catch (error) {
    return handleError(error)
  }
}

// POST: 커뮤니티 생성
const createCommunitySchema = z.object({
  name: z.string().min(2, '커뮤니티 이름은 2자 이상이어야 합니다.').max(50),
  slug: z
    .string()
    .min(2, 'URL 슬러그는 2자 이상이어야 합니다.')
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      'URL 슬러그는 소문자, 숫자, 하이픈만 사용할 수 있습니다.'
    ),
  description: z.string().max(500).optional(),
  rules: z.string().max(5000).optional(),
  avatar: z.string().optional().or(z.literal('')),
  banner: z.string().optional().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  allowFileUpload: z.boolean().default(true),
  allowChat: z.boolean().default(true),
  maxFileSize: z.number().min(1048576).max(104857600).default(10485760), // 1MB ~ 100MB, default 10MB
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const body = await req.json()
    const validation = createCommunitySchema.safeParse(body)

    if (!validation.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        400,
        validation.error.issues[0].message
      )
    }

    const {
      name,
      slug,
      description,
      rules,
      avatar,
      banner,
      visibility,
      allowFileUpload,
      allowChat,
      maxFileSize,
    } = validation.data

    // 중복 체크
    const existingCommunity = await prisma.community.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existingCommunity) {
      return errorResponse('이미 존재하는 커뮤니티 이름 또는 URL입니다.', 400)
    }

    // session.user.id는 checkAuth에서 이미 확인됨
    const userId = session.user.id

    // 커뮤니티 생성
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description,
        rules,
        avatar,
        banner,
        visibility,
        allowFileUpload,
        allowChat,
        maxFileSize,
        ownerId: userId,
        // 생성자를 자동으로 OWNER 멤버로 추가
        members: {
          create: {
            userId: userId,
            role: CommunityRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        },
        // 기본 카테고리 생성
        categories: {
          create: [
            {
              name: '일반',
              slug: 'general',
              order: 0,
              isActive: true,
            },
            {
              name: '공지사항',
              slug: 'announcements',
              order: 1,
              isActive: true,
            },
          ],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    })

    // memberCount 업데이트
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: 1 },
    })

    return createdResponse(community, '커뮤니티가 생성되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}
