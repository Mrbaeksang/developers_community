import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireRoleAPI } from '@/lib/auth/session'
import { successResponse, createdResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'
import { withSecurity } from '@/lib/security/compatibility'

// 카테고리 목록 조회 + 새 카테고리 생성
export async function GET() {
  try {
    const result = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (result instanceof NextResponse) return result

    // 모든 카테고리 조회
    const categories = await prisma.mainCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return successResponse({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        icon: category.icon,
        order: category.order,
        isActive: category.isActive,
        requiresApproval: category.requiresApproval,
        postCount: category._count.posts,
      })),
    })
  } catch (error) {
    return handleError(error)
  }
}

// 새 카테고리 생성
async function createCategory(req: NextRequest) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result

    const body = await req.json()
    const { name, slug, description, color, icon, requiresApproval } = body

    // 필수 필드 검증
    if (!name || !slug) {
      throwValidationError('카테고리 이름과 슬러그는 필수입니다.')
    }

    // 슬러그 중복 확인
    const existingCategory = await prisma.mainCategory.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      throwValidationError('이미 존재하는 슬러그입니다.')
    }

    // 최대 order 값 조회
    const maxOrderCategory = await prisma.mainCategory.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    // 카테고리 생성
    const category = await prisma.mainCategory.create({
      data: {
        name,
        slug,
        description: description || '',
        color: color || '#6366f1',
        icon: icon || 'Folder',
        order: (maxOrderCategory?.order || 0) + 1,
        requiresApproval: requiresApproval ?? true,
      },
    })

    return createdResponse({ category }, '카테고리가 생성되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const POST = withSecurity(createCategory, { requireCSRF: true })
