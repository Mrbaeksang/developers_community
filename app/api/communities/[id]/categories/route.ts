import { prisma } from '@/lib/core/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole } from '@prisma/client'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'
import { communityCategorySelect } from '@/lib/cache/patterns'

// GET /api/communities/[id]/categories - 카테고리 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throw throwNotFoundError('커뮤니티를 찾을 수 없습니다.')
    }

    // 활성화된 카테고리만 조회 (순서대로)
    // 설정 페이지에서는 모든 카테고리를 보여줌
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'

    const categories = await prisma.communityCategory.findMany({
      where: {
        communityId: community.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: communityCategorySelect.list,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return successResponse(categories)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/communities/[id]/categories - 카테고리 생성 (관리자만)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    let { id } = resolvedParams

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throw throwNotFoundError('커뮤니티를 찾을 수 없습니다.')
    }

    // 실제 ID로 업데이트
    id = community.id

    // 관리자 권한 확인 (OWNER, ADMIN만 가능)
    const session = await requireCommunityRoleAPI(id, [CommunityRole.ADMIN])
    if (session instanceof Response) {
      return session
    }

    const body = await request.json()
    const {
      name,
      slug: customSlug,
      description,
      color = '#6366f1',
      order = 0,
    } = body

    if (!name?.trim()) {
      throw throwValidationError('카테고리 이름은 필수입니다.')
    }

    // slug 생성 또는 사용자 지정 slug 사용
    const slug =
      customSlug ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^가-힣a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // 색상 형식 검증
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(color)) {
      throw throwValidationError('올바른 색상 형식이 아닙니다. (#RRGGBB)')
    }

    // 중복 확인 (같은 커뮤니티 내에서)
    const existing = await prisma.communityCategory.findFirst({
      where: {
        communityId: id,
        OR: [{ name: name.trim() }, { slug }],
      },
    })

    if (existing) {
      throw throwValidationError('이미 존재하는 카테고리입니다.')
    }

    const category = await prisma.communityCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim(),
        color,
        order,
        communityId: id,
      },
    })

    return successResponse({ category }, undefined, 201)
  } catch (error) {
    return handleError(error)
  }
}
