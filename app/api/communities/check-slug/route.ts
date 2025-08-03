import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse } from '@/lib/api-response'
import { handleError, throwValidationError } from '@/lib/error-handler'

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
      throw throwValidationError(validation.error.issues[0].message)
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
