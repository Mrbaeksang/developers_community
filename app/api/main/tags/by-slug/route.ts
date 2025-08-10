import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'

// GET /api/main/tags/by-slug?slug=tag-slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return errorResponse('Slug is required', 400)
    }

    const tag = await prisma.mainTag.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        postCount: true,
      },
    })

    if (!tag) {
      return errorResponse('Tag not found', 404)
    }

    return successResponse(tag)
  } catch (error) {
    return handleError(error)
  }
}
