import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { z } from 'zod'

const checkDuplicateSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = checkDuplicateSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('유효하지 않은 요청입니다.', 400)
    }

    const { name, slug } = validation.data
    const duplicates: { name?: boolean; slug?: boolean } = {}

    if (name) {
      const existingByName = await prisma.community.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      })
      duplicates.name = !!existingByName
    }

    if (slug) {
      const existingBySlug = await prisma.community.findFirst({
        where: {
          slug: slug.toLowerCase(),
        },
      })
      duplicates.slug = !!existingBySlug
    }

    return successResponse({ duplicates })
  } catch (error) {
    console.error('중복 체크 오류:', error)
    return errorResponse('중복 체크 중 오류가 발생했습니다.', 500)
  }
}
