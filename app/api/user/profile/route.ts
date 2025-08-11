import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import {
  handleError,
  throwAuthenticationError,
  throwConflictError,
} from '@/lib/api/errors'
import { updateProfileSchema } from '@/lib/validations/user'
import { handleZodError } from '@/lib/api/validation-error'

export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throwAuthenticationError()
    }

    const body = await req.json()
    const parseResult = updateProfileSchema.safeParse(body)

    if (!parseResult.success) {
      return handleZodError(parseResult.error)
    }

    const validatedData = parseResult.data

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
