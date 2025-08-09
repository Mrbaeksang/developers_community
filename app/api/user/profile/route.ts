import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import {
  handleError,
  throwAuthenticationError,
  throwConflictError,
} from '@/lib/api/errors'

const profileSchema = z.object({
  name: z.string().max(50).optional(),
  username: z
    .string()
    .max(30)
    .regex(/^[a-zA-Z0-9_]*$/)
    .optional(),
  bio: z.string().max(200).optional(),
  image: z.string().url().optional().or(z.literal('')),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throwAuthenticationError()
    }

    const body = await req.json()
    const validatedData = profileSchema.parse(body)

    // username 중복 체크
    if (validatedData.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          NOT: { id: session.user.id },
        },
      })

      if (existing) {
        throwConflictError('이미 사용중인 사용자명입니다')
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name || null,
        username: validatedData.username || null,
        bio: validatedData.bio || null,
        image: validatedData.image || null,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    return handleError(error)
  }
}
