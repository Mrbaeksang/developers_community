import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api/response'
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
      const errors: Record<string, string[]> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
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
