import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'

const checkSlugSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = checkSlugSchema.safeParse(body)

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

    const { slug } = validation.data

    const existingCommunity = await prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    })

    return successResponse({
      available: !existingCommunity,
    })
  } catch (error) {
    return handleError(error)
  }
}
